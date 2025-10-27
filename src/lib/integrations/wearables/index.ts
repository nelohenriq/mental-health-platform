import { FitbitIntegration } from './fitbit';
import { AppleHealthIntegration } from './apple-health';
import { GarminIntegration } from './garmin';

export interface WearableData {
  provider: 'fitbit' | 'apple-health' | 'garmin';
  userId: string;
  data: any;
  insights: {
    activityScore: number;
    sleepQualityScore: number;
    stressIndicators: any;
    recommendations: string[];
  };
  syncedAt: Date;
}

export interface HealthAppData {
  provider: 'oura' | 'whoop' | 'peloton' | 'myfitnesspal';
  userId: string;
  data: any;
  insights: {
    sleepQualityScore: number;
    readinessScore: number;
    activityScore: number;
    stressIndicators: any;
    recommendations: string[];
  };
  syncedAt: Date;
}

export class WearableIntegrationsManager {
  private integrations = new Map<string, any>();

  /**
   * Register a wearable integration
   */
  registerIntegration(provider: string, integration: any): void {
    this.integrations.set(provider, integration);
  }

  /**
   * Get integration for a specific provider
   */
  getIntegration(provider: string): any {
    return this.integrations.get(provider);
  }

  /**
   * Sync data from all connected wearables for a user
   */
  async syncAllWearables(userId: string): Promise<WearableData[]> {
    const results: WearableData[] = [];

    for (const [provider, integration] of this.integrations) {
      try {
        const data = await this.syncWearableData(userId, provider, integration);
        if (data) {
          results.push(data);
        }
      } catch (error) {
        console.error(`Failed to sync ${provider} data for user ${userId}:`, error);
      }
    }

    return results;
  }

  /**
   * Sync data from a specific wearable
   */
  async syncWearableData(userId: string, provider: string, integration: any): Promise<WearableData | null> {
    try {
      let data: any;
      let insights: any;

      switch (provider) {
        case 'fitbit':
          const fitbitActivity = await integration.getActivity(new Date().toISOString().split('T')[0]);
          const fitbitSleep = await integration.getSleep(new Date().toISOString().split('T')[0]);
          const fitbitHeartRate = await integration.getHeartRate(new Date().toISOString().split('T')[0]);
          data = { activity: fitbitActivity, sleep: fitbitSleep, heartRate: fitbitHeartRate };
          insights = integration.calculateMentalHealthInsights(fitbitActivity, fitbitSleep, fitbitHeartRate);
          break;

        case 'apple-health':
          const appleHealthData = {
            workouts: await integration.getWorkouts(new Date(Date.now() - 86400000), new Date()),
            sleep: await integration.getSleepData(new Date(Date.now() - 86400000), new Date()),
            heartRate: await integration.getHeartRateData(new Date(Date.now() - 86400000), new Date()),
            steps: await integration.getStepCount(new Date(Date.now() - 86400000), new Date()),
            activeEnergy: await integration.getActiveEnergy(new Date(Date.now() - 86400000), new Date()),
          };
          data = appleHealthData;
          insights = integration.calculateMentalHealthInsights(appleHealthData);
          break;

        case 'garmin':
          const garminActivities = await integration.getDailyActivity(new Date().toISOString().split('T')[0]);
          const garminSleep = await integration.getSleepData(new Date().toISOString().split('T')[0]);
          const garminStress = await integration.getStressData(
            new Date(Date.now() - 86400000).toISOString().split('T')[0],
            new Date().toISOString().split('T')[0]
          );
          data = { activities: garminActivities, sleep: garminSleep, stress: garminStress };
          insights = integration.calculateMentalHealthInsights(garminActivities, garminSleep, garminStress);
          break;

        default:
          return null;
      }

      return {
        provider: provider as any,
        userId,
        data,
        insights,
        syncedAt: new Date(),
      };
    } catch (error) {
      console.error(`Error syncing ${provider} data:`, error);
      return null;
    }
  }

