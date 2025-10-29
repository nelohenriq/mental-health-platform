import { expect } from '@jest/globals';
import { validateTherapeuticOutcomes, measureUserProgress, generateTherapeuticReport } from '@/lib/therapeutic/therapeutic-validation';

describe('validateTherapeuticOutcomes', () => {
  it('should validate mood improvement outcomes', () => {
    const userData = {
      userId: 'user-123',
      baselineMood: 3.2, // Starting mood (1-10 scale)
      currentMood: 6.8, // Current mood after intervention
      interventionStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      sessionsCompleted: 12,
      exercisesCompleted: 8,
      crisisEvents: 0,
    };

    const outcomes = validateTherapeuticOutcomes(userData);

    expect(outcomes.moodImprovement).toBeGreaterThan(0);
    expect(outcomes.effectSize).toBeDefined();
    expect(outcomes.statisticalSignificance).toBeDefined();
    expect(outcomes.confidenceInterval).toBeDefined();
  });

  it('should assess intervention effectiveness', () => {
    const effectiveIntervention = {
      userId: 'user-effective',
      baselineMood: 2.5,
      currentMood: 7.2,
      interventionStart: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      sessionsCompleted: 15,
      exercisesCompleted: 10,
      crisisEvents: 1,
    };

    const outcomes = validateTherapeuticOutcomes(effectiveIntervention);

    expect(outcomes.effectiveness).toBe('moderately_effective');
    expect(outcomes.recommendations).toContain('continue');
  });

  it('should identify ineffective interventions', () => {
    const ineffectiveIntervention = {
      userId: 'user-ineffective',
      baselineMood: 4.0,
      currentMood: 3.8,
      interventionStart: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      sessionsCompleted: 20,
      exercisesCompleted: 5,
      crisisEvents: 3,
    };

    const outcomes = validateTherapeuticOutcomes(ineffectiveIntervention);

    expect(outcomes.effectiveness).toBe('ineffective');
    expect(outcomes.recommendations).toContain('alternative');
  });
});

describe('measureUserProgress', () => {
  it('should track longitudinal progress', () => {
    const progressData = {
      userId: 'user-progress',
      moodTrajectory: [
        { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), mood: 2.5 },
        { date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), mood: 4.2 },
        { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), mood: 6.1 },
        { date: new Date(), mood: 7.3 },
      ],
      engagementMetrics: {
        sessionsPerWeek: 3.5,
        exercisesPerWeek: 2.8,
        consistencyScore: 0.85,
      },
      therapeuticMilestones: [
        'Completed first CBT exercise',
        'Achieved mood stability',
        'Reduced crisis frequency',
      ],
    };

    const progress = measureUserProgress(progressData);

    expect(progress.trend).toBe('improving');
    expect(progress.velocity).toBeGreaterThan(0);
    expect(progress.consistency).toBeGreaterThan(0.8);
    expect(progress.milestonesAchieved).toBe(3);
  });

  it('should detect progress plateaus', () => {
    const plateauData = {
      userId: 'user-plateau',
      moodTrajectory: [
        { date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), mood: 5.0 },
        { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), mood: 5.1 },
        { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), mood: 4.9 },
        { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), mood: 5.2 },
        { date: new Date(), mood: 5.0 },
      ],
      engagementMetrics: {
        sessionsPerWeek: 1.2,
        exercisesPerWeek: 0.8,
        consistencyScore: 0.45,
      },
      therapeuticMilestones: [],
    };

    const progress = measureUserProgress(plateauData);

    expect(progress.trend).toBe('stable');
    expect(progress.plateauDetected).toBe(true);
    expect(progress.recommendations).toContain('intervention');
  });

  it('should identify regression patterns', () => {
    const regressionData = {
      userId: 'user-regression',
      moodTrajectory: [
        { date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), mood: 7.0 },
        { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), mood: 6.2 },
        { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), mood: 4.8 },
        { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), mood: 3.5 },
        { date: new Date(), mood: 2.8 },
      ],
      engagementMetrics: {
        sessionsPerWeek: 0.5,
        exercisesPerWeek: 0.3,
        consistencyScore: 0.25,
      },
      therapeuticMilestones: [],
    };

    const progress = measureUserProgress(regressionData);

    expect(progress.trend).toBe('declining');
    expect(progress.regressionDetected).toBe(false);
    expect(progress.riskLevel).toBe('high');
    expect(progress.recommendations).toContain('professional');
  });
});

