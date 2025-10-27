import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/user/export - Export user's CBT data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json, csv
    const includeMood = searchParams.get('includeMood') === 'true';
    const includeSessions = searchParams.get('includeSessions') === 'true';

    const exportData: any = {
      userId: session.user.id,
      exportDate: new Date().toISOString(),
      data: {},
    };

    // Export mood entries if requested
    if (includeMood) {
      const moodEntries = await prisma.moodEntry.findMany({
        where: { userId: session.user.id },
        orderBy: { timestamp: 'asc' },
      });

      exportData.data.moodEntries = moodEntries.map(entry => ({
        id: entry.id,
        moodLevel: entry.moodLevel,
        notes: entry.notes,
        factors: entry.factors,
        timestamp: entry.timestamp,
      }));
    }

    // Export CBT sessions if requested
    if (includeSessions) {
      const cbtSessions = await (prisma as any).cBTSession.findMany({
        where: { userId: session.user.id },
        include: {
          exercise: {
            select: {
              id: true,
              title: true,
              category: true,
              difficulty: true,
            },
          },
        },
        orderBy: { startedAt: 'asc' },
      });

      exportData.data.cbtSessions = cbtSessions.map((session: any) => ({
        id: session.id,
        exercise: session.exercise,
        progress: session.progress,
        isCompleted: session.isCompleted,
        score: session.score,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
      }));
    }

    // Generate summary statistics
    exportData.summary = {};

    if (includeMood && exportData.data.moodEntries) {
      const moodEntries = exportData.data.moodEntries;
      exportData.summary.moodStats = {
        totalEntries: moodEntries.length,
        averageMood: moodEntries.length > 0
          ? Math.round((moodEntries.reduce((sum: number, entry: any) => sum + entry.moodLevel, 0) / moodEntries.length) * 10) / 10
          : 0,
        dateRange: {
          first: moodEntries.length > 0 ? moodEntries[0].timestamp : null,
          last: moodEntries.length > 0 ? moodEntries[moodEntries.length - 1].timestamp : null,
        },
      };
    }

    if (includeSessions && exportData.data.cbtSessions) {
      const sessions = exportData.data.cbtSessions;
      const completedSessions = sessions.filter((s: any) => s.isCompleted);

      exportData.summary.cbtStats = {
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
        completionRate: sessions.length > 0 ? Math.round((completedSessions.length / sessions.length) * 100) : 0,
        averageScore: completedSessions.length > 0
          ? Math.round((completedSessions.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / completedSessions.length) * 10) / 10
          : 0,
        exercisesAttempted: [...new Set(sessions.map((s: any) => s.exercise.id))].length,
        categoryBreakdown: sessions.reduce((acc: any, session: any) => {
          const category = session.exercise.category;
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {}),
      };
    }

    // Format response based on requested format
    if (format === 'csv') {
      let csvContent = '';

      // Mood entries CSV
      if (includeMood && exportData.data.moodEntries) {
        csvContent += 'Mood Entries\n';
        csvContent += 'Date,Mood Level,Notes,Factors\n';
        exportData.data.moodEntries.forEach((entry: any) => {
          csvContent += `${entry.timestamp},${entry.moodLevel},"${entry.notes || ''}","${entry.factors || ''}"\n`;
        });
        csvContent += '\n';
      }

      // CBT sessions CSV
      if (includeSessions && exportData.data.cbtSessions) {
        csvContent += 'CBT Sessions\n';
        csvContent += 'Exercise,Category,Difficulty,Started,Completed,Score,Is Completed\n';
        exportData.data.cbtSessions.forEach((session: any) => {
          csvContent += `"${session.exercise.title}","${session.exercise.category}","${session.exercise.difficulty}",${session.startedAt},${session.completedAt || ''},${session.score || ''},${session.isCompleted}\n`;
        });
      }

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="mental-health-data-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Default JSON response
    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="mental-health-data-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}