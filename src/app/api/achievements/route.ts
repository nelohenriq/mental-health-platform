import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/achievements - Get user's achievements and milestones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's CBT session stats
    const sessionStats = await (prisma as any).cBTSession.groupBy({
      by: ['userId'],
      where: { userId: session.user.id },
      _count: {
        id: true,
      },
      _sum: {
        score: true,
      },
    });

    const moodEntriesCount = await prisma.moodEntry.count({
      where: { userId: session.user.id },
    });

    const completedSessions = await (prisma as any).cBTSession.count({
      where: {
        userId: session.user.id,
        isCompleted: true,
      },
    });

    // Calculate achievements based on stats
    const stats = sessionStats[0] || { _count: { id: 0 }, _sum: { score: 0 } };
    const totalSessions = stats._count.id;
    const totalScore = stats._sum.score || 0;

    const achievements = [
      {
        id: 'first_exercise',
        title: 'First Steps',
        description: 'Complete your first CBT exercise',
        icon: '🎯',
        unlocked: totalSessions >= 1,
        progress: Math.min(totalSessions, 1),
        target: 1,
        category: 'cbt',
      },
      {
        id: 'five_exercises',
        title: 'Getting Started',
        description: 'Complete 5 CBT exercises',
        icon: '⭐',
        unlocked: totalSessions >= 5,
        progress: Math.min(totalSessions, 5),
        target: 5,
        category: 'cbt',
      },
      {
        id: 'ten_exercises',
        title: 'Dedicated Learner',
        description: 'Complete 10 CBT exercises',
        icon: '🏆',
        unlocked: totalSessions >= 10,
        progress: Math.min(totalSessions, 10),
        target: 10,
        category: 'cbt',
      },
      {
        id: 'consistency_week',
        title: 'Weekly Warrior',
        description: 'Complete exercises for 7 consecutive days',
        icon: '📅',
        unlocked: false, // Would need streak calculation
        progress: 0,
        target: 7,
        category: 'consistency',
      },
      {
        id: 'mood_tracker',
        title: 'Mood Observer',
        description: 'Log your mood 10 times',
        icon: '📊',
        unlocked: moodEntriesCount >= 10,
        progress: Math.min(moodEntriesCount, 10),
        target: 10,
        category: 'mood',
      },
      {
        id: 'high_scorer',
        title: 'Excellence Achiever',
        description: 'Score 90+ on 5 exercises',
        icon: '💎',
        unlocked: false, // Would need score analysis
        progress: 0,
        target: 5,
        category: 'performance',
      },
      {
        id: 'explorer',
        title: 'Category Explorer',
        description: 'Try exercises from 5 different categories',
        icon: '🗺️',
        unlocked: false, // Would need category diversity check
        progress: 0,
        target: 5,
        category: 'exploration',
      },
      {
        id: 'perfect_week',
        title: 'Perfect Week',
        description: 'Complete all planned exercises in a week',
        icon: '🌟',
        unlocked: false,
        progress: 0,
        target: 7,
        category: 'consistency',
      },
    ];

    // Calculate milestones (longer-term goals)
    const milestones = [
      {
        id: 'month_streak',
        title: 'Monthly Master',
        description: 'Maintain daily activity for 30 days',
        icon: '👑',
        progress: 0, // Would calculate current streak
        target: 30,
        category: 'consistency',
        reward: 'Special badge and recognition',
      },
      {
        id: 'therapist_level',
        title: 'Therapy Expert',
        description: 'Complete 50 CBT exercises',
        icon: '🎓',
        progress: totalSessions,
        target: 50,
        category: 'cbt',
        reward: 'Advanced exercise access',
      },
      {
        id: 'wellness_champion',
        title: 'Wellness Champion',
        description: 'Achieve perfect scores on 25 exercises',
        icon: '🏅',
        progress: 0, // Would count high scores
        target: 25,
        category: 'performance',
        reward: 'Exclusive content access',
      },
      {
        id: 'community_helper',
        title: 'Community Helper',
        description: 'Help improve the platform through feedback',
        icon: '🤝',
        progress: 0, // Would track feedback submissions
        target: 1,
        category: 'community',
        reward: 'Beta feature access',
      },
    ];

    // Calculate overall progress
    const unlockedAchievements = achievements.filter(a => a.unlocked).length;
    const totalAchievements = achievements.length;
    const achievementProgress = (unlockedAchievements / totalAchievements) * 100;

    return NextResponse.json({
      achievements,
      milestones,
      stats: {
        totalSessions,
        completedSessions,
        totalScore,
        moodEntries: moodEntriesCount,
        unlockedAchievements,
        totalAchievements,
        achievementProgress: Math.round(achievementProgress),
      },
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}