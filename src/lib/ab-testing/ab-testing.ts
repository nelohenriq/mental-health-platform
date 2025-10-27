import { prisma } from '@/lib/prisma';

export interface ABTestConfig {
  name: string;
  description?: string;
  feature: string;
  variants: ABTestVariantConfig[];
  targetAudience?: {
    userType?: string[];
    segments?: string[];
    excludeSegments?: string[];
  };
}

export interface ABTestVariantConfig {
  name: string;
  description?: string;
  config: Record<string, any>;
  weight: number;
  isControl?: boolean;
}

export interface ABTestResult {
  testId: string;
  testName: string;
  status: string;
  variants: ABTestVariantResult[];
  winner?: string;
  confidence: number;
  startDate: Date;
  endDate?: Date;
  sampleSize: number;
}

export interface ABTestVariantResult {
  variantId: string;
  variantName: string;
  userCount: number;
  conversionRate: number;
  averageSessionDuration: number;
  featureUsage: Record<string, number>;
  crisisEvents: number;
  moodImprovement: number;
}

export class ABTestingService {
  /**
   * Create a new A/B test
   */
  async createTest(config: ABTestConfig) {
    // Validate variant weights sum to reasonable total
    const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight === 0) {
      throw new Error('Total variant weight must be greater than 0');
    }

    // Ensure exactly one control variant
    const controlVariants = config.variants.filter(v => v.isControl);
    if (controlVariants.length !== 1) {
      throw new Error('Exactly one control variant must be specified');
    }

    const test = await prisma.aBTest.create({
      data: {
        name: config.name,
        description: config.description,
        feature: config.feature,
        status: 'DRAFT',
      },
    });

    // Create variants
    for (const variant of config.variants) {
      await prisma.aBTestVariant.create({
        data: {
          testId: test.id,
          name: variant.name,
          description: variant.description,
          config: JSON.stringify(variant.config),
          weight: variant.weight,
          isControl: variant.isControl || false,
        },
      });
    }

