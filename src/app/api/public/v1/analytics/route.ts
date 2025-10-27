import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

interface AnalyticsData {
  moodTrends?: any;
  cbtProgress?: any;
  engagement?: any;
  wellnessCorrelation?: any;
}

const getAnalyticsSchema = z.object({
  userId: z.string(),
  metrics: z.array(z.enum(['mood_trends', 'cbt_progress', 'engagement', 'wellness_correlation'])).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// GET /api/public/v1/analytics - Get user analytics
export async function GET(request: NextRequest) {
  try {
    // API key authentication
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.PUBLIC_API_KEY) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const queryParams = getAnalyticsSchema.parse({
      userId,
      metrics: searchParams.get('metrics')?.split(','),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    });

    const startDate = queryParams.startDate ? new Date(queryParams.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = queryParams.endDate ? new Date(queryParams.endDate) : new Date();

    const requestedMetrics = queryParams.metrics || ['mood_trends', 'cbt_progress', 'engagement'];

    const analytics: AnalyticsData = {};

    // Mood trends analysis
    if (requestedMetrics.includes('mood_trends')) {
      analytics.moodTrends = await getMoodTrends(userId, startDate, endDate);
    }

    // CBT progress analysis
    if (requestedMetrics.includes('cbt_progress')) {
      analytics.cbtProgress = await getCBTProgress(userId, startDate, endDate);
    }

    // Engagement metrics
    if (requestedMetrics.includes('engagement')) {
      analytics.engagement = await getEngagementMetrics(userId, startDate, endDate);
    }

    // Wellness correlation (if wearable data available)
    if (requestedMetrics.includes('wellness_correlation')) {
      analytics.wellnessCorrelation = await getWellnessCorrelation(userId, startDate, endDate);
    }

    return NextResponse.json({
      userId,
      period: { startDate, endDate },
      analytics,
      generatedAt: new Date(),
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions for analytics
async function getMoodTrends(userId: string, startDate: Date, endDate: Date) {
  const moodEntries = await prisma.moodEntry.findMany({
    where: {
      userId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { timestamp: 'asc' },
  });

  if (moodEntries.length === 0) {
    return { averageMood: 0, trend: 'insufficient_data', entries: [] };
  }

  const averageMood = moodEntries.reduce((sum, entry) => sum + entry.moodLevel, 0) / moodEntries.length;

  // Calculate trend (simplified)
  const firstHalf = moodEntries.slice(0, Math.floor(moodEntries.length / 2));
  const secondHalf = moodEntries.slice(Math.floor(moodEntries.length / 2));

  const firstHalfAvg = firstHalf.reduce((sum, entry) => sum + entry.moodLevel, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, entry) => sum + entry.moodLevel, 0) / secondHalf.length;

  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (secondHalfAvg > firstHalfAvg + 0.5) trend = 'improving';
  else if (secondHalfAvg < firstHalfAvg - 0.5) trend = 'declining';

  return {
    averageMood: Math.round(averageMood * 10) / 10,
    trend,
    totalEntries: moodEntries.length,
    dateRange: {
      earliest: moodEntries[0]?.timestamp,
      latest: moodEntries[moodEntries.length - 1]?.timestamp,
    },
  };
}

async function getCBTProgress(userId: string, startDate: Date, endDate: Date) {
  const sessions = await prisma.cBTSession.findMany({
    where: {
      userId,
      startedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      exercise: {
        select: { category: true, difficulty: true },
      },
    },
  });

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.isCompleted).length;
  const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  // Category breakdown
  const categoryStats: Record<string, { total: number; completed: number }> = {};
  sessions.forEach(session => {
    const category = session.exercise.category;
    if (!categoryStats[category]) {
      categoryStats[category] = { total: 0, completed: 0 };
    }
    categoryStats[category].total++;
    if (session.isCompleted) {
      categoryStats[category].completed++;
    }
  });

  // Average score
  const scoredSessions = sessions.filter(s => s.score !== null);
  const averageScore = scoredSessions.length > 0
    ? scoredSessions.reduce((sum, s) => sum + (s.score || 0), 0) / scoredSessions.length
    : 0;

  return {
    totalSessions,
    completedSessions,
    completionRate: Math.round(completionRate),
    averageScore: Math.round(averageScore),
    categoryBreakdown: categoryStats,
    streakData: await calculateCBTStreak(userId),
  };
}

async function getEngagementMetrics(userId: string, startDate: Date, endDate: Date) {
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Mood entries per day
  const moodEntries = await prisma.moodEntry.count({
    where: {
      userId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // CBT sessions per day
  const cbtSessions = await prisma.cBTSession.count({
    where: {
      userId,
      startedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Conversation messages per day
  const conversations = await prisma.conversation.findMany({
    where: {
      userId,
      startAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      _count: {
        select: { messages: true },
      },
    },
  });

  const totalMessages = conversations.reduce((sum, conv) => sum + conv._count.messages, 0);

  return {
    periodDays: daysDiff,
    moodEntriesPerDay: Math.round((moodEntries / daysDiff) * 10) / 10,
    cbtSessionsPerDay: Math.round((cbtSessions / daysDiff) * 10) / 10,
    messagesPerDay: Math.round((totalMessages / daysDiff) * 10) / 10,
    totalEngagement: moodEntries + cbtSessions + totalMessages,
    engagementScore: calculateEngagementScore(moodEntries, cbtSessions, totalMessages, daysDiff),
  };
}

async function getWellnessCorrelation(userId: string, startDate: Date, endDate: Date) {
  // This would integrate with wearable data
  // For now, return mock correlation data
  return {
    moodActivityCorrelation: 0.65, // Correlation coefficient
    sleepQualityMoodCorrelation: 0.72,
    stressLevelEngagementCorrelation: -0.45, // Negative correlation
    insights: [
      'Higher activity levels correlate with improved mood',
      'Better sleep quality predicts better next-day mood',
      'Elevated stress levels may reduce engagement with therapeutic activities',
    ],
    recommendations: [
      'Consider maintaining consistent physical activity',
      'Prioritize sleep hygiene for mood stability',
      'Monitor stress levels and use coping strategies during high-stress periods',
    ],
  };
}

function calculateEngagementScore(moodEntries: number, cbtSessions: number, messages: number, days: number): number {
  const moodScore = Math.min(moodEntries / days * 10, 10); // Max 10 points for daily mood tracking
  const cbtScore = Math.min(cbtSessions / days * 15, 15); // Max 15 points for CBT practice
  const conversationScore = Math.min(messages / days * 5, 5); // Max 5 points for conversations

  const totalScore = moodScore + cbtScore + conversationScore;
  return Math.min(Math.round(totalScore), 30); // Max 30 points
}

async function calculateCBTStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: Date | null;
}> {
  const sessions = await prisma.cBTSession.findMany({
    where: {
      userId,
      isCompleted: true,
    },
    orderBy: { completedAt: 'desc' },
    take: 100, // Last 100 completed sessions
  });

  if (sessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastCompletedDate: null };
  }

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const session of sessions) {
    if (!session.completedAt) continue;

    const sessionDate = new Date(session.completedAt);
    sessionDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === currentStreak) {
      currentStreak++;
    } else if (daysDiff > currentStreak) {
      break; // Gap in streak
    }
  }

  // Calculate longest streak (simplified)
  const uniqueDates = Array.from(new Set(sessions.map(s => {
    const date = new Date(s.completedAt!);
    return date.toDateString();
  })));

  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i - 1]);
    const currDate = new Date(uniqueDates[i]);
    const diffTime = currDate.getTime() - prevDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    currentStreak,
    longestStreak,
    lastCompletedDate: sessions[0]?.completedAt || null,
  };
}