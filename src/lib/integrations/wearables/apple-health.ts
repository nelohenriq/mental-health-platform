import axios from 'axios';

export interface AppleHealthData {
  workouts: Array<{
    workoutActivityType: string;
    duration: number;
    durationUnit: string;
    totalEnergyBurned: number;
    totalEnergyBurnedUnit: string;
    startDate: string;
    endDate: string;
  }>;
  sleep: Array<{
    startDate: string;
    endDate: string;
    value: string; // ASLEEP, INBED, AWAKE
    sourceRevision: {
      source: {
        name: string;
      };
    };
  }>;
  heartRate: Array<{
    startDate: string;
    endDate: string;
    value: number;
    unit: string;
  }>;
  steps: Array<{
    startDate: string;
    endDate: string;
    value: number;
  }>;
  activeEnergy: Array<{
    startDate: string;
    endDate: string;
    value: number;
    unit: string;
  }>;
}

export interface AppleHealthInsights {
  activityScore: number;
  sleepQualityScore: number;
  stressIndicators: {
    heartRateVariability: number;
    sleepConsistency: number;
    activityVariability: number;
  };
  recommendations: string[];
  trends: {
    sleepTrend: 'improving' | 'stable' | 'declining';
    activityTrend: 'improving' | 'stable' | 'declining';
    heartRateTrend: 'improving' | 'stable' | 'declining';
  };
}

export class AppleHealthIntegration {
  private healthKit: any; // Would be the actual HealthKit API in a React Native context

  constructor(healthKit?: any) {
    this.healthKit = healthKit;
  }

  /**
   * Request authorization for health data access
   */
  async requestAuthorization(): Promise<boolean> {
    // In a real implementation, this would use HealthKit APIs
    // For now, return mock authorization
    return true;
  }

  /**
   * Get workout data for a date range
   */
  async getWorkouts(startDate: Date, endDate: Date): Promise<any[]> {
    // Mock workout data - in production, this would query HealthKit
    return [
      {
        workoutActivityType: 'HKWorkoutActivityTypeRunning',
        duration: 1800, // 30 minutes
        durationUnit: 'sec',
        totalEnergyBurned: 300,
        totalEnergyBurnedUnit: 'kcal',
        startDate: startDate.toISOString(),
        endDate: new Date(startDate.getTime() + 1800000).toISOString(),
      },
    ];
  }

  /**
   * Get sleep data for a date range
   */
  async getSleepData(startDate: Date, endDate: Date): Promise<any[]> {
    // Mock sleep data
    return [
      {
        startDate: new Date(startDate.getTime() + (22 * 60 * 60 * 1000)).toISOString(), // 10 PM
        endDate: new Date(startDate.getTime() + (30 * 60 * 60 * 1000)).toISOString(), // 6 AM
        value: 'ASLEEP',
        sourceRevision: {
          source: {
            name: 'Apple Watch',
          },
        },
      },
    ];
  }

  /**
   * Get heart rate data for a date range
   */
  async getHeartRateData(startDate: Date, endDate: Date): Promise<any[]> {
    // Mock heart rate data
    const data = [];
    const hours = 24;

    for (let i = 0; i < hours; i++) {
      const baseRate = 70;
      const variation = Math.sin((i / 24) * 2 * Math.PI) * 10; // Daily variation
      const randomVariation = (Math.random() - 0.5) * 10;

      data.push({
        startDate: new Date(startDate.getTime() + (i * 60 * 60 * 1000)).toISOString(),
        endDate: new Date(startDate.getTime() + ((i + 1) * 60 * 60 * 1000)).toISOString(),
        value: Math.round(baseRate + variation + randomVariation),
        unit: 'count/min',
      });
    }

    return data;
  }

  /**
   * Get step count data
   */
  async getStepCount(startDate: Date, endDate: Date): Promise<any[]> {
    // Mock step data
    return [
      {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        value: Math.floor(Math.random() * 5000) + 5000, // 5000-10000 steps
      },
    ];
  }

  /**
   * Get active energy burned
   */
  async getActiveEnergy(startDate: Date, endDate: Date): Promise<any[]> {
    // Mock active energy data
    return [
      {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        value: Math.floor(Math.random() * 500) + 300, // 300-800 kcal
        unit: 'kcal',
      },
    ];
  }