    return test;
  }

  /**
   * Start an A/B test
   */
  async startTest(testId: string) {
    const test = await prisma.aBTest.findUnique({
      where: { id: testId },
      include: { variants: true },
    });

    if (!test) {
      throw new Error('Test not found');
    }

    if (test.status !== 'DRAFT') {
      throw new Error('Test must be in DRAFT status to start');
    }

    await prisma.aBTest.update({
      where: { id: testId },
      data: {
        status: 'ACTIVE',
        startDate: new Date(),
      },
    });

    return test;
  }

  /**
   * Assign user to test variant
   */
  async assignUserToVariant(testId: string, userId: string): Promise<string> {
    // Check if user is already assigned
    const existingAssignment = await prisma.aBTestAssignment.findUnique({
      where: {
        testId_userId: {
          testId,
          userId,
        },
      },
    });

    if (existingAssignment) {
      return existingAssignment.variantId;
    }

    // Get test variants with weights
    const variants = await prisma.aBTestVariant.findMany({
      where: { testId },
      orderBy: { createdAt: 'asc' },
    });

    if (variants.length === 0) {
      throw new Error('No variants found for test');
    }

    // Use consistent hashing for deterministic assignment
    const variantIndex = this.getVariantIndexForUser(userId, variants.length);
    const selectedVariant = variants[variantIndex];

    // Create assignment
    await prisma.aBTestAssignment.create({
      data: {
        testId,
        variantId: selectedVariant.id,
        userId,
      },
    });

    return selectedVariant.id;
  }

  /**
   * Get user's test variant
   */
  async getUserVariant(testId: string, userId: string): Promise<Record<string, any> | null> {
    const assignment = await prisma.aBTestAssignment.findUnique({
      where: {
        testId_userId: {
          testId,
          userId,
        },
      },
      include: {
        variant: true,
      },
    });

    if (!assignment) {
      return null;
    }

    return JSON.parse(assignment.variant.config);
  }

  /**
   * Track event for A/B test
   */
  async trackEvent(testId: string, userId: string, eventType: string, eventName: string, properties?: Record<string, any>) {
    const assignment = await prisma.aBTestAssignment.findUnique({
      where: {
        testId_userId: {
          testId,
          userId,
        },
      },
    });

    if (!assignment) {
      // User not assigned to this test, skip tracking
      return;
    }

    await prisma.aBTestEvent.create({
      data: {
        assignmentId: assignment.id,
        eventType,
        eventName,
        properties: properties ? JSON.stringify(properties) : null,
      },
    });
  }

  /**
   * Get test results
   */
  async getTestResults(testId: string): Promise<ABTestResult> {
    const test = await prisma.aBTest.findUnique({
      where: { id: testId },
      include: {
        variants: {
          include: {
            assignments: {
              include: {
                events: true,
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
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!test) {
      throw new Error('Test not found');
    }

    const variants: ABTestVariantResult[] = test.variants.map(variant => {
      const userCount = variant.assignments.length;
      const events = variant.assignments.flatMap(a => a.events);

      // Calculate conversion rate (users who completed target action)
      const conversions = events.filter(e => e.eventType === 'conversion').length;
      const conversionRate = userCount > 0 ? (conversions / userCount) * 100 : 0;

      // Calculate average session duration
      const sessionEvents = events.filter(e => e.eventType === 'session');
      const averageSessionDuration = sessionEvents.length > 0
        ? sessionEvents.reduce((sum, e) => {
            const props = e.properties ? JSON.parse(e.properties) : {};
            return sum + (props.duration || 0);
          }, 0) / sessionEvents.length
        : 0;

      // Feature usage analysis
      const featureUsage: Record<string, number> = {};
      events.filter(e => e.eventType === 'feature_usage').forEach(e => {
        featureUsage[e.eventName] = (featureUsage[e.eventName] || 0) + 1;
      });

      // Crisis events and mood improvement
      const crisisEvents = variant.assignments.reduce((sum, a) => sum + a.user.crisisEvents.length, 0);
      const moodImprovement = variant.assignments.reduce((sum, a) => {
        const recentMoods = a.user.moodEntries.slice(-2);
        if (recentMoods.length === 2) {
          return sum + (recentMoods[1].moodLevel - recentMoods[0].moodLevel);
        }
        return sum;
      }, 0) / variant.assignments.length || 0;

      return {
        variantId: variant.id,
        variantName: variant.name,
        userCount,
        conversionRate,
        averageSessionDuration,
        featureUsage,
        crisisEvents,
        moodImprovement,
      };
    });

    // Determine winner (simplified: highest conversion rate with minimum sample size)
    const minSampleSize = 100; // Minimum users per variant for statistical significance
    const eligibleVariants = variants.filter(v => v.userCount >= minSampleSize);
    const winner = eligibleVariants.length > 0
      ? eligibleVariants.reduce((best, current) =>
          current.conversionRate > best.conversionRate ? current : best
        ).variantName
      : undefined;

    // Calculate confidence (simplified)
    const confidence = eligibleVariants.length >= 2 ? 85 : 0; // Placeholder

    return {
      testId,
      testName: test.name,
      status: test.status,
      variants,
      winner,
      confidence,
      startDate: test.startDate!,
      endDate: test.endDate || undefined,
      sampleSize: variants.reduce((sum, v) => sum + v.userCount, 0),
    };
  }

  /**
   * End A/B test and declare winner
   */
  async endTest(testId: string) {
    const results = await this.getTestResults(testId);

    await prisma.aBTest.update({
      where: { id: testId },
      data: {
        status: 'COMPLETED',
        endDate: new Date(),
      },
    });

    return results;
  }

  /**
   * Get all active tests for a user
   */
  async getActiveTestsForUser(userId: string): Promise<Array<{ testId: string; variantConfig: Record<string, any> }>> {
    const assignments = await prisma.aBTestAssignment.findMany({
      where: {
        userId,
        test: {
          status: 'ACTIVE',
        },
      },
      include: {
        test: true,
        variant: true,
      },
    });

    return assignments.map(assignment => ({
      testId: assignment.testId,
      variantConfig: JSON.parse(assignment.variant.config),
    }));
  }

  /**
   * Get statistical significance between variants (simplified)
   */
  calculateStatisticalSignificance(variantA: ABTestVariantResult, variantB: ABTestVariantResult): number {
    // Simplified statistical significance calculation
    // In production, use proper statistical tests (t-test, chi-square, etc.)
    const diff = Math.abs(variantA.conversionRate - variantB.conversionRate);
    const pooledError = Math.sqrt(
      (variantA.conversionRate * (100 - variantA.conversionRate) / variantA.userCount) +
      (variantB.conversionRate * (100 - variantB.conversionRate) / variantB.userCount)
    );

    if (pooledError === 0) return 0;

    const zScore = diff / pooledError;
    // Convert z-score to confidence level (simplified)
    return Math.min(99.9, zScore * 15); // Rough approximation
  }

  /**
   * Consistent hashing for user assignment
   */
  private getVariantIndexForUser(userId: string, variantCount: number): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % variantCount;
  }
}