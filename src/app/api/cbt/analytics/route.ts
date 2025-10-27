import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/cbt/analytics - Get CBT analytics for admin dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d'; // 7d, 30d, 90d

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Exercise usage analytics
    const exerciseUsage = await (prisma as any).cBTSession.groupBy({
      by: ['exerciseId'],
      where: {
        startedAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
      _avg: {
        score: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Get exercise details for the usage data
    const exerciseIds = exerciseUsage.map((usage: any) => usage.exerciseId);
    const exercises = await prisma.cBTExercise.findMany({
      where: {
        id: {
          in: exerciseIds,
        },
      },
      select: {
        id: true,
        title: true,
        category: true,
        difficulty: true,
      },
    });

    const exerciseMap = exercises.reduce((acc, ex) => {
      acc[ex.id] = ex;
      return acc;
    }, {} as Record<string, any>);

    // User engagement metrics
    const totalSessions = await (prisma as any).cBTSession.count({
      where: {
        startedAt: {
          gte: startDate,
        },
      },
    });

    const completedSessions = await (prisma as any).cBTSession.count({
      where: {
        startedAt: {
          gte: startDate,
        },
        isCompleted: true,
      },
    });

    const uniqueUsers = await (prisma as any).cBTSession.findMany({
      where: {
        startedAt: {
          gte: startDate,
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    // Category performance
    const categoryStats = await (prisma as any).cBTSession.groupBy({
      by: ['exercise'],
      where: {
        startedAt: {
          gte: startDate,
        },
        isCompleted: true,
      },
      _count: {
        id: true,
      },
      _avg: {
        score: true,
      },
    });

    // Calculate category averages
    const categoryPerformance = categoryStats.reduce((acc: any, stat: any) => {
      const category = stat.exercise?.category;
      if (category) {
        if (!acc[category]) {
          acc[category] = { sessions: 0, totalScore: 0, count: 0 };
        }
        acc[category].sessions += stat._count.id;
        if (stat._avg.score) {
          acc[category].totalScore += stat._avg.score * stat._count.id;
          acc[category].count += stat._count.id;
        }
      }
      return acc;
    }, {});

    // Format category performance
    const formattedCategoryPerformance = Object.entries(categoryPerformance).map(([category, data]: [string, any]) => ({
      category,
      sessions: data.sessions,
      avgScore: data.count > 0 ? Math.round((data.totalScore / data.count) * 10) / 10 : 0,
    }));

    // Daily activity for the last 30 days
    const dailyActivity = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const sessions = await (prisma as any).cBTSession.count({
        where: {
          startedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      dailyActivity.push({
        date: date.toISOString().split('T')[0],
        sessions,
      });
    }

    return NextResponse.json({
      overview: {
        totalSessions,
        completedSessions,
        completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
        uniqueUsers: uniqueUsers.length,
        avgSessionsPerUser: uniqueUsers.length > 0 ? Math.round((totalSessions / uniqueUsers.length) * 10) / 10 : 0,
      },
      topExercises: exerciseUsage.map((usage: any) => ({
        exercise: exerciseMap[usage.exerciseId],
        sessions: usage._count.id,
        avgScore: usage._avg.score ? Math.round(usage._avg.score * 10) / 10 : null,
      })),
      categoryPerformance: formattedCategoryPerformance,
      dailyActivity,
      timeframe,
    });
  } catch (error) {
    console.error('Error fetching CBT analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}