  /**
   * Get aggregated insights from all wearables
   */
  aggregateInsights(wearableData: WearableData[]): {
    overallActivityScore: number;
    overallSleepScore: number;
    overallStressScore: number;
    combinedRecommendations: string[];
    riskFactors: string[];
  } {
    if (wearableData.length === 0) {
      return {
        overallActivityScore: 0,
        overallSleepScore: 0,
        overallStressScore: 0,
        combinedRecommendations: [],
        riskFactors: [],
      };
    }

    // Calculate weighted averages
    let totalActivityScore = 0;
    let totalSleepScore = 0;
    let totalStressScore = 0;
    let totalWeight = 0;

    const allRecommendations = new Set<string>();
    const riskFactors = new Set<string>();

    for (const data of wearableData) {
      const weight = this.getProviderWeight(data.provider);
      totalActivityScore += data.insights.activityScore * weight;
      totalSleepScore += data.insights.sleepQualityScore * weight;
      totalStressScore += (100 - (data.insights.stressIndicators?.averageStressLevel || 0)) * weight;
      totalWeight += weight;

      // Collect recommendations
      data.insights.recommendations.forEach(rec => allRecommendations.add(rec));

      // Identify risk factors
      if (data.insights.activityScore < 50) riskFactors.add('Low physical activity');
      if (data.insights.sleepQualityScore < 60) riskFactors.add('Poor sleep quality');
      if (data.insights.stressIndicators?.averageStressLevel > 70) riskFactors.add('High stress levels');
    }

    return {
      overallActivityScore: Math.round(totalActivityScore / totalWeight),
      overallSleepScore: Math.round(totalSleepScore / totalWeight),
      overallStressScore: Math.round(totalStressScore / totalWeight),
      combinedRecommendations: Array.from(allRecommendations),
      riskFactors: Array.from(riskFactors),
    };
  }

  /**
   * Get provider reliability weight for aggregation
   */
  private getProviderWeight(provider: string): number {
    const weights = {
      'fitbit': 1.0,
      'apple-health': 1.0,
      'garmin': 1.0,
    };
    return weights[provider as keyof typeof weights] || 0.5;
  }

  /**
   * Check if wearable data indicates potential mental health concerns
   */
  checkForMentalHealthFlags(wearableData: WearableData[]): {
    flags: string[];
    severity: 'low' | 'medium' | 'high';
    recommendedActions: string[];
  } {
    const flags: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';
    const actions: string[] = [];

    for (const data of wearableData) {
      const insights = data.insights;

      // Check activity levels
      if (insights.activityScore < 30) {
        flags.push('Severely reduced physical activity');
        severity = 'high';
        actions.push('Schedule follow-up with healthcare provider');
        actions.push('Consider activity monitoring and encouragement');
      } else if (insights.activityScore < 50) {
        flags.push('Reduced physical activity');
        if (severity === 'low') severity = 'medium';
        actions.push('Encourage gradual increase in daily activity');
      }

      // Check sleep quality
      if (insights.sleepQualityScore < 40) {
        flags.push('Severe sleep disturbances');
        severity = 'high';
        actions.push('Recommend sleep study consultation');
        actions.push('Immediate sleep hygiene intervention');
      } else if (insights.sleepQualityScore < 60) {
        flags.push('Poor sleep quality');
        if (severity === 'low') severity = 'medium';
        actions.push('Implement sleep improvement strategies');
      }

      // Check stress indicators
      const stressLevel = insights.stressIndicators?.averageStressLevel || 0;
      if (stressLevel > 80) {
        flags.push('Extremely high stress levels');
        severity = 'high';
        actions.push('Immediate stress reduction intervention');
        actions.push('Consider professional mental health support');
      } else if (stressLevel > 60) {
        flags.push('Elevated stress levels');
        if (severity === 'low') severity = 'medium';
        actions.push('Implement stress management techniques');
      }
    }

    return {
      flags,
      severity,
      recommendedActions: actions,
    };
  }
}

// Export individual integrations
export { FitbitIntegration, AppleHealthIntegration, GarminIntegration };
export { OuraIntegration } from '../health-apps/oura';