  /**
   * Calculate mental health insights from Apple Health data
   */
  calculateMentalHealthInsights(healthData: AppleHealthData): AppleHealthInsights {
    const activityScore = this.calculateActivityScore(healthData);
    const sleepQualityScore = this.calculateSleepQualityScore(healthData);
    const stressIndicators = this.calculateStressIndicators(healthData);
    const recommendations = this.generateRecommendations(activityScore, sleepQualityScore, stressIndicators);
    const trends = this.analyzeTrends(healthData);

    return {
      activityScore,
      sleepQualityScore,
      stressIndicators,
      recommendations,
      trends,
    };
  }

  /**
   * Sync health data with mental health platform
   */
  async syncHealthData(userId: string, healthData: AppleHealthData): Promise<void> {
    // In production, this would store the data in the database
    // and trigger mental health analysis

    const insights = this.calculateMentalHealthInsights(healthData);

    // Store insights for user
    console.log(`Synced health data for user ${userId}:`, insights);

    // Trigger any automated interventions based on insights
    if (insights.activityScore < 40) {
      // Trigger activity reminder
    }

    if (insights.sleepQualityScore < 50) {
      // Trigger sleep improvement suggestion
    }
  }

  private calculateActivityScore(data: AppleHealthData): number {
    let score = 0;

    // Steps score (max 40 points)
    const totalSteps = data.steps.reduce((sum, entry) => sum + entry.value, 0);
    const stepsTarget = 8000; // 8000 steps per day target
    score += Math.min((totalSteps / stepsTarget) * 40, 40);

    // Active energy score (max 35 points)
    const totalEnergy = data.activeEnergy.reduce((sum, entry) => sum + entry.value, 0);
    const energyTarget = 500; // 500 kcal target
    score += Math.min((totalEnergy / energyTarget) * 35, 35);

    // Workout consistency score (max 25 points)
    const workoutDays = new Set(
      data.workouts.map(w => new Date(w.startDate).toDateString())
    ).size;
    const workoutConsistency = (workoutDays / 7) * 25; // Assuming 7-day period
    score += workoutConsistency;

    return Math.round(Math.min(score, 100));
  }

  private calculateSleepQualityScore(data: AppleHealthData): number {
    if (data.sleep.length === 0) return 0;

    let score = 0;

    // Calculate total sleep time
    const sleepEntries = data.sleep.filter(s => s.value === 'ASLEEP');
    const totalSleepMinutes = sleepEntries.reduce((sum, entry) => {
      const start = new Date(entry.startDate);
      const end = new Date(entry.endDate);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60);
    }, 0);

    // Duration score (max 40 points) - 7-9 hours optimal
    const sleepHours = totalSleepMinutes / 60;
    if (sleepHours >= 7 && sleepHours <= 9) {
      score += 40;
    } else if (sleepHours >= 6 && sleepHours <= 10) {
      score += 30;
    } else {
      score += 10;
    }

    // Sleep consistency score (max 30 points)
    const sleepConsistency = this.calculateSleepConsistency(data.sleep);
    score += sleepConsistency * 30;

    // Sleep efficiency score (max 30 points)
    const sleepEfficiency = totalSleepMinutes / this.calculateTimeInBed(data.sleep);
    score += Math.min(sleepEfficiency * 30, 30);

