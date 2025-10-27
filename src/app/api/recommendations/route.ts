import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPersonalizationEngine } from '@/lib/ai/personalization';

import { CBTExerciseCategory } from '@prisma/client';

interface CBTRecommendation {
  id: string;
  title: string;
  description: string | null;
  category: CBTExerciseCategory;
  difficulty: string;
}

interface CopingStrategy {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedTime: number;
  triggers: string[];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'all', 'cbt', 'prompts', 'activities'

    const personalizationEngine = getPersonalizationEngine();

    // Get personalized recommendations
    const recommendations = await personalizationEngine.generatePersonalizedRecommendations(session.user.id);

    // Get mood prediction
    const moodPrediction = await personalizationEngine.predictMoodTrend(session.user.id);

    // Get CBT exercise recommendations based on mood and history
    let cbtRecommendations: CBTRecommendation[] = [];
    if (type === 'all' || type === 'cbt') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get user's recent mood and CBT history
      const [recentMoods, completedSessions] = await Promise.all([
        prisma.moodEntry.findMany({
          where: {
            userId: session.user.id,
            timestamp: { gte: thirtyDaysAgo },
          },
          orderBy: { timestamp: 'desc' },
          take: 10,
        }),
        prisma.cBTSession.findMany({
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
          orderBy: { completedAt: 'desc' },
          take: 20,
        }),
      ]);

      const avgMood = recentMoods.length > 0
        ? recentMoods.reduce((sum, entry) => sum + entry.moodLevel, 0) / recentMoods.length
        : 5;

      // Count completed exercises by category
      const categoryCounts: Record<string, number> = {};
      completedSessions.forEach(session => {
        const category = session.exercise.category;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });

      // Determine recommended categories based on mood and completion history
      let recommendedCategories: CBTExerciseCategory[] = [];

      if (avgMood < 4) {
        recommendedCategories = ['BEHAVIOR_ACTIVATION', 'RELAXATION', 'MINDFULNESS'];
      } else if (avgMood > 7) {
        recommendedCategories = ['MINDFULNESS', 'COMMUNICATION', 'EXPOSURE'];
      } else {
        recommendedCategories = ['THOUGHT_CHALLENGING', 'BEHAVIOR_ACTIVATION', 'RELAXATION'];
      }

      // Prioritize categories user hasn't done much
      const sortedCategories = recommendedCategories.sort((a, b) => {
        return (categoryCounts[a] || 0) - (categoryCounts[b] || 0);
      });

      // Get exercises from recommended categories
      cbtRecommendations = await prisma.cBTExercise.findMany({
        where: {
          isActive: true,
          category: {
            in: sortedCategories.slice(0, 2),
          },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          difficulty: true,
        },
      });
    }

    // Generate coping strategies based on user's patterns
    let copingStrategies: CopingStrategy[] = [];
    if (type === 'all' || type === 'activities') {
      const userBehavior = await personalizationEngine.analyzeUserBehavior(session.user.id);

      copingStrategies = [
        {
          id: 'breathing-exercise',
          title: '4-7-8 Breathing',
          description: 'Inhale for 4 seconds, hold for 7 seconds, exhale for 8 seconds',
          category: 'relaxation',
          estimatedTime: 5,
          triggers: ['anxiety', 'stress', 'panic'],
        },
        {
          id: 'gratitude-practice',
          title: 'Gratitude Journal',
          description: 'Write down 3 things you\'re grateful for today',
          category: 'mindfulness',
          estimatedTime: 10,
          triggers: ['depression', 'low_mood'],
        },
        {
          id: 'progress-review',
          title: 'Progress Review',
          description: 'Review your achievements and progress this week',
          category: 'motivation',
          estimatedTime: 15,
          triggers: ['discouragement', 'lack_of_motivation'],
        },
        {
          id: 'social-connection',
          title: 'Reach Out',
          description: 'Call or text a trusted friend or family member',
          category: 'support',
          estimatedTime: 30,
          triggers: ['isolation', 'loneliness'],
        },
        {
          id: 'physical-activity',
          title: 'Physical Activity',
          description: 'Take a 20-minute walk or do light exercise',
          category: 'behavioral_activation',
          estimatedTime: 20,
          triggers: ['low_energy', 'depression'],
        },
      ];

      // Filter strategies based on user's common topics and mood patterns
      if (userBehavior.commonTopics.includes('anxiety')) {
        copingStrategies = copingStrategies.filter(s =>
          s.triggers.includes('anxiety') || s.triggers.includes('stress')
        );
      } else if (userBehavior.commonTopics.includes('depression')) {
        copingStrategies = copingStrategies.filter(s =>
          s.triggers.includes('depression') || s.category === 'behavioral_activation'
        );
      }

      // Limit to 3 most relevant strategies
      copingStrategies = copingStrategies.slice(0, 3);
    }

    const response: any = {
      moodPrediction,
      insights: {
        avgMood: moodPrediction.predictedAvgMood,
        confidence: moodPrediction.confidence,
        trendFactors: moodPrediction.factors,
      },
    };

    if (type === 'all' || type === 'cbt') {
      response.cbtRecommendations = cbtRecommendations;
    }

    if (type === 'all' || type === 'prompts') {
      response.promptRecommendations = recommendations.suggestedPrompts;
    }

    if (type === 'all' || type === 'activities') {
      response.copingStrategies = copingStrategies;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}