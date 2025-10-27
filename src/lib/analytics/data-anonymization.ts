import * as crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export interface AnonymizedUserData {
  userId: string; // Original ID for internal use
  anonymousId: string; // Public anonymized ID
  demographicData: {
    ageGroup: string; // '18-24', '25-34', etc.
    gender: string; // 'male', 'female', 'other', 'prefer_not_to_say'
    location: string; // Country/region level only
    timezone: string;
  };
  usageData: {
    registrationDate: Date;
    lastActiveDate: Date;
    totalSessions: number;
    averageSessionDuration: number;
    featuresUsed: string[];
    engagementScore: number;
  };
  mentalHealthData: {
    moodTrend: 'improving' | 'stable' | 'declining';
    averageMood: number;
    crisisEvents: number;
    therapySessions: number;
    completedExercises: number;
  };
  anonymizedAt: Date;
}

export interface AggregatedAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  retentionRate: number;
  averageSessionDuration: number;
  featureUsage: Record<string, number>;
  demographicBreakdown: {
    ageGroups: Record<string, number>;
    gender: Record<string, number>;
    locations: Record<string, number>;
  };
  mentalHealthMetrics: {
    averageMoodScore: number;
    moodTrendDistribution: Record<string, number>;
    crisisRate: number;
    therapyCompletionRate: number;
  };
  timeRange: {
    start: Date;
    end: Date;
  };
}

export class DataAnonymizationService {
  private readonly saltRounds = 12;
  private readonly hashSecret: string;

  constructor() {
    this.hashSecret = process.env.ANONYMIZATION_SECRET || 'default-anonymization-secret-change-in-production';
  }

