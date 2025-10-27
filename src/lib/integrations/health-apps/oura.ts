import axios from 'axios';

export interface OuraSleepData {
  sleep: Array<{
    awake: number;
    bed_time_end: string;
    bed_time_start: string;
    breath_average: number;
    deep: number;
    duration: number;
    efficiency: number;
    heart_rate: {
      interval: number;
      items: number[];
      timestamp: string;
    };
    hrv: {
      interval: number;
      items: number[];
      timestamp: string;
    };
    hypnogram_5min: string;
    is_longest: number;
    light: number;
    midpoint_at_delta: number;
    midpoint_time: number;
    onset_latency: number;
    period_id: number;
    rem: number;
    restless: number;
    rmssd: number;
    score: number;
    score_alignment: number;
    score_deep: number;
    score_disturbances: number;
    score_efficiency: number;
    score_latency: number;
    score_rem: number;
    score_total: number;
    summary_date: string;
    temperature_delta: number;
    temperature_deviation: number;
    temperature_trend_deviation: number;
    timezone: number;
    total: number;
  }>;
}

export interface OuraActivityData {
  activity: Array<{
    day_end: string;
    day_start: string;
    timezone: number;
    score: number;
    score_meet_daily_targets: number;
    score_move_every_hour: number;
    score_recovery_time: number;
    score_stay_active: number;
    score_training_frequency: number;
    score_training_volume: number;
    target_calories: number;
    target_km: number;
    target_meters: number;
    to_target_km: number;
    to_target_meters: number;
    total_calories: number;
  }>;
}

export interface OuraReadinessData {
  readiness: Array<{
    score: number;
    score_activity_balance: number;
    score_hrv_balance: number;
    score_previous_day: number;
    score_previous_night: number;
    score_recovery_index: number;
    score_resting_hr: number;
    score_sleep_balance: number;
    score_temperature: number;
  }>;
}

export interface OuraMentalHealthInsights {
  sleepQualityScore: number;
  readinessScore: number;
  activityScore: number;
  stressIndicators: {
    hrvScore: number;
    sleepEfficiency: number;
    bodySignals: number;
    recoveryIndex: number;
  };
  recommendations: string[];
  riskFactors: {
    sleepDeprivation: boolean;
    highStress: boolean;
    lowActivity: boolean;
    poorRecovery: boolean;
  };
}

export class OuraIntegration {
  private readonly baseURL = 'https://api.ouraring.com/v2';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Get sleep data for a date range
   */
  async getSleepData(startDate: string, endDate: string): Promise<OuraSleepData> {
    const response = await this.makeRequest(
      `/usercollection/sleep?start_date=${startDate}&end_date=${endDate}`
    );
    return response.data;
  }

  /**
   * Get activity data for a date range
   */
  async getActivityData(startDate: string, endDate: string): Promise<OuraActivityData> {
    const response = await this.makeRequest(
      `/usercollection/daily_activity?start_date=${startDate}&end_date=${endDate}`
    );
    return response.data;
  }

  /**
   * Get readiness data for a date range
   */
  async getReadinessData(startDate: string, endDate: string): Promise<OuraReadinessData> {
    const response = await this.makeRequest(
      `/usercollection/daily_readiness?start_date=${startDate}&end_date=${endDate}`
    );
    return response.data;
  }

  /**
   * Get heart rate data for a specific date
   */
  async getHeartRateData(date: string): Promise<any> {
    const response = await this.makeRequest(
      `/usercollection/heartrate?date=${date}`
    );
    return response.data;
  }

  /**
   * Calculate comprehensive mental health insights from Oura data
   */
  calculateMentalHealthInsights(
    sleepData: OuraSleepData,
    activityData: OuraActivityData,
    readinessData: OuraReadinessData
  ): OuraMentalHealthInsights {
    const sleepQualityScore = this.calculateSleepQualityScore(sleepData);
    const readinessScore = this.calculateReadinessScore(readinessData);
    const activityScore = this.calculateActivityScore(activityData);
    const stressIndicators = this.calculateStressIndicators(sleepData, readinessData);
    const recommendations = this.generateRecommendations(sleepQualityScore, readinessScore, activityScore, stressIndicators);
    const riskFactors = this.identifyRiskFactors(sleepQualityScore, readinessScore, activityScore, stressIndicators);

    return {
      sleepQualityScore,
      readinessScore,
      activityScore,
      stressIndicators,
      recommendations,
      riskFactors,
    };
  }

