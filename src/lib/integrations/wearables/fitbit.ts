import axios from 'axios';

export interface FitbitProfile {
  user: {
    age: number;
    dateOfBirth: string;
    gender: string;
    height: number;
    weight: number;
  };
}

export interface FitbitActivity {
  activities: Array<{
    activityId: number;
    activityParentId: number;
    calories: number;
    description: string;
    distance: number;
    duration: number;
    hasActiveZoneMinutes: boolean;
    hasStartTime: boolean;
    isFavorite: boolean;
    lastModified: string;
    logId: number;
    name: string;
    startDate: string;
    startTime: string;
    steps: number;
  }>;
  goals: {
    caloriesOut: number;
    distance: number;
    floors: number;
    steps: number;
  };
  summary: {
    activeScore: number;
    activityCalories: number;
    caloriesBMR: number;
    caloriesOut: number;
    distances: Array<{
      activity: string;
      distance: number;
    }>;
    elevation: number;
    fairlyActiveMinutes: number;
    floors: number;
    lightlyActiveMinutes: number;
    marginalCalories: number;
    sedentaryMinutes: number;
    steps: number;
    veryActiveMinutes: number;
  };
}

export interface FitbitSleep {
  sleep: Array<{
    dateOfSleep: string;
    duration: number;
    efficiency: number;
    endTime: string;
    infoCode: number;
    isMainSleep: boolean;
    levels: {
      data: Array<{
        dateTime: string;
        level: string;
        seconds: number;
      }>;
      shortData: Array<{
        dateTime: string;
        level: string;
        seconds: number;
      }>;
      summary: {
        deep: { count: number; minutes: number; thirtyDayAvgMinutes: number };
        light: { count: number; minutes: number; thirtyDayAvgMinutes: number };
        rem: { count: number; minutes: number; thirtyDayAvgMinutes: number };
        wake: { count: number; minutes: number; thirtyDayAvgMinutes: number };
      };
    };
    logId: number;
    minutesAfterWakeup: number;
    minutesAsleep: number;
    minutesAwake: number;
    minutesToFallAsleep: number;
    startTime: string;
    timeInBed: number;
    type: string;
  }>;
  summary: {
    totalMinutesAsleep: number;
    totalSleepRecords: number;
    totalTimeInBed: number;
  };
}

export interface FitbitHeartRate {
  'activities-heart': Array<{
    dateTime: string;
    value: {
      customHeartRateZones: Array<{
        caloriesOut: number;
        max: number;
        min: number;
        minutes: number;
        name: string;
      }>;
      heartRateZones: Array<{
        caloriesOut: number;
        max: number;
        min: number;
        minutes: number;
        name: string;
      }>;
      restingHeartRate: number;
    };
  }>;
}

export class FitbitIntegration {
  private readonly baseURL = 'https://api.fitbit.com';
  private accessToken: string;
  private refreshToken: string;

  constructor(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken || '';
  }

  /**
   * Get user profile information
   */
  async getProfile(): Promise<FitbitProfile> {
    const response = await this.makeRequest('/1/user/-/profile.json');
    return response.data;
  }

  /**
   * Get activity data for a specific date
   */
  async getActivity(date: string): Promise<FitbitActivity> {
    const response = await this.makeRequest(`/1/user/-/activities/date/${date}.json`);
    return response.data;
  }

  /**
   * Get activity data for a date range
   */
  async getActivityTimeSeries(resource: string, startDate: string, endDate: string): Promise<any> {
    const response = await this.makeRequest(
      `/1/user/-/activities/${resource}/date/${startDate}/${endDate}.json`
    );
    return response.data;
  }

  /**
   * Get sleep data for a specific date
   */
  async getSleep(date: string): Promise<FitbitSleep> {
    const response = await this.makeRequest(`/1.2/user/-/sleep/date/${date}.json`);
    return response.data;
  }

  /**
   * Get sleep data for a date range
   */
  async getSleepTimeSeries(startDate: string, endDate: string): Promise<any> {
    const response = await this.makeRequest(
      `/1.2/user/-/sleep/date/${startDate}/${endDate}.json`
    );
    return response.data;
  }

  /**
   * Get heart rate data for a specific date
   */
  async getHeartRate(date: string): Promise<FitbitHeartRate> {
    const response = await this.makeRequest(`/1/user/-/activities/heart/date/${date}/1d.json`);
    return response.data;
  }

  /**
   * Get heart rate time series
   */
  async getHeartRateTimeSeries(startDate: string, endDate: string): Promise<any> {
    const response = await this.makeRequest(
      `/1/user/-/activities/heart/date/${startDate}/${endDate}.json`
    );
    return response.data;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<{ access_token: string; refresh_token: string }> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post('https://api.fitbit.com/oauth2/token', {
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
    }, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`).toString('base64')}`,
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
   * Calculate mental health insights from Fitbit data
   */
  calculateMentalHealthInsights(activity: FitbitActivity, sleep: FitbitSleep, heartRate: FitbitHeartRate): {
    activityScore: number;
    sleepQualityScore: number;
    stressIndicators: {
      restingHeartRate: number;
      heartRateVariability: number;
      sleepEfficiency: number;
    };
    recommendations: string[];
  } {
    // Calculate activity score (0-100)
    const activityScore = this.calculateActivityScore(activity);

    // Calculate sleep quality score (0-100)
    const sleepQualityScore = this.calculateSleepQualityScore(sleep);

    // Extract stress indicators
    const stressIndicators = this.extractStressIndicators(sleep, heartRate);

    // Generate recommendations
    const recommendations = this.generateHealthRecommendations(activityScore, sleepQualityScore, stressIndicators);

    return {
      activityScore,
      sleepQualityScore,
      stressIndicators,
      recommendations,
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

  private calculateActivityScore(activity: FitbitActivity): number {
    const summary = activity.summary;
    let score = 0;

    // Steps score (max 40 points)
    const stepsTarget = 10000;
    score += Math.min((summary.steps / stepsTarget) * 40, 40);

    // Active minutes score (max 30 points)
    const activeMinutesTarget = 150; // 2.5 hours per week = ~21 minutes per day
    const totalActiveMinutes = summary.fairlyActiveMinutes + summary.veryActiveMinutes;
    score += Math.min((totalActiveMinutes / activeMinutesTarget) * 30, 30);

    // Calories burned score (max 30 points)
    const caloriesTarget = 500; // Additional calories beyond BMR
    const additionalCalories = summary.caloriesOut - summary.caloriesBMR;
    score += Math.min((additionalCalories / caloriesTarget) * 30, 30);

    return Math.round(score);
  }

  private calculateSleepQualityScore(sleep: FitbitSleep): number {
    if (sleep.sleep.length === 0) return 0;

    const lastNight = sleep.sleep[0];
    let score = 0;

    // Duration score (max 40 points) - 7-9 hours is optimal
    const durationHours = lastNight.minutesAsleep / 60;
    if (durationHours >= 7 && durationHours <= 9) {
      score += 40;
    } else if (durationHours >= 6 && durationHours <= 10) {
      score += 30;
    } else {
      score += 10;
    }

    // Efficiency score (max 35 points)
    score += (lastNight.efficiency / 100) * 35;

    // Deep sleep score (max 25 points) - Aim for 1.5-2 hours
    const deepSleepHours = lastNight.levels.summary.deep.minutes / 60;
    if (deepSleepHours >= 1.5) {
      score += 25;
    } else if (deepSleepHours >= 1) {
      score += 15;
    } else {
      score += 5;
    }

    return Math.round(score);
  }

  private extractStressIndicators(sleep: FitbitSleep, heartRate: FitbitHeartRate): {
    restingHeartRate: number;
    heartRateVariability: number;
    sleepEfficiency: number;
  } {
    const restingHeartRate = heartRate['activities-heart'][0]?.value?.restingHeartRate || 0;
    const sleepEfficiency = sleep.sleep[0]?.efficiency || 0;

    // Simplified HRV calculation (would need more data in production)
    const heartRateVariability = restingHeartRate > 0 ? 100 - Math.abs(restingHeartRate - 60) : 0;

    return {
      restingHeartRate,
      heartRateVariability,
      sleepEfficiency,
    };
  }

  private generateHealthRecommendations(
    activityScore: number,
    sleepScore: number,
    stressIndicators: any
  ): string[] {
    const recommendations = [];

    if (activityScore < 50) {
      recommendations.push('Consider increasing daily physical activity to improve mood and reduce stress');
    }

    if (sleepScore < 60) {
      recommendations.push('Focus on improving sleep quality - aim for 7-9 hours of sleep per night');
    }

    if (stressIndicators.restingHeartRate > 80) {
      recommendations.push('Your resting heart rate suggests elevated stress levels - consider relaxation techniques');
    }

    if (stressIndicators.sleepEfficiency < 85) {
      recommendations.push('Poor sleep efficiency may indicate stress - try establishing a consistent sleep schedule');
    }

    return recommendations;
  }
}