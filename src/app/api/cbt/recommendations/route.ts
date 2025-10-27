import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/cbt/recommendations - Get personalized CBT exercise recommendations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's mood history for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        userId: session.user.id,
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Get user's completed CBT sessions
    const completedSessions = await prisma.cBTSession.findMany({
      where: {
        userId: session.user.id,
        isCompleted: true,
      },
      include: {
        exercise: {
          select: {
            id: true,
            category: true,
            difficulty: true,
          },
        },
      },
    });

    // Calculate average mood level
    const avgMood = moodEntries.length > 0
      ? moodEntries.reduce((sum, entry) => sum + entry.moodLevel, 0) / moodEntries.length
      : 5;

    // Determine mood trend (simplified)
    const recentMoods = moodEntries.slice(0, 7); // Last 7 entries
    const moodTrend = recentMoods.length > 1
      ? recentMoods[0].moodLevel - recentMoods[recentMoods.length - 1].moodLevel
      : 0;

    // Count completed exercises by category
    const categoryCounts = completedSessions.reduce((acc, session) => {
      const category = session.exercise.category;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Determine difficulty level based on completed exercises
    const totalCompleted = completedSessions.length;
    let recommendedDifficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' = 'BEGINNER';

    if (totalCompleted > 10) {
      recommendedDifficulty = 'ADVANCED';
    } else if (totalCompleted > 5) {
      recommendedDifficulty = 'INTERMEDIATE';
    }

    // Generate recommendations based on mood and history
    let recommendedCategories: ('THOUGHT_CHALLENGING' | 'BEHAVIOR_ACTIVATION' | 'RELAXATION' | 'MINDFULNESS' | 'COGNITIVE_RESTRUCTURING' | 'EXPOSURE' | 'PROBLEM_SOLVING' | 'COMMUNICATION')[] = [];

    if (avgMood < 4) {
      // Low mood - focus on behavioral activation and relaxation
      recommendedCategories = ['BEHAVIOR_ACTIVATION', 'RELAXATION', 'MINDFULNESS'];
    } else if (moodTrend < -1) {
      // Declining mood - cognitive restructuring and thought challenging
      recommendedCategories = ['COGNITIVE_RESTRUCTURING', 'THOUGHT_CHALLENGING', 'PROBLEM_SOLVING'];
    } else if (avgMood > 7) {
      // High mood - maintenance and advanced skills
      recommendedCategories = ['MINDFULNESS', 'COMMUNICATION', 'EXPOSURE'];
    } else {
      // Moderate mood - general CBT exercises
      recommendedCategories = ['THOUGHT_CHALLENGING', 'BEHAVIOR_ACTIVATION', 'RELAXATION'];
    }

    // Prioritize categories user hasn't done much
    const sortedCategories = recommendedCategories.sort((a, b) => {
      const countA = categoryCounts[a] || 0;
      const countB = categoryCounts[b] || 0;
      return countA - countB; // Fewer completed exercises first
    });

    // Get recommended exercises
    const recommendations = await prisma.cBTExercise.findMany({
      where: {
        isActive: true,
        category: {
          in: sortedCategories.slice(0, 2), // Top 2 categories
        },
        difficulty: recommendedDifficulty,
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    // If not enough recommendations, add from other difficulties
    if (recommendations.length < 3) {
      const additionalExercises = await prisma.cBTExercise.findMany({
        where: {
          isActive: true,
          category: {
            in: sortedCategories,
          },
          difficulty: recommendedDifficulty === 'BEGINNER' ? 'INTERMEDIATE' : 'BEGINNER',
        },
        take: 3 - recommendations.length,
        orderBy: { createdAt: 'desc' },
      });
      recommendations.push(...additionalExercises);
    }

    return NextResponse.json({
      recommendations,
      insights: {
        averageMood: Math.round(avgMood * 10) / 10,
        moodTrend,
        totalCompletedExercises: totalCompleted,
        recommendedDifficulty,
        focusCategories: sortedCategories.slice(0, 2),
      },
    });
  } catch (error) {
    console.error('Error generating CBT recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}