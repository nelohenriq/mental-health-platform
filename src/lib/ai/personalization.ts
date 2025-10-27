import { prisma } from '@/lib/prisma';

export interface UserPreferences {
  preferredProvider: 'openai' | 'anthropic' | 'google' | 'groq';
  preferredPromptStyle: string;
  communicationStyle: 'formal' | 'casual' | 'empathetic' | 'direct';
  focusAreas: string[];
  avoidedTopics: string[];
  preferredSessionLength: 'short' | 'medium' | 'long';
  notificationPreferences: {
    moodReminders: boolean;
    sessionReminders: boolean;
    achievementNotifications: boolean;
  };
}

export interface UserBehaviorData {
  totalSessions: number;
  avgSessionLength: number;
  preferredTimes: string[];
  commonTopics: string[];
  moodPatterns: {
    avgMood: number;
    moodVariability: number;
    improvementTrend: number;
  };
  engagementMetrics: {
    sessionFrequency: number;
    completionRate: number;
    responseTime: number;
  };
}

export class PersonalizationEngine {
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    // Get user preferences from database or create defaults
    // TODO: Implement user preference storage
    return {
      preferredProvider: 'openai',
      preferredPromptStyle: 'general-supportive',
      communicationStyle: 'empathetic',
      focusAreas: ['anxiety', 'depression', 'stress'],
      avoidedTopics: [],
      preferredSessionLength: 'medium',
      notificationPreferences: {
        moodReminders: true,
        sessionReminders: true,
        achievementNotifications: true,
      },
    };
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    // TODO: Store user preferences in database
    console.log('Updating preferences for user:', userId, preferences);
  }

  async analyzeUserBehavior(userId: string): Promise<UserBehaviorData> {
    // Analyze user's historical data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get conversation data
    const conversations = await prisma.conversation.findMany({
      where: {
        userId,
        startAt: { gte: thirtyDaysAgo },
      },
      include: {
        messages: true,
      },
    });

    // Get mood data
    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        userId,
        timestamp: { gte: thirtyDaysAgo },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Calculate metrics
    const totalSessions = conversations.length;
    const completedSessions = conversations.filter(c => c.endAt).length;
    const completionRate = totalSessions > 0 ? completedSessions / totalSessions : 0;

    const avgSessionLength = conversations.length > 0
      ? conversations.reduce((sum, conv) => {
          if (conv.endAt) {
            return sum + (conv.endAt.getTime() - conv.startAt.getTime());
          }
          return sum;
        }, 0) / conversations.length / (1000 * 60) // Convert to minutes
      : 0;

    // Analyze mood patterns
    const avgMood = moodEntries.length > 0
      ? moodEntries.reduce((sum, entry) => sum + entry.moodLevel, 0) / moodEntries.length
      : 5;

    const moodVariability = moodEntries.length > 1
      ? Math.sqrt(
          moodEntries.reduce((sum, entry) => sum + Math.pow(entry.moodLevel - avgMood, 2), 0) / moodEntries.length
        )
      : 0;

    // Calculate mood improvement trend (simplified)
    const firstHalf = moodEntries.slice(0, Math.floor(moodEntries.length / 2));
    const secondHalf = moodEntries.slice(Math.floor(moodEntries.length / 2));

    const firstHalfAvg = firstHalf.length > 0
      ? firstHalf.reduce((sum, entry) => sum + entry.moodLevel, 0) / firstHalf.length
      : avgMood;

    const secondHalfAvg = secondHalf.length > 0
      ? secondHalf.reduce((sum, entry) => sum + entry.moodLevel, 0) / secondHalf.length
      : avgMood;

    const improvementTrend = secondHalfAvg - firstHalfAvg;

    return {
      totalSessions,
      avgSessionLength,
      preferredTimes: this.analyzePreferredTimes(conversations),
      commonTopics: this.analyzeCommonTopics(conversations),
      moodPatterns: {
        avgMood,
        moodVariability,
        improvementTrend,
      },
      engagementMetrics: {
        sessionFrequency: totalSessions / 30, // Sessions per day
        completionRate,
        responseTime: 0, // TODO: Calculate average response time
      },
    };
  }

  private analyzePreferredTimes(conversations: any[]): string[] {
    // Analyze when user typically starts conversations
    const hourCounts: { [key: number]: number } = {};

    conversations.forEach(conv => {
      const hour = conv.startAt.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Find top 3 hours
    const sortedHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([hour]) => {
        const h = parseInt(hour);
        if (h < 6) return 'early morning';
        if (h < 12) return 'morning';
        if (h < 18) return 'afternoon';
        if (h < 22) return 'evening';
        return 'night';
      });

    return [...new Set(sortedHours)]; // Remove duplicates
  }

  private analyzeCommonTopics(conversations: any[]): string[] {
    // Simple topic analysis based on message content
    const topics: { [key: string]: number } = {};

    conversations.forEach(conv => {
      conv.messages.forEach((msg: any) => {
        const content = msg.content.toLowerCase();

        // Simple keyword matching for topics
        const topicKeywords = {
          anxiety: ['anxiety', 'anxious', 'panic', 'worry', 'nervous'],
          depression: ['depressed', 'sad', 'hopeless', 'worthless', 'tired'],
          stress: ['stress', 'overwhelmed', 'pressure', 'tension'],
          relationships: ['relationship', 'friend', 'family', 'partner', 'love'],
          work: ['work', 'job', 'career', 'boss', 'colleague'],
          sleep: ['sleep', 'insomnia', 'tired', 'exhausted'],
        };

        Object.entries(topicKeywords).forEach(([topic, keywords]) => {
          if (keywords.some(keyword => content.includes(keyword))) {
            topics[topic] = (topics[topic] || 0) + 1;
          }
        });
      });
    });

    // Return top 3 topics
    return Object.entries(topics)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);
  }

  async generatePersonalizedRecommendations(userId: string): Promise<{
    suggestedPrompts: string[];
    recommendedActivities: string[];
    nextSessionSuggestions: string[];
  }> {
    const behaviorData = await this.analyzeUserBehavior(userId);
    const preferences = await this.getUserPreferences(userId);

    const recommendations = {
      suggestedPrompts: [] as string[],
      recommendedActivities: [] as string[],
      nextSessionSuggestions: [] as string[],
    };

    // Suggest prompts based on common topics and mood patterns
    if (behaviorData.commonTopics.includes('anxiety')) {
      recommendations.suggestedPrompts.push('anxiety-specialist');
    }
    if (behaviorData.commonTopics.includes('depression')) {
      recommendations.suggestedPrompts.push('depression-support');
    }
    if (behaviorData.commonTopics.includes('stress')) {
      recommendations.suggestedPrompts.push('stress-management');
    }

    // Recommend activities based on mood and engagement
    if (behaviorData.moodPatterns.avgMood < 5) {
      recommendations.recommendedActivities.push('behavioral-activation');
      recommendations.recommendedActivities.push('mindfulness');
    }

    if (behaviorData.engagementMetrics.completionRate < 0.7) {
      recommendations.nextSessionSuggestions.push('Consider shorter, more focused sessions');
    }

    if (behaviorData.engagementMetrics.sessionFrequency < 0.5) {
      recommendations.nextSessionSuggestions.push('Try setting a regular schedule for sessions');
    }

    return recommendations;
  }

  async predictMoodTrend(userId: string, daysAhead: number = 7): Promise<{
    predictedAvgMood: number;
    confidence: number;
    factors: string[];
  }> {
    // Simple mood prediction based on recent trends
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        userId,
        timestamp: { gte: sixtyDaysAgo },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (moodEntries.length < 7) {
      return {
        predictedAvgMood: 5,
        confidence: 0.3,
        factors: ['Insufficient data for prediction'],
      };
    }

    // Calculate trend using linear regression
    const n = moodEntries.length;
    const sumX = moodEntries.reduce((sum, _, i) => sum + i, 0);
    const sumY = moodEntries.reduce((sum, entry) => sum + entry.moodLevel, 0);
    const sumXY = moodEntries.reduce((sum, entry, i) => sum + i * entry.moodLevel, 0);
    const sumXX = moodEntries.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict future mood
    const predictedMood = intercept + slope * (n + daysAhead);

    // Calculate confidence based on data consistency
    const avgMood = sumY / n;
    const variance = moodEntries.reduce((sum, entry) => sum + Math.pow(entry.moodLevel - avgMood, 2), 0) / n;
    const confidence = Math.max(0.1, Math.min(1, 1 - variance / 10)); // Normalize variance to confidence

    const factors = [];
    if (slope > 0.1) factors.push('Upward mood trend');
    else if (slope < -0.1) factors.push('Downward mood trend');
    else factors.push('Stable mood pattern');

    if (variance > 2) factors.push('High mood variability');
    else factors.push('Consistent mood pattern');

    return {
      predictedAvgMood: Math.max(1, Math.min(10, predictedMood)),
      confidence,
      factors,
    };
  }
}

// Singleton instance
let personalizationEngine: PersonalizationEngine | null = null;

export function getPersonalizationEngine(): PersonalizationEngine {
  if (!personalizationEngine) {
    personalizationEngine = new PersonalizationEngine();
  }
  return personalizationEngine;
}