    return Math.round(Math.min(score, 100));
  }

  private calculateStressIndicators(data: AppleHealthData): {
    heartRateVariability: number;
    sleepConsistency: number;
    activityVariability: number;
  } {
    const heartRateVariability = this.calculateHRV(data.heartRate);
    const sleepConsistency = this.calculateSleepConsistency(data.sleep);
    const activityVariability = this.calculateActivityVariability(data.steps);

    return {
      heartRateVariability,
      sleepConsistency,
      activityVariability,
    };
  }

  private calculateHRV(heartRateData: any[]): number {
    if (heartRateData.length < 2) return 0;

    // Simplified HRV calculation using RMSSD (Root Mean Square of Successive Differences)
    const rrIntervals: number[] = [];
    for (let i = 1; i < heartRateData.length; i++) {
      const interval = (new Date(heartRateData[i].startDate).getTime() -
                       new Date(heartRateData[i-1].startDate).getTime());
      rrIntervals.push(interval);
    }

    if (rrIntervals.length === 0) return 0;

    const meanRR = rrIntervals.reduce((sum, rr) => sum + rr, 0) / rrIntervals.length;
    const rmssd = Math.sqrt(
      rrIntervals.reduce((sum, rr) => sum + Math.pow(rr - meanRR, 2), 0) / rrIntervals.length
    );

    // Normalize to 0-100 scale (higher HRV = lower stress)
    return Math.min(Math.max((rmssd / 50) * 100, 0), 100);
  }

  private calculateSleepConsistency(sleepData: any[]): number {
    if (sleepData.length === 0) return 0;

    // Calculate consistency of bedtime and wake time
    const bedTimes: number[] = [];
    const wakeTimes: number[] = [];

    sleepData.forEach(entry => {
      if (entry.value === 'ASLEEP') {
        const bedTime = new Date(entry.startDate);
        const wakeTime = new Date(entry.endDate);

        bedTimes.push(bedTime.getHours() * 60 + bedTime.getMinutes());
        wakeTimes.push(wakeTime.getHours() * 60 + wakeTime.getMinutes());
      }
    });

    if (bedTimes.length < 2) return 0;

    // Calculate standard deviation of bed times and wake times
    const bedTimeVariance = this.calculateVariance(bedTimes);
    const wakeTimeVariance = this.calculateVariance(wakeTimes);

    // Lower variance = higher consistency (invert and scale to 0-1)
    const consistency = 1 - Math.min((bedTimeVariance + wakeTimeVariance) / 200, 1);

    return consistency;
  }

  private calculateActivityVariability(stepsData: any[]): number {
    if (stepsData.length < 7) return 0; // Need at least a week of data

    const dailySteps = stepsData.map(entry => entry.value);
    const mean = dailySteps.reduce((sum, steps) => sum + steps, 0) / dailySteps.length;
    const variance = dailySteps.reduce((sum, steps) => sum + Math.pow(steps - mean, 2), 0) / dailySteps.length;
    const stdDev = Math.sqrt(variance);

    // Coefficient of variation (lower = more consistent activity)
    const cv = stdDev / mean;

    // Convert to 0-100 scale (lower CV = higher score)
    return Math.max(0, 100 - (cv * 100));
  }

  private calculateTimeInBed(sleepData: any[]): number {
    const bedEntries = sleepData.filter(s => s.value === 'INBED');
    return bedEntries.reduce((sum, entry) => {
      const start = new Date(entry.startDate);
      const end = new Date(entry.endDate);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60);
    }, 0);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private generateRecommendations(
    activityScore: number,
    sleepScore: number,
    stressIndicators: any
  ): string[] {
    const recommendations = [];

    if (activityScore < 50) {
      recommendations.push('Consider increasing daily physical activity to improve mood and reduce stress');
      recommendations.push('Try incorporating short walks or light exercise into your routine');
    }

    if (sleepScore < 60) {
      recommendations.push('Focus on improving sleep quality - aim for 7-9 hours of sleep per night');
      recommendations.push('Establish a consistent sleep schedule to improve sleep consistency');
    }

    if (stressIndicators.heartRateVariability < 50) {
      recommendations.push('Your heart rate variability suggests elevated stress - consider relaxation techniques');
      recommendations.push('Try deep breathing exercises or meditation to improve stress resilience');
    }

    if (stressIndicators.sleepConsistency < 0.7) {
      recommendations.push('Inconsistent sleep patterns may contribute to stress - try maintaining regular bedtimes');
    }

    return recommendations;
  }

  private analyzeTrends(healthData: AppleHealthData): {
    sleepTrend: 'improving' | 'stable' | 'declining';
    activityTrend: 'improving' | 'stable' | 'declining';
    heartRateTrend: 'improving' | 'stable' | 'declining';
  } {
    // Simplified trend analysis - in production, would compare with historical data
    return {
      sleepTrend: 'stable',
      activityTrend: 'stable',
      heartRateTrend: 'stable',
    };
  }
}