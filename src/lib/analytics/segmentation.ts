import { prisma } from '@/lib/prisma';

export interface SegmentCriteria {
  userType?: 'USER' | 'THERAPIST' | 'ADMIN';
  moodRange?: { min: number; max: number };
  activityLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  crisisHistory?: boolean;
  registrationDate?: { before?: Date; after?: Date };
  lastActivity?: { daysAgo: number };
  featureUsage?: { feature: string; count: number; operator: 'gt' | 'lt' | 'eq' };
  // Additional criteria for testing
  cbtCompletionRate?: { min?: number; max?: number; weight?: number };
  moodEntriesPerWeek?: { min?: number; max?: number; weight?: number };
  sessionDuration?: { min?: number; max?: number; weight?: number };
  moodTrend?: string;
  cbtPreferences?: string[];
  engagementScore?: { min?: number; max?: number; weight?: number };
  lastActive?: { within?: string };
}

export interface CohortAnalysis {
  segmentId: string;
  segmentName: string;
  userCount: number;
  averageMoodScore: number;
  retentionRate: number;
  crisisIncidents: number;
  featureAdoption: Record<string, number>;
  demographics: {
    ageGroups: Record<string, number>;
    genderDistribution: Record<string, number>;
    locationDistribution: Record<string, number>;
  };
}

export interface Segment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria;
  targetSize: number;
  isActive: boolean;
  createdAt: Date;
}

export interface UserData {
  userId: string;
  cbtCompletionRate?: number;
  moodEntriesPerWeek?: number;
  sessionDuration?: number;
  moodTrend?: string;
  cbtPreferences?: string[];
  engagementScore?: number;
  lastActive?: Date;
}

export interface EvaluationResult {
  matches: boolean;
  score: number;
  matchedCriteria: string[];
}

export interface SegmentAnalytics {
  segmentId: string;
  totalMembers: number;
  averageScore: number;
  sizeVsTarget: number;
  retentionRate?: number;
  churnRate?: number;
  healthIssues: string[];
  recommendations: string[];
  createdAt: Date;
}

/**
 * Create a new segment with validation
 */