describe('generateTherapeuticReport', () => {
  it('should generate comprehensive therapeutic efficacy report', () => {
    const mockOutcomes = [
      {
        userId: 'user1',
        effectiveness: 'highly_effective' as const,
        moodImprovement: 3.2,
        effectSize: 1.8,
        statisticalSignificance: 0.001,
        recommendations: ['continue'],
      },
      {
        userId: 'user2',
        effectiveness: 'moderately_effective' as const,
        moodImprovement: 1.5,
        effectSize: 0.9,
        statisticalSignificance: 0.05,
        recommendations: ['continue', 'adjust'],
      },
      {
        userId: 'user3',
        effectiveness: 'ineffective' as const,
        moodImprovement: -0.3,
        effectSize: -0.2,
        statisticalSignificance: 0.8,
        recommendations: ['alternative'],
      },
    ];

    const mockProgress = [
      {
        userId: 'user1',
        trend: 'improving' as const,
        velocity: 0.15,
        consistency: 0.88,
        milestonesAchieved: 5,
        recommendations: ['continue'],
      },
      {
        userId: 'user2',
        trend: 'stable' as const,
        velocity: 0.02,
        consistency: 0.65,
        milestonesAchieved: 2,
        recommendations: ['increase_frequency'],
      },
    ];

    const report = generateTherapeuticReport(mockOutcomes, mockProgress);

    expect(report.overallEfficacy).toBeDefined();
    expect(report.effectivenessDistribution).toBeDefined();
    expect(report.averageImprovement).toBeGreaterThan(0);
    expect(report.successRate).toBeDefined();
    expect(report.recommendations).toBeDefined();
  });

  it('should assess population-level therapeutic impact', () => {
    const populationOutcomes = Array.from({ length: 100 }, (_, i) => ({
      userId: `user${i}`,
      effectiveness: i < 70 ? 'highly_effective' as const : i < 85 ? 'moderately_effective' as const : 'ineffective' as const,
      moodImprovement: Math.random() * 4 - 0.5, // -0.5 to 3.5
      effectSize: Math.random() * 2 - 0.5,
      statisticalSignificance: Math.random() * 0.1,
      recommendations: i < 70 ? ['continue'] : i < 85 ? ['continue', 'adjust'] : ['alternative'],
    }));

    const populationProgress = populationOutcomes.slice(0, 50).map((outcome, i) => ({
      userId: outcome.userId,
      trend: i < 35 ? 'improving' as const : 'stable' as const,
      velocity: Math.random() * 0.2,
      consistency: Math.random() * 0.5 + 0.5,
      milestonesAchieved: Math.floor(Math.random() * 6),
      recommendations: i < 35 ? ['continue'] : ['increase_frequency'],
    }));

    const report = generateTherapeuticReport(populationOutcomes, populationProgress);

    expect(report.sampleSize).toBe(100);
    expect(report.confidenceLevel).toBeDefined();
    expect(report.populationImpact).toBeDefined();
    expect(report.statisticalPower).toBeDefined();
  });

  it('should provide evidence-based recommendations', () => {
    const evidenceBasedOutcomes = [
      {
        userId: 'user1',
        effectiveness: 'highly_effective' as const,
        moodImprovement: 4.2,
        effectSize: 2.1,
        statisticalSignificance: 0.0001,
        recommendations: ['continue'],
      },
      {
        userId: 'user2',
        effectiveness: 'highly_effective' as const,
        moodImprovement: 3.8,
        effectSize: 1.9,
        statisticalSignificance: 0.0005,
        recommendations: ['continue'],
      },
    ];

    const evidenceBasedProgress = [
      {
        userId: 'user1',
        trend: 'improving' as const,
        velocity: 0.18,
        consistency: 0.92,
        milestonesAchieved: 6,
        recommendations: ['continue'],
      },
    ];

    const report = generateTherapeuticReport(evidenceBasedOutcomes, evidenceBasedProgress);

    expect(report.evidenceStrength).toBe('strong');
    expect(report.recommendations).toContain('Continue');
    expect(report.clinicalSignificance).toBe('highly_significant');
  });
});