  /**
   * Get personalized insights for mental health based on Oura data
   */
  getPersonalizedInsights(userId: string, days: number = 7): Promise<OuraMentalHealthInsights> {
    // This would fetch data for the user and calculate insights
    // For now, return mock data
    return Promise.resolve({
      sleepQualityScore: 75,
      readinessScore: 80,
      activityScore: 70,
      stressIndicators: {
        hrvScore: 65,
        sleepEfficiency: 88,
        bodySignals: 72,
        recoveryIndex: 78,
      },
      recommendations: [
        'Your sleep quality is good, but try to maintain consistent bedtimes',
        'Consider adding more movement throughout the day',
        'Your readiness score indicates good recovery - keep up the good work',
      ],
      riskFactors: {
        sleepDeprivation: false,
        highStress: false,
        lowActivity: true,
        poorRecovery: false,
      },
    });
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const response = await axios.get(`${this.baseURL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    return response;
  }

  private calculateSleepQualityScore(sleepData: OuraSleepData): number {
    if (sleepData.sleep.length === 0) return 0;

    const latestSleep = sleepData.sleep[sleepData.sleep.length - 1];
    let score = 0;

    // Total sleep score (max 40 points)
    score += Math.min(latestSleep.score_total, 100) * 0.4;

    // Sleep efficiency (max 30 points)
    score += (latestSleep.efficiency / 100) * 30;

    // REM sleep percentage (max 20 points) - Aim for 20-25%
    const remPercentage = (latestSleep.rem / latestSleep.total) * 100;
    if (remPercentage >= 20 && remPercentage <= 25) {
      score += 20;
    } else if (remPercentage >= 15 && remPercentage <= 30) {
      score += 15;
    } else {
      score += 5;
    }

    // Deep sleep percentage (max 10 points) - Aim for 13-23%
    const deepPercentage = (latestSleep.deep / latestSleep.total) * 100;
    if (deepPercentage >= 13 && deepPercentage <= 23) {
      score += 10;
    } else if (deepPercentage >= 10 && deepPercentage <= 30) {
      score += 5;
    }

    return Math.round(score);
  }

  private calculateReadinessScore(readinessData: OuraReadinessData): number {
    if (readinessData.readiness.length === 0) return 0;

    const latestReadiness = readinessData.readiness[readinessData.readiness.length - 1];
    return latestReadiness.score;
  }

  private calculateActivityScore(activityData: OuraActivityData): number {
    if (activityData.activity.length === 0) return 0;

    const latestActivity = activityData.activity[activityData.activity.length - 1];
    return latestActivity.score;
  }

  private calculateStressIndicators(sleepData: OuraSleepData, readinessData: OuraReadinessData): {
    hrvScore: number;
    sleepEfficiency: number;
    bodySignals: number;
    recoveryIndex: number;
  } {
    const latestSleep = sleepData.sleep[sleepData.sleep.length - 1];
    const latestReadiness = readinessData.readiness[readinessData.readiness.length - 1];

    return {
      hrvScore: latestReadiness?.score_hrv_balance || 0,
      sleepEfficiency: latestSleep?.efficiency || 0,
      bodySignals: latestReadiness?.score_temperature || 0,
      recoveryIndex: latestReadiness?.score_recovery_index || 0,
    };
  }

  private generateRecommendations(
    sleepScore: number,
    readinessScore: number,
    activityScore: number,
    stressIndicators: any
  ): string[] {
    const recommendations = [];

    if (sleepScore < 70) {
      recommendations.push('Focus on improving sleep quality - aim for consistent bedtimes and wake times');
      recommendations.push('Consider creating a better sleep environment (cooler, darker room)');
    }

    if (readinessScore < 70) {
      recommendations.push('Your body needs more recovery - consider taking it easy today');
      recommendations.push('Ensure you\'re staying hydrated and eating nutritious meals');
    }

    if (activityScore < 70) {
      recommendations.push('Try to incorporate more movement throughout your day');
      recommendations.push('Consider setting a daily step goal that\'s achievable for you');
    }

    if (stressIndicators.hrvScore < 60) {
      recommendations.push('Your heart rate variability suggests elevated stress - try relaxation techniques');
      recommendations.push('Consider deep breathing exercises or meditation');
    }

    if (stressIndicators.recoveryIndex < 60) {
      recommendations.push('Your recovery index is low - prioritize rest and recovery activities');
    }

    return recommendations;
  }

  private identifyRiskFactors(
    sleepScore: number,
    readinessScore: number,
    activityScore: number,
    stressIndicators: any
  ): {
    sleepDeprivation: boolean;
    highStress: boolean;
    lowActivity: boolean;
    poorRecovery: boolean;
  } {
    return {
      sleepDeprivation: sleepScore < 60,
      highStress: stressIndicators.hrvScore < 50 || readinessScore < 60,
      lowActivity: activityScore < 60,
      poorRecovery: stressIndicators.recoveryIndex < 50,
    };
  }
}