  /**
   * Anonymize individual user data for analytics
   */
  async anonymizeUserData(userId: string): Promise<AnonymizedUserData> {
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        // Note: We don't select sensitive fields like email, name, etc.
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get usage data
    const moodEntries = await prisma.moodEntry.findMany({
      where: { userId },
      select: { moodLevel: true, timestamp: true },
    });

    const cbtSessions = await prisma.cBTSession.findMany({
      where: { userId },
      select: { isCompleted: true, startedAt: true },
    });

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      select: { crisisDetected: true, startAt: true, endAt: true },
    });

    // Generate anonymous ID (consistent for same user)
    const anonymousId = this.generateAnonymousId(userId);

    // Calculate demographic data (generalized)
    const demographicData = await this.calculateDemographicData(userId);

    // Calculate usage data
    const usageData = this.calculateUsageData(moodEntries, cbtSessions, conversations);

    // Calculate mental health data
    const mentalHealthData = this.calculateMentalHealthData(moodEntries, cbtSessions, conversations);

    const anonymizedData: AnonymizedUserData = {
      userId, // Keep original for internal correlation
      anonymousId,
      demographicData,
      usageData,
      mentalHealthData,
      anonymizedAt: new Date(),
    };

    // Store anonymized data (in production, use separate analytics database)
    await this.storeAnonymizedData(anonymizedData);

    return anonymizedData;
  }

  /**
   * Generate consistent anonymous ID for user
   */
  private generateAnonymousId(userId: string): string {
    const hash = crypto.createHmac('sha256', this.hashSecret)
      .update(userId)
      .digest('hex');
    return `anon_${hash.substring(0, 16)}`;
  }

  /**
   * Calculate generalized demographic data
   */
  private async calculateDemographicData(userId: string): Promise<AnonymizedUserData['demographicData']> {
    // In production, this would use actual user profile data
    // For now, return generalized data
    return {
      ageGroup: '25-34', // Would be calculated from birth date
      gender: 'prefer_not_to_say', // Would be from user profile
      location: 'US', // Country level only
      timezone: 'America/New_York', // Generalized timezone
    };
  }

  /**
   * Calculate usage statistics
   */
  private calculateUsageData(
    moodEntries: any[],
    cbtSessions: any[],
    conversations: any[]
  ): AnonymizedUserData['usageData'] {
    const totalSessions = conversations.length;
    const totalMoodEntries = moodEntries.length;
    const totalCBTSessions = cbtSessions.length;

    // Calculate average session duration (simplified)
    const avgSessionDuration = conversations.reduce((sum, conv) => {
      if (conv.startAt && conv.endAt) {
        return sum + (new Date(conv.endAt).getTime() - new Date(conv.startAt).getTime()) / (1000 * 60); // minutes
      }
      return sum;
    }, 0) / Math.max(conversations.length, 1);

    // Determine features used
    const featuresUsed = [];
    if (totalMoodEntries > 0) featuresUsed.push('mood_tracking');
    if (totalCBTSessions > 0) featuresUsed.push('cbt_exercises');
    if (totalSessions > 0) featuresUsed.push('ai_chat');
    if (conversations.some(c => c.crisisDetected)) featuresUsed.push('crisis_support');

    // Calculate engagement score (0-100)
    const engagementScore = Math.min(
      (totalMoodEntries * 2 + totalCBTSessions * 5 + totalSessions * 3) / 10,
      100
    );

    return {
      registrationDate: new Date(), // Would be from user.createdAt
      lastActiveDate: new Date(Math.max(
        ...moodEntries.map(e => new Date(e.timestamp).getTime()),
        ...cbtSessions.map(s => new Date(s.startedAt).getTime()),
        ...conversations.map(c => new Date(c.startAt).getTime()),
        Date.now()
      )),
      totalSessions,
      averageSessionDuration: Math.round(avgSessionDuration),
      featuresUsed,
      engagementScore: Math.round(engagementScore),
    };
  }

  /**
   * Calculate mental health metrics
   */
  private calculateMentalHealthData(
    moodEntries: any[],
    cbtSessions: any[],
    conversations: any[]
  ): AnonymizedUserData['mentalHealthData'] {
    // Calculate mood trend
    let moodTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (moodEntries.length >= 2) {
      const firstHalf = moodEntries.slice(0, Math.floor(moodEntries.length / 2));
      const secondHalf = moodEntries.slice(Math.floor(moodEntries.length / 2));

      const firstAvg = firstHalf.reduce((sum, e) => sum + e.moodLevel, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, e) => sum + e.moodLevel, 0) / secondHalf.length;

      if (secondAvg > firstAvg + 0.5) moodTrend = 'improving';
      else if (secondAvg < firstAvg - 0.5) moodTrend = 'declining';
    }

    const averageMood = moodEntries.length > 0
      ? moodEntries.reduce((sum, e) => sum + e.moodLevel, 0) / moodEntries.length
      : 5; // Neutral mood

    const crisisEvents = conversations.filter(c => c.crisisDetected).length;
    const therapySessions = conversations.length;
    const completedExercises = cbtSessions.filter(s => s.isCompleted).length;

    return {
      moodTrend,
      averageMood: Math.round(averageMood * 10) / 10,
      crisisEvents,
      therapySessions,
      completedExercises,
    };
  }

  /**
   * Store anonymized data for analytics
   */
  private async storeAnonymizedData(data: AnonymizedUserData): Promise<void> {
    // In production, store in separate analytics database
    // For now, we'll store in the main database with encryption
    const encryptedData = this.encryptAnonymizedData(data);

    await prisma.anonymizedAnalytics.create({
      data: {
        userId: data.userId,
        anonymousId: data.anonymousId,
        encryptedData,
        anonymizedAt: data.anonymizedAt,
      },
    });
  }

  /**
   * Encrypt anonymized data for storage
   */
  private encryptAnonymizedData(data: AnonymizedUserData): string {
    const dataString = JSON.stringify(data);
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.hashSecret, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('additional-auth-data', 'utf8'));
    let encrypted = cipher.update(dataString, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex'),
    });
  }

  /**
   * Generate aggregated analytics from anonymized data
   */
  async generateAggregatedAnalytics(
    timeRange: { start: Date; end: Date },
    filters?: {
      ageGroup?: string;
      gender?: string;
      location?: string;
    }
  ): Promise<AggregatedAnalytics> {
    // Get anonymized data (in production, from analytics database)
    const anonymizedRecords = await prisma.anonymizedAnalytics.findMany({
      where: {
        anonymizedAt: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      },
    });

    // Decrypt and process data
    const processedData = anonymizedRecords.map(record => {
      try {
        return JSON.parse(this.decryptAnonymizedData(record.encryptedData));
      } catch (error) {
        console.error('Failed to decrypt anonymized data:', error);
        return null;
      }
    }).filter(data => data !== null);

    // Apply filters
    let filteredData = processedData;
    if (filters) {
      filteredData = processedData.filter(data => {
        if (filters.ageGroup && data.demographicData.ageGroup !== filters.ageGroup) return false;
        if (filters.gender && data.demographicData.gender !== filters.gender) return false;
        if (filters.location && data.demographicData.location !== filters.location) return false;
        return true;
      });
    }

    // Calculate aggregates
    const totalUsers = filteredData.length;
    const activeUsers = filteredData.filter(d => d.usageData.lastActiveDate > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
    const newUsers = filteredData.filter(d => d.usageData.registrationDate > timeRange.start).length;

    // Calculate retention (simplified - users active in both first and second half of period)
    const periodMid = new Date((timeRange.start.getTime() + timeRange.end.getTime()) / 2);
    const firstHalfUsers = new Set(filteredData.filter(d => d.usageData.lastActiveDate <= periodMid).map(d => d.userId));
    const secondHalfUsers = new Set(filteredData.filter(d => d.usageData.lastActiveDate > periodMid).map(d => d.userId));
    const retainedUsers = Array.from(firstHalfUsers).filter(id => secondHalfUsers.has(id)).length;
    const retentionRate = firstHalfUsers.size > 0 ? (retainedUsers / firstHalfUsers.size) * 100 : 0;

    // Calculate averages
    const averageSessionDuration = filteredData.reduce((sum, d) => sum + d.usageData.averageSessionDuration, 0) / Math.max(totalUsers, 1);
    const averageMoodScore = filteredData.reduce((sum, d) => sum + d.mentalHealthData.averageMood, 0) / Math.max(totalUsers, 1);

    // Feature usage aggregation
    const featureUsage: Record<string, number> = {};
    filteredData.forEach(data => {
      data.usageData.featuresUsed.forEach((feature: string) => {
        featureUsage[feature] = (featureUsage[feature] || 0) + 1;
      });
    });

    // Demographic breakdown
    const demographicBreakdown = {
      ageGroups: filteredData.reduce((acc, d) => {
        acc[d.demographicData.ageGroup] = (acc[d.demographicData.ageGroup] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      gender: filteredData.reduce((acc, d) => {
        acc[d.demographicData.gender] = (acc[d.demographicData.gender] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      locations: filteredData.reduce((acc, d) => {
        acc[d.demographicData.location] = (acc[d.demographicData.location] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    // Mental health metrics
    const moodTrendDistribution = filteredData.reduce((acc, d) => {
      acc[d.mentalHealthData.moodTrend] = (acc[d.mentalHealthData.moodTrend] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalCrisisEvents = filteredData.reduce((sum, d) => sum + d.mentalHealthData.crisisEvents, 0);
    const crisisRate = totalUsers > 0 ? (totalCrisisEvents / totalUsers) * 100 : 0;

    const totalTherapySessions = filteredData.reduce((sum, d) => sum + d.mentalHealthData.therapySessions, 0);
    const totalCompletedExercises = filteredData.reduce((sum, d) => sum + d.mentalHealthData.completedExercises, 0);
    const therapyCompletionRate = totalTherapySessions > 0 ? (totalCompletedExercises / totalTherapySessions) * 100 : 0;

    return {
      totalUsers,
      activeUsers,
      newUsers,
      retentionRate: Math.round(retentionRate * 100) / 100,
      averageSessionDuration: Math.round(averageSessionDuration),
      featureUsage,
      demographicBreakdown,
      mentalHealthMetrics: {
        averageMoodScore: Math.round(averageMoodScore * 10) / 10,
        moodTrendDistribution,
        crisisRate: Math.round(crisisRate * 100) / 100,
        therapyCompletionRate: Math.round(therapyCompletionRate * 100) / 100,
      },
      timeRange,
    };
  }

  /**
   * Decrypt anonymized data for processing
   */
  private decryptAnonymizedData(encryptedData: string): string {
    const { iv, encrypted, authTag } = JSON.parse(encryptedData);
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.hashSecret, 'salt', 32);

    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from('additional-auth-data', 'utf8'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Clean up old anonymized data (retention policy)
   */
  async cleanupOldAnonymizedData(retentionDays: number = 2555): Promise<{ deletedRecords: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const deletedRecords = await prisma.anonymizedAnalytics.deleteMany({
      where: {
        anonymizedAt: { lt: cutoffDate },
      },
    });

    console.log(`Cleaned up ${deletedRecords.count} old anonymized records (retention: ${retentionDays} days)`);

    return { deletedRecords: deletedRecords.count };
  }

  /**
   * Validate anonymization effectiveness
   */
  async validateAnonymization(): Promise<{
    reidentificationRisk: 'low' | 'medium' | 'high';
    uniquenessRatio: number;
    kAnonymityScore: number;
    recommendations: string[];
  }> {
    // Get sample of anonymized data
    const sample = await prisma.anonymizedAnalytics.findMany({
      take: 1000, // Sample size for analysis
    });

    if (sample.length < 10) {
      return {
        reidentificationRisk: 'low',
        uniquenessRatio: 1,
        kAnonymityScore: 1,
        recommendations: ['Insufficient data for meaningful analysis'],
      };
    }

    // Calculate uniqueness ratio (lower is better for privacy)
    const uniqueCombinations = new Set(
      sample.map(record => {
        const data = JSON.parse(this.decryptAnonymizedData(record.encryptedData));
        return `${data.demographicData.ageGroup}-${data.demographicData.gender}-${data.demographicData.location}`;
      })
    );

    const uniquenessRatio = uniqueCombinations.size / sample.length;

    // Calculate k-anonymity score (higher is better for privacy)
    const combinationCounts = sample.reduce((acc, record) => {
      const data = JSON.parse(this.decryptAnonymizedData(record.encryptedData));
      const key = `${data.demographicData.ageGroup}-${data.demographicData.gender}-${data.demographicData.location}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const kAnonymityScore = Math.min(...Object.values(combinationCounts) as number[]);

    // Determine reidentification risk
    let reidentificationRisk: 'low' | 'medium' | 'high' = 'low';
    if (uniquenessRatio > 0.1 || kAnonymityScore < 5) {
      reidentificationRisk = 'high';
    } else if (uniquenessRatio > 0.05 || kAnonymityScore < 10) {
      reidentificationRisk = 'medium';
    }

    // Generate recommendations
    const recommendations = [];
    if (reidentificationRisk === 'high') {
      recommendations.push('Consider further generalization of demographic data');
      recommendations.push('Implement additional noise injection techniques');
    }
    if (kAnonymityScore < 5) {
      recommendations.push('Increase data generalization to achieve better k-anonymity');
    }

    return {
      reidentificationRisk,
      uniquenessRatio: Math.round(uniquenessRatio * 1000) / 1000,
      kAnonymityScore,
      recommendations,
    };
  }
}

// Global data anonymization instance
export const dataAnonymization = new DataAnonymizationService();