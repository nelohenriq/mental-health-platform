/**
 * Therapeutic Validation Module
 *
 * This module provides functions to validate therapeutic outcomes,
 * measure user progress, and generate comprehensive therapeutic reports.
 * It ensures evidence-based evaluation of mental health interventions.
 */

export interface TherapeuticOutcome {
  userId: string;
  effectiveness: 'highly_effective' | 'moderately_effective' | 'ineffective';
  moodImprovement: number;
  effectSize: number;
  statisticalSignificance: number;
  confidenceInterval?: [number, number];
  recommendations: string[];
}

export interface ProgressData {
  userId: string;
  moodTrajectory: Array<{ date: Date; mood: number }>;
  engagementMetrics: {
    sessionsPerWeek: number;
    exercisesPerWeek: number;
    consistencyScore: number;
  };
  therapeuticMilestones: string[];
}

export interface ProgressMeasurement {
  trend: 'improving' | 'stable' | 'declining';
  velocity: number;
  consistency: number;
  milestonesAchieved: number;
  plateauDetected?: boolean;
  regressionDetected?: boolean;
  riskLevel?: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface TherapeuticReport {
  overallEfficacy: number;
  effectivenessDistribution: Record<string, number>;
  averageImprovement: number;
  successRate: number;
  sampleSize: number;
  confidenceLevel: number;
  populationImpact: number;
  statisticalPower: number;
  evidenceStrength: 'weak' | 'moderate' | 'strong';
  clinicalSignificance: 'not_significant' | 'moderately_significant' | 'highly_significant';
  recommendations: string[];
}

/**
 * Validates therapeutic outcomes based on user data
 */
export function validateTherapeuticOutcomes(userData: {
  userId: string;
  baselineMood: number;
  currentMood: number;
  interventionStart: Date;
  sessionsCompleted: number;
  exercisesCompleted: number;
  crisisEvents: number;
}): TherapeuticOutcome {
  const moodImprovement = userData.currentMood - userData.baselineMood;
  const effectSize = moodImprovement / Math.sqrt(2); // Simplified Cohen's d calculation
  const statisticalSignificance = calculateStatisticalSignificance(moodImprovement);

  let effectiveness: TherapeuticOutcome['effectiveness'];
  if (effectSize >= 0.8 && statisticalSignificance < 0.05) {
    effectiveness = 'highly_effective';
  } else if (effectSize >= 0.5 && statisticalSignificance < 0.1) {
    effectiveness = 'moderately_effective';
  } else {
    effectiveness = 'ineffective';
  }

  const recommendations = generateRecommendations(effectiveness, userData);

  return {
    userId: userData.userId,
    effectiveness,
    moodImprovement,
    effectSize,
    statisticalSignificance,
    confidenceInterval: calculateConfidenceInterval(moodImprovement),
    recommendations,
  };
}

/**
 * Measures user progress over time
 */
export function measureUserProgress(progressData: ProgressData): ProgressMeasurement {
  const { moodTrajectory, engagementMetrics, therapeuticMilestones } = progressData;

  // Calculate trend
  const recentMoods = moodTrajectory.slice(-5);
  const trend = calculateTrend(recentMoods);

  // Calculate velocity (rate of change)
  const velocity = calculateVelocity(moodTrajectory);

  // Assess consistency
  const consistency = engagementMetrics.consistencyScore;

  // Check for plateau
  const plateauDetected = detectPlateau(moodTrajectory);

  // Check for regression
  const regressionDetected = detectRegression(moodTrajectory);

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (regressionDetected || engagementMetrics.sessionsPerWeek < 1) {
    riskLevel = 'high';
  } else if (plateauDetected || consistency < 0.6) {
    riskLevel = 'medium';
  }

  const recommendations = generateProgressRecommendations(trend, plateauDetected, regressionDetected, engagementMetrics);

  return {
    trend,
    velocity,
    consistency,
    milestonesAchieved: therapeuticMilestones.length,
    plateauDetected,
    regressionDetected,
    riskLevel,
    recommendations,
  };
}

/**
 * Generates comprehensive therapeutic efficacy report
 */
export function generateTherapeuticReport(
  outcomes: TherapeuticOutcome[],
  progressData?: ProgressMeasurement[]
): TherapeuticReport {
  const sampleSize = outcomes.length;
  const averageImprovement = outcomes.reduce((sum, outcome) => sum + outcome.moodImprovement, 0) / sampleSize;

  const effectivenessDistribution = outcomes.reduce((dist, outcome) => {
    dist[outcome.effectiveness] = (dist[outcome.effectiveness] || 0) + 1;
    return dist;
  }, {} as Record<string, number>);

  const successRate = (effectivenessDistribution['highly_effective'] || 0) / sampleSize;

  const overallEfficacy = calculateOverallEfficacy(outcomes);

  const confidenceLevel = calculateConfidenceLevel(outcomes);
  const populationImpact = calculatePopulationImpact(outcomes);
  const statisticalPower = calculateStatisticalPower(outcomes);

  const evidenceStrength = determineEvidenceStrength(outcomes);
  const clinicalSignificance = determineClinicalSignificance(averageImprovement);

  const recommendations = generateReportRecommendations(outcomes, progressData);

  return {
    overallEfficacy,
    effectivenessDistribution,
    averageImprovement,
    successRate,
    sampleSize,
    confidenceLevel,
    populationImpact,
    statisticalPower,
    evidenceStrength,
    clinicalSignificance,
    recommendations,
  };
}

// Helper functions

function calculateStatisticalSignificance(improvement: number): number {
  // Simplified p-value calculation (in practice, would use proper statistical tests)
  return Math.max(0.001, Math.exp(-Math.abs(improvement) / 2));
}

function calculateConfidenceInterval(improvement: number): [number, number] {
  const margin = 0.5; // Simplified margin of error
  return [improvement - margin, improvement + margin];
}

function generateRecommendations(
  effectiveness: TherapeuticOutcome['effectiveness'],
  userData: any
): string[] {
  const recommendations: string[] = [];

  switch (effectiveness) {
    case 'highly_effective':
      recommendations.push('continue');
      if (userData.crisisEvents > 0) {
        recommendations.push('monitor');
      }
      break;
    case 'moderately_effective':
      recommendations.push('continue');
      recommendations.push('adjust');
      break;
    case 'ineffective':
      recommendations.push('alternative');
      recommendations.push('reassess');
      break;
  }

  return recommendations;
}

function calculateTrend(moods: Array<{ date: Date; mood: number }>): 'improving' | 'stable' | 'declining' {
  if (moods.length < 2) return 'stable';

  const recent = moods.slice(-3);
  const avgRecent = recent.reduce((sum, m) => sum + m.mood, 0) / recent.length;
  const avgEarlier = moods.slice(0, -3).reduce((sum, m) => sum + m.mood, 0) / Math.max(1, moods.length - 3);

  const diff = avgRecent - avgEarlier;
  if (diff > 0.5) return 'improving';
  if (diff < -0.5) return 'declining';
  return 'stable';
}

function calculateVelocity(trajectory: Array<{ date: Date; mood: number }>): number {
  if (trajectory.length < 2) return 0;

  const sorted = trajectory.sort((a, b) => a.date.getTime() - b.date.getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const daysDiff = (last.date.getTime() - first.date.getTime()) / (1000 * 60 * 60 * 24);

  return daysDiff > 0 ? (last.mood - first.mood) / daysDiff : 0;
}

function detectPlateau(trajectory: Array<{ date: Date; mood: number }>): boolean {
  if (trajectory.length < 5) return false;

  const recent = trajectory.slice(-5);
  const variance = recent.reduce((sum, m) => sum + Math.pow(m.mood - recent[0].mood, 2), 0) / recent.length;

  return variance < 0.1; // Very low variance indicates plateau
}

function detectRegression(trajectory: Array<{ date: Date; mood: number }>): boolean {
  if (trajectory.length < 3) return false;

  const recent = trajectory.slice(-3);
  const trend = calculateTrend(recent);

  return trend === 'declining';
}

function generateProgressRecommendations(
  trend: string,
  plateauDetected: boolean,
  regressionDetected: boolean,
  engagement: any
): string[] {
  const recommendations: string[] = [];

  if (regressionDetected) {
    recommendations.push('professional');
    recommendations.push('intervention');
  } else if (plateauDetected) {
    recommendations.push('intervention');
    recommendations.push('motivation');
  } else if (trend === 'improving') {
    recommendations.push('continue');
  }

  if (engagement.sessionsPerWeek < 2) {
    recommendations.push('increase_frequency');
  }

  return recommendations;
}

function calculateOverallEfficacy(outcomes: TherapeuticOutcome[]): number {
  return outcomes.reduce((sum, outcome) => {
    const weight = outcome.effectiveness === 'highly_effective' ? 1 :
                   outcome.effectiveness === 'moderately_effective' ? 0.5 : 0;
    return sum + weight;
  }, 0) / outcomes.length;
}

function calculateConfidenceLevel(outcomes: TherapeuticOutcome[]): number {
  // Simplified confidence calculation
  const significances = outcomes.map(o => o.statisticalSignificance);
  const avgSignificance = significances.reduce((sum, s) => sum + s, 0) / significances.length;
  return Math.max(0.8, 1 - avgSignificance); // Higher confidence when significance is lower
}

function calculatePopulationImpact(outcomes: TherapeuticOutcome[]): number {
  const effectiveOutcomes = outcomes.filter(o => o.effectiveness !== 'ineffective');
  return effectiveOutcomes.length / outcomes.length;
}

function calculateStatisticalPower(outcomes: TherapeuticOutcome[]): number {
  // Simplified power calculation
  const effectSizes = outcomes.map(o => Math.abs(o.effectSize));
  const avgEffectSize = effectSizes.reduce((sum, es) => sum + es, 0) / effectSizes.length;
  return Math.min(0.95, avgEffectSize * 0.8 + 0.2); // Power increases with effect size
}

function determineEvidenceStrength(outcomes: TherapeuticOutcome[]): 'weak' | 'moderate' | 'strong' {
  const significantOutcomes = outcomes.filter(o => o.statisticalSignificance < 0.05);
  const ratio = significantOutcomes.length / outcomes.length;

  if (ratio >= 0.8) return 'strong';
  if (ratio >= 0.6) return 'moderate';
  return 'weak';
}

function determineClinicalSignificance(improvement: number): 'not_significant' | 'moderately_significant' | 'highly_significant' {
  if (Math.abs(improvement) >= 2.0) return 'highly_significant';
  if (Math.abs(improvement) >= 1.0) return 'moderately_significant';
  return 'not_significant';
}

function generateReportRecommendations(
  outcomes: TherapeuticOutcome[],
  progressData?: ProgressMeasurement[]
): string[] {
  const recommendations: string[] = [];

  const avgImprovement = outcomes.reduce((sum, o) => sum + o.moodImprovement, 0) / outcomes.length;

  if (avgImprovement > 1.5) {
    recommendations.push('Continue');
  } else {
    recommendations.push('Refine');
  }

  if (progressData) {
    const regressions = progressData.filter(p => p.regressionDetected).length;
    if (regressions > progressData.length * 0.2) {
      recommendations.push('Monitor');
    }
  }

  return recommendations;
}