export function createSegment(data: {
  name: string;
  description: string;
  criteria: SegmentCriteria;
  targetSize: number;
  isActive: boolean;
}): Segment {
  if (!data.name || !data.description) {
    throw new Error('Segment name and description are required');
  }

  if (!data.criteria || Object.keys(data.criteria).length === 0) {
    throw new Error('Invalid segment criteria');
  }

  return {
    id: `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: data.name,
    description: data.description,
    criteria: data.criteria,
    targetSize: data.targetSize,
    isActive: data.isActive,
    createdAt: new Date(),
  };
}

/**
 * Evaluate if a user matches segment criteria
 */
export function evaluateUserSegment(userData: UserData, segment: Segment): EvaluationResult {
  const matchedCriteria: string[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  // Evaluate each criterion
  Object.entries(segment.criteria).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    const userValue = (userData as any)[key];
    if (userValue === undefined) return;

    let matches = false;
    let weight = 1;

    switch (key) {
      case 'cbtCompletionRate':
      case 'moodEntriesPerWeek':
      case 'sessionDuration':
      case 'engagementScore':
        const range = value as { min?: number; max?: number; weight?: number };
        weight = range.weight || 1;
        if (range.min !== undefined && userValue >= range.min) matches = true;
        if (range.max !== undefined && userValue <= range.max) matches = matches && true;
        else if (range.max === undefined) matches = true;
        break;

      case 'moodTrend':
        matches = userValue === value;
        break;

      case 'cbtPreferences':
        const preferences = value as string[];
        matches = preferences.some(pref => (userValue as string[]).includes(pref));
        break;

      case 'lastActive':
        const within = value as { within?: string };
        if (within.within) {
          const days = parseInt(within.within.replace('d', ''));
          const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
          matches = userValue > cutoff;
        }
        break;

      default:
        matches = true; // For unsupported criteria, assume match
    }

    if (matches) {
      matchedCriteria.push(key);
      totalScore += weight;
    }
    totalWeight += weight;
  });

  const score = totalWeight > 0 ? totalScore / totalWeight : 0;

  return {
    matches: matchedCriteria.length > 0,
    score,
    matchedCriteria,
  };
}

/**
 * Generate analytics for a segment
 */
export function getSegmentAnalytics(segment: Segment, members: Array<{ userId: string; score: number; retained?: boolean }>): SegmentAnalytics {
  const totalMembers = members.length;
  const averageScore = totalMembers > 0 ? members.reduce((sum, m) => sum + m.score, 0) / totalMembers : 0;
  const sizeVsTarget = totalMembers / segment.targetSize;

  let retentionRate: number | undefined;
  let churnRate: number | undefined;

  if (members.some(m => m.retained !== undefined)) {
    const retainedCount = members.filter(m => m.retained).length;
    retentionRate = totalMembers > 0 ? retainedCount / totalMembers : 0;
    churnRate = 1 - retentionRate;
  }

  const healthIssues: string[] = [];
  const recommendations: string[] = [];

  if (totalMembers < segment.targetSize * 0.1) {
    healthIssues.push('low_population');
    recommendations.push('Consider broadening criteria');
  }

  if (averageScore < 0.5) {
    healthIssues.push('low_engagement');
    recommendations.push('Review segment criteria for better targeting');
  }

  return {
    segmentId: segment.id,
    totalMembers,
    averageScore,
    sizeVsTarget,
    retentionRate,
    churnRate,
    healthIssues,
    recommendations,
    createdAt: new Date(),
  };
}

/**
 * Segment users by activity level
 */
export function segmentUsersByActivity(activityData: Array<{ userId: string; activityCount: number }>): Array<{ userId: string; segment: string }> {
  return activityData.map(user => ({
    userId: user.userId,
    segment: user.activityCount > 50 ? 'HIGH' : user.activityCount > 20 ? 'MEDIUM' : 'LOW'
  }));
}

/**
 * Segment users by mood patterns
 */
export function segmentUsersByMood(moodData: Array<{ userId: string; averageMood: number; moodVariance: number }>): Array<{ userId: string; segment: string }> {
  return moodData.map(user => {
    if (user.averageMood >= 7) return { userId: user.userId, segment: 'HIGH_MOOD' };
    if (user.averageMood <= 3) return { userId: user.userId, segment: 'LOW_MOOD' };
    if (user.moodVariance > 2) return { userId: user.userId, segment: 'MOOD_SWINGS' };
    return { userId: user.userId, segment: 'STABLE_MOOD' };
  });
}

export class SegmentationService {
  /**
   * Create a new user segment with dynamic criteria
   */
  async createSegment(name: string, description: string, criteria: SegmentCriteria) {
    const segment = await prisma.userSegment.create({
      data: {
        name,
        description,
        criteria: JSON.stringify(criteria),
      },
    });

    // Automatically assign users to this segment
    await this.assignUsersToSegment(segment.id, criteria);

    return segment;
  }

  /**
   * Update segment criteria and reassign users
   */
  async updateSegment(segmentId: string, updates: Partial<{
    name: string;
    description: string;
    criteria: SegmentCriteria;
    isActive: boolean;
  }>) {
    const updateData: any = { ...updates };
    if (updates.criteria) {
      updateData.criteria = JSON.stringify(updates.criteria);
    }

    const segment = await prisma.userSegment.update({
      where: { id: segmentId },
      data: updateData,
    });

    // Reassign users if criteria changed
    if (updates.criteria) {
      await this.reassignUsersToSegment(segmentId, updates.criteria);
    }

    return segment;
  }

  /**
   * Assign users to a segment based on criteria
   */
  private async assignUsersToSegment(segmentId: string, criteria: SegmentCriteria) {
    const users = await this.findUsersMatchingCriteria(criteria);

    const memberships = users.map(user => ({
      userId: user.id,
      segmentId,
    }));

    // Filter out existing memberships to avoid duplicates
    const existingMemberships = await prisma.userSegmentMembership.findMany({
      where: {
        segmentId,
        userId: { in: memberships.map(m => m.userId) },
      },
      select: { userId: true },
    });

    const existingUserIds = new Set(existingMemberships.map(m => m.userId));

    const newMemberships = memberships.filter(m => !existingUserIds.has(m.userId));

    if (newMemberships.length > 0) {
      await prisma.userSegmentMembership.createMany({
        data: newMemberships,
      });
    }
  }

  /**
   * Reassign users to a segment (remove old assignments, add new ones)
   */
  private async reassignUsersToSegment(segmentId: string, criteria: SegmentCriteria) {
    // Remove existing memberships
    await prisma.userSegmentMembership.deleteMany({
      where: { segmentId },
    });

    // Assign new users
    await this.assignUsersToSegment(segmentId, criteria);
  }

  /**
   * Find users matching specific criteria
   */
  private async findUsersMatchingCriteria(criteria: SegmentCriteria) {
    let whereClause: any = {};

    // User type filter
    if (criteria.userType) {
      whereClause.role = criteria.userType;
    }

    // Mood range filter (based on recent mood entries)
    if (criteria.moodRange) {
      const usersWithMoodRange = await prisma.moodEntry.groupBy({
        by: ['userId'],
        where: {
          moodLevel: {
            gte: criteria.moodRange.min,
            lte: criteria.moodRange.max,
          },
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        _count: true,
      });

      const moodUserIds = usersWithMoodRange.map(u => u.userId);
      if (whereClause.id) {
        // Intersect with existing user IDs
        const existingIds = whereClause.id.in || [];
        whereClause.id.in = existingIds.filter((id: string) => moodUserIds.includes(id));
      } else {
        whereClause.id = {
          in: moodUserIds,
        };
      }
    }

    // Crisis history filter
    if (criteria.crisisHistory !== undefined) {
      const crisisUsers = await prisma.crisisEvent.findMany({
        select: { userId: true },
        distinct: ['userId'],
      });

      const crisisUserIds = crisisUsers.map(c => c.userId);

      const targetIds = criteria.crisisHistory ? crisisUserIds : await this.getUsersWithoutCrisis(crisisUserIds);

      if (whereClause.id) {
        // Intersect with existing user IDs
        const existingIds = whereClause.id.in || [];
        whereClause.id.in = existingIds.filter((id: string) => targetIds.includes(id));
      } else {
        whereClause.id = {
          in: targetIds,
        };
      }
    }

    // Registration date filter
    if (criteria.registrationDate) {
      whereClause.createdAt = {};
      if (criteria.registrationDate.after) {
        whereClause.createdAt.gte = criteria.registrationDate.after;
      }
      if (criteria.registrationDate.before) {
        whereClause.createdAt.lte = criteria.registrationDate.before;
      }
    }

    // Activity level filter (based on behavior events)
    if (criteria.activityLevel) {
      const activityUsers = await this.getUsersByActivityLevel(criteria.activityLevel);
      if (whereClause.id) {
        const existingIds = whereClause.id.in || [];
        whereClause.id.in = existingIds.filter((id: string) => activityUsers.includes(id));
      } else {
        whereClause.id = {
          in: activityUsers,
        };
      }
    }

    // Last activity filter
    if (criteria.lastActivity) {
      const cutoffDate = new Date(Date.now() - criteria.lastActivity.daysAgo * 24 * 60 * 60 * 1000);
      const activeUsers = await prisma.userBehaviorEvent.findMany({
        where: {
          timestamp: {
            gte: cutoffDate,
          },
        },
        select: { userId: true },
        distinct: ['userId'],
      });

      const activeUserIds = activeUsers.map(u => u.userId);
      if (whereClause.id) {
        const existingIds = whereClause.id.in || [];
        whereClause.id.in = existingIds.filter((id: string) => activeUserIds.includes(id));
      } else {
        whereClause.id = {
          in: activeUserIds,
        };
      }
    }

    // Feature usage filter
    if (criteria.featureUsage) {
      const featureUsers = await this.getUsersByFeatureUsage(criteria.featureUsage);
      if (whereClause.id) {
        const existingIds = whereClause.id.in || [];
        whereClause.id.in = existingIds.filter((id: string) => featureUsers.includes(id));
      } else {
        whereClause.id = {
          in: featureUsers,
        };
      }
    }

    return await prisma.user.findMany({
      where: whereClause,
      select: { id: true },
    });
  }

  /**
   * Get users without crisis history
   */
  private async getUsersWithoutCrisis(crisisUserIds: string[]): Promise<string[]> {
    const allUsers = await prisma.user.findMany({
      select: { id: true },
    });
    return allUsers.map(u => u.id).filter(id => !crisisUserIds.includes(id));
  }

  /**
   * Get users by activity level
   */
  private async getUsersByActivityLevel(activityLevel: 'LOW' | 'MEDIUM' | 'HIGH'): Promise<string[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const userActivityCounts = await prisma.userBehaviorEvent.groupBy({
      by: ['userId'],
      where: {
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    const thresholds = {
      LOW: { min: 0, max: 10 },
      MEDIUM: { min: 11, max: 50 },
      HIGH: { min: 51, max: Infinity },
    };

    const threshold = thresholds[activityLevel];
    return userActivityCounts
      .filter(u => u._count.id >= threshold.min && u._count.id <= threshold.max)
      .map(u => u.userId);
  }

  /**
   * Get users by feature usage
   */
  private async getUsersByFeatureUsage(featureUsage: { feature: string; count: number; operator: 'gt' | 'lt' | 'eq' }): Promise<string[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const userFeatureCounts = await prisma.userBehaviorEvent.groupBy({
      by: ['userId'],
      where: {
        eventType: 'feature_usage',
        eventName: featureUsage.feature,
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    return userFeatureCounts
      .filter(u => {
        const count = u._count.id;
        switch (featureUsage.operator) {
          case 'gt':
            return count > featureUsage.count;
          case 'lt':
            return count < featureUsage.count;
          case 'eq':
            return count === featureUsage.count;
          default:
            return false;
        }
      })
      .map(u => u.userId);
  }

  /**
   * Get cohort analysis for a segment
   */
  async getCohortAnalysis(segmentId: string): Promise<CohortAnalysis> {
    const segment = await prisma.userSegment.findUnique({
      where: { id: segmentId },
      include: {
        users: {
          include: {
            user: {
              include: {
                moodEntries: {
                  where: {
                    timestamp: {
                      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                  },
                },
                crisisEvents: true,
                behaviorEvents: {
                  where: {
                    timestamp: {
                      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!segment) {
      throw new Error('Segment not found');
    }

    const users = segment.users.map(membership => membership.user);

    // Calculate metrics
    const userCount = users.length;
    const totalMoodEntries = users.flatMap(u => u.moodEntries);
    const averageMoodScore = totalMoodEntries.length > 0
      ? totalMoodEntries.reduce((sum, entry) => sum + entry.moodLevel, 0) / totalMoodEntries.length
      : 0;

    const crisisIncidents = users.reduce((sum, user) => sum + user.crisisEvents.length, 0);

    // Feature adoption analysis
    const featureAdoption: Record<string, number> = {};
    users.forEach(user => {
      user.behaviorEvents.forEach(event => {
        if (event.eventType === 'feature_usage') {
          const feature = event.eventName;
          featureAdoption[feature] = (featureAdoption[feature] || 0) + 1;
        }
      });
    });

    // Calculate retention rate (users active in last 7 days)
    const activeUsers = users.filter(user => {
      const recentActivity = user.behaviorEvents.some(event =>
        event.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      return recentActivity;
    });

    const retentionRate = userCount > 0 ? (activeUsers.length / userCount) * 100 : 0;

    // Demographics (placeholder - would need user profile data)
    const demographics = {
      ageGroups: {},
      genderDistribution: {},
      locationDistribution: {},
    };

    return {
      segmentId,
      segmentName: segment.name,
      userCount,
      averageMoodScore,
      retentionRate,
      crisisIncidents,
      featureAdoption,
      demographics,
    };
  }

  /**
   * Get all segments with their analysis
   */
  async getAllSegmentsAnalysis(): Promise<CohortAnalysis[]> {
    const segments = await prisma.userSegment.findMany({
      where: { isActive: true },
    });

    const analyses = await Promise.all(
      segments.map(segment => this.getCohortAnalysis(segment.id))
    );

    return analyses;
  }

  /**
   * Get segment recommendations based on user behavior
   */
  async getSegmentRecommendations(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        moodEntries: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
        crisisEvents: true,
        behaviorEvents: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
      },
    });

    if (!user) {
      return [];
    }

    const recommendations: string[] = [];

    // Analyze mood patterns
    const recentMoods = user.moodEntries.slice(0, 5);
    const averageMood = recentMoods.length > 0 ? recentMoods.reduce((sum, entry) => sum + entry.moodLevel, 0) / recentMoods.length : 5; // Default to neutral mood

    if (averageMood < 4) {
      recommendations.push('Low Mood Support Group');
    } else if (averageMood > 7) {
      recommendations.push('High Achievers Network');
    }

    // Analyze crisis history
    if (user.crisisEvents.length > 0) {
      recommendations.push('Crisis Recovery Support');
    }

    // Analyze feature usage
    const featureUsage = user.behaviorEvents
      .filter(event => event.eventType === 'feature_usage')
      .reduce((acc, event) => {
        acc[event.eventName] = (acc[event.eventName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const mostUsedFeature = Object.entries(featureUsage)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0];

    if (mostUsedFeature) {
      recommendations.push(`${mostUsedFeature[0]} Power Users`);
    }

    return recommendations;
  }
}