import axios from 'axios';

export interface GarminProfile {
  userId: string;
  displayName: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  height: number;
  weight: number;
  timezone: string;
}

export interface GarminActivityData {
  activityId: number;
  activityName: string;
  description: string;
  startTimeInSeconds: number;
  startTimeOffsetInSeconds: number;
  durationInSeconds: number;
  distanceInMeters: number;
  averageSpeedInMetersPerSecond: number;
  maxSpeedInMetersPerSecond: number;
  averagePaceInMinutesPerKilometer: number;
  maxPaceInMinutesPerKilometer: number;
  steps: number;
  averageBikingCadenceInRoundsPerMinute: number;
  maxBikingCadenceInRoundsPerMinute: number;
  averageHeartRateInBeatsPerMinute: number;
  maxHeartRateInBeatsPerMinute: number;
  calories: number;
  bmrCalories: number;
  averageTemperatureInCelsius: number;
  maxTemperatureInCelsius: number;
  minTemperatureInCelsius: number;
  totalAscentInMeters: number;
  totalDescentInMeters: number;
  floorsClimbed: number;
  floorsDescended: number;
}

export interface GarminSleepData {
  dailySleepDTO: {
    id: number;
    userProfilePK: number;
    calendarDate: string;
    sleepTimeSeconds: number;
    napTimeSeconds: number;
    sleepWindowConfirmed: boolean;
    sleepWindowConfirmationType: string;
    sleepStartTimestampGMT: number;
    sleepEndTimestampGMT: number;
    unmeasurableSleepSeconds: number;
    deepSleepSeconds: number;
    lightSleepSeconds: number;
    remSleepSeconds: number;
    awakeSleepSeconds: number;
    sleepScores: {
      overall: {
        value: number;
        qualifierKey: string;
      };
      composition: {
        value: number;
        qualifierKey: string;
      };
      revitalization: {
        value: number;
        qualifierKey: string;
      };
      deepSleep: {
        value: number;
        qualifierKey: string;
      };
      remSleep: {
        value: number;
        qualifierKey: string;
      };
      lightSleep: {
        value: number;
        qualifierKey: string;
      };
      awakeSleep: {
        value: number;
        qualifierKey: string;
      };
      interruptions: {
        value: number;
        qualifierKey: string;
      };
    };
  };
}

export interface GarminStressData {
  stressValuesArray: Array<{
    timestamp: number;
    stressLevel: number;
    bodyBattery: number;
  }>;
}

export interface GarminMentalHealthInsights {
  activityScore: number;
  sleepQualityScore: number;
  stressScore: number;
  bodyBatteryScore: number;
  stressIndicators: {
    averageStressLevel: number;
    stressVariability: number;
    bodyBatteryTrend: number;
    recoveryStatus: string;
  };
  recommendations: string[];
  riskFactors: {
    highStress: boolean;
    poorSleep: boolean;
    lowActivity: boolean;
    lowRecovery: boolean;
  };
}

export class GarminIntegration {
  private readonly baseURL = 'https://apis.garmin.com';
  private accessToken: string;
  private refreshToken: string;

  constructor(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken || '';
  }

  /**
   * Get user profile information
   */
  async getProfile(): Promise<GarminProfile> {
    const response = await this.makeRequest('/wellness-api/rest/user');
    return response.data;
  }

  /**
   * Get daily activity data
   */
  async getDailyActivity(date: string): Promise<GarminActivityData[]> {
    const response = await this.makeRequest(`/wellness-api/rest/activities?date=${date}`);
    return response.data;
  }

  /**
   * Get sleep data for a specific date
   */
  async getSleepData(date: string): Promise<GarminSleepData> {
    const response = await this.makeRequest(`/wellness-api/rest/sleep?date=${date}`);
    return response.data;
  }

  /**
   * Get stress data for a date range
   */
  async getStressData(startDate: string, endDate: string): Promise<GarminStressData[]> {
    const response = await this.makeRequest(
      `/wellness-api/rest/stressData?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  }

  /**
   * Get heart rate data
   */
  async getHeartRateData(startDate: string, endDate: string): Promise<any[]> {
    const response = await this.makeRequest(
      `/wellness-api/rest/hrData?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<{ access_token: string; refresh_token: string }> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post('https://connect.garmin.com/oauth-service/oauth/token', {
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
    }, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.GARMIN_CLIENT_ID}:${process.env.GARMIN_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    this.accessToken = response.data.access_token;
    this.refreshToken = response.data.refresh_token;

    return {
      access_token: this.accessToken,
      refresh_token: this.refreshToken,
    };
  }

  /**
   * Calculate mental health insights from Garmin data
   */
  calculateMentalHealthInsights(
    activities: GarminActivityData[],
    sleep: GarminSleepData,
    stress: GarminStressData[]
  ): GarminMentalHealthInsights {
    const activityScore = this.calculateActivityScore(activities);
    const sleepQualityScore = this.calculateSleepQualityScore(sleep);
    const stressScore = this.calculateStressScore(stress);
    const bodyBatteryScore = this.calculateBodyBatteryScore(stress);
    const stressIndicators = this.calculateStressIndicators(stress);
    const recommendations = this.generateRecommendations(activityScore, sleepQualityScore, stressScore, bodyBatteryScore);
    const riskFactors = this.identifyRiskFactors(activityScore, sleepQualityScore, stressScore, bodyBatteryScore);

    return {
      activityScore,
      sleepQualityScore,
      stressScore,
      bodyBatteryScore,
      stressIndicators,
      recommendations,
      riskFactors,
    };
  }

  private async makeRequest(endpoint: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });
      return response;
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Token expired, try to refresh
        await this.refreshAccessToken();
        // Retry the request
        return this.makeRequest(endpoint);
      }
      throw error;
    }
  }

  private calculateActivityScore(activities: GarminActivityData[]): number {
    if (activities.length === 0) return 0;

    let totalScore = 0;
    let totalWeight = 0;

    for (const activity of activities) {
      let activityScore = 0;

      // Steps score (max 30 points)
      if (activity.steps) {
        const stepsTarget = 10000;
        activityScore += Math.min((activity.steps / stepsTarget) * 30, 30);
      }

      // Active time score (max 25 points)
      if (activity.durationInSeconds) {
        const durationHours = activity.durationInSeconds / 3600;
        const targetHours = 0.75; // 45 minutes
        activityScore += Math.min((durationHours / targetHours) * 25, 25);
      }

      // Calories burned score (max 25 points)
      if (activity.calories) {
        const caloriesTarget = 400;
        activityScore += Math.min((activity.calories / caloriesTarget) * 25, 25);
      }

      // Heart rate in target zone score (max 20 points)
      if (activity.averageHeartRateInBeatsPerMinute && activity.maxHeartRateInBeatsPerMinute) {
        // Simplified - in target zone if average is reasonable percentage of max
        const targetZoneRatio = activity.averageHeartRateInBeatsPerMinute / activity.maxHeartRateInBeatsPerMinute;
        if (targetZoneRatio >= 0.5 && targetZoneRatio <= 0.85) {
          activityScore += 20;
        } else if (targetZoneRatio >= 0.4 && targetZoneRatio <= 0.9) {
          activityScore += 10;
        }
      }

      // Weight by activity duration (longer activities have more impact)
      const weight = Math.min(activity.durationInSeconds / 1800, 2); // Max weight of 2
      totalScore += activityScore * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  private calculateSleepQualityScore(sleep: GarminSleepData): number {
    if (!sleep.dailySleepDTO) return 0;

    const sleepData = sleep.dailySleepDTO;
    let score = 0;

    // Overall sleep score (max 40 points)
    if (sleepData.sleepScores?.overall?.value) {
      score += (sleepData.sleepScores.overall.value / 100) * 40;
    }

    // Sleep duration score (max 30 points) - 7-9 hours optimal
    const sleepHours = sleepData.sleepTimeSeconds / 3600;
    if (sleepHours >= 7 && sleepHours <= 9) {
      score += 30;
    } else if (sleepHours >= 6 && sleepHours <= 10) {
      score += 20;
    } else {
      score += 5;
    }

    // Deep sleep score (max 20 points) - Aim for 1.5-2 hours
    const deepSleepHours = sleepData.deepSleepSeconds / 3600;
    if (deepSleepHours >= 1.5) {
      score += 20;
    } else if (deepSleepHours >= 1) {
      score += 10;
    }

    // REM sleep score (max 10 points) - Aim for 1.5-2 hours
    const remSleepHours = sleepData.remSleepSeconds / 3600;
    if (remSleepHours >= 1.5) {
      score += 10;
    } else if (remSleepHours >= 1) {
      score += 5;
    }

    return Math.round(Math.min(score, 100));
  }

  private calculateStressScore(stressData: GarminStressData[]): number {
    if (stressData.length === 0) return 0;

    // Calculate average stress level (lower is better)
    let totalStress = 0;
    let count = 0;

    for (const day of stressData) {
      for (const stressValue of day.stressValuesArray) {
        totalStress += stressValue.stressLevel;
        count++;
      }
    }

    if (count === 0) return 0;

    const avgStress = totalStress / count;

    // Convert to 0-100 scale (lower stress = higher score)
    return Math.round(Math.max(0, 100 - avgStress));
  }

  private calculateBodyBatteryScore(stressData: GarminStressData[]): number {
    if (stressData.length === 0) return 0;

    // Calculate average body battery
    let totalBattery = 0;
    let count = 0;

    for (const day of stressData) {
      for (const stressValue of day.stressValuesArray) {
        totalBattery += stressValue.bodyBattery;
        count++;
      }
    }

    return count > 0 ? Math.round(totalBattery / count) : 0;
  }

  private calculateStressIndicators(stressData: GarminStressData[]): {
    averageStressLevel: number;
    stressVariability: number;
    bodyBatteryTrend: number;
    recoveryStatus: string;
  } {
    if (stressData.length === 0) {
      return {
        averageStressLevel: 0,
        stressVariability: 0,
        bodyBatteryTrend: 0,
        recoveryStatus: 'unknown',
      };
    }

    // Calculate average stress level
    let totalStress = 0;
    let stressValues: number[] = [];
    let totalBattery = 0;
    let batteryValues: number[] = [];

    for (const day of stressData) {
      for (const stressValue of day.stressValuesArray) {
        totalStress += stressValue.stressLevel;
        stressValues.push(stressValue.stressLevel);
        totalBattery += stressValue.bodyBattery;
        batteryValues.push(stressValue.bodyBattery);
      }
    }

    const avgStress = totalStress / stressValues.length;
    const avgBattery = totalBattery / batteryValues.length;

    // Calculate stress variability (standard deviation)
    const stressVariance = stressValues.reduce((sum, stress) =>
      sum + Math.pow(stress - avgStress, 2), 0
    ) / stressValues.length;
    const stressVariability = Math.sqrt(stressVariance);

    // Determine recovery status based on body battery
    let recoveryStatus = 'good';
    if (avgBattery < 30) recoveryStatus = 'poor';
    else if (avgBattery < 50) recoveryStatus = 'fair';

    return {
      averageStressLevel: Math.round(avgStress),
      stressVariability: Math.round(stressVariability),
      bodyBatteryTrend: Math.round(avgBattery),
      recoveryStatus,
    };
  }

  private generateRecommendations(
    activityScore: number,
    sleepScore: number,
    stressScore: number,
    bodyBatteryScore: number
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

    if (stressScore < 60) {
      recommendations.push('Your stress levels appear elevated - consider relaxation techniques');
      recommendations.push('Try deep breathing exercises or meditation to manage stress');
    }

    if (bodyBatteryScore < 40) {
      recommendations.push('Your body battery is low - prioritize rest and recovery');
      recommendations.push('Consider taking it easy today and focusing on restorative activities');
    }

    return recommendations;
  }

  private identifyRiskFactors(
    activityScore: number,
    sleepScore: number,
    stressScore: number,
    bodyBatteryScore: number
  ): {
    highStress: boolean;
    poorSleep: boolean;
    lowActivity: boolean;
    lowRecovery: boolean;
  } {
    return {
      highStress: stressScore < 50,
      poorSleep: sleepScore < 60,
      lowActivity: activityScore < 50,
      lowRecovery: bodyBatteryScore < 40,
    };
  }
}