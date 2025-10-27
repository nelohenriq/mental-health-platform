'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Users, Target, Award, Calendar, BarChart3 } from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
    uniqueUsers: number;
    avgSessionsPerUser: number;
  };
  topExercises: Array<{
    exercise: {
      id: string;
      title: string;
      category: string;
      difficulty: string;
    };
    sessions: number;
    avgScore: number | null;
  }>;
  categoryPerformance: Array<{
    category: string;
    sessions: number;
    avgScore: number;
  }>;
  dailyActivity: Array<{
    date: string;
    sessions: number;
  }>;
  timeframe: string;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cbt/analytics?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return 'bg-green-100 text-green-800';
      case 'INTERMEDIATE': return 'bg-yellow-100 text-yellow-800';
      case 'ADVANCED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'THOUGHT_CHALLENGING': 'bg-blue-100 text-blue-800',
      'BEHAVIOR_ACTIVATION': 'bg-purple-100 text-purple-800',
      'RELAXATION': 'bg-pink-100 text-pink-800',
      'MINDFULNESS': 'bg-indigo-100 text-indigo-800',
      'COGNITIVE_RESTRUCTURING': 'bg-orange-100 text-orange-800',
      'EXPOSURE': 'bg-red-100 text-red-800',
      'PROBLEM_SOLVING': 'bg-teal-100 text-teal-800',
      'COMMUNICATION': 'bg-cyan-100 text-cyan-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-600">Failed to load analytics data</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">CBT Analytics Dashboard</h1>
          <p className="text-muted-foreground">Monitor CBT exercise usage and effectiveness</p>
        </div>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalSessions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.completionRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.uniqueUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Avg Sessions/User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.avgSessionsPerUser}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Award className="h-4 w-4 mr-2" />
              Completed Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.completedSessions}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="exercises" className="space-y-6">
        <TabsList>
          <TabsTrigger value="exercises">Top Exercises</TabsTrigger>
          <TabsTrigger value="categories">Category Performance</TabsTrigger>
          <TabsTrigger value="activity">Daily Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="exercises" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Popular CBT Exercises</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topExercises.map((item, index) => (
                  <div key={item.exercise.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium">{item.exercise.title}</h3>
                        <div className="flex space-x-2 mt-1">
                          <Badge className={getCategoryColor(item.exercise.category)}>
                            {item.exercise.category.replace('_', ' ')}
                          </Badge>
                          <Badge className={getDifficultyColor(item.exercise.difficulty)}>
                            {item.exercise.difficulty}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{item.sessions} sessions</div>
                      {item.avgScore && (
                        <div className="text-sm text-muted-foreground">
                          Avg score: {item.avgScore}/100
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.categoryPerformance
                  .sort((a, b) => b.sessions - a.sessions)
                  .map((category) => (
                  <div key={category.category} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge className={getCategoryColor(category.category)}>
                        {category.category.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{category.sessions} sessions</div>
                      <div className="text-sm text-muted-foreground">
                        Avg score: {category.avgScore}/100
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity ({timeframe})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end space-x-1">
                {analytics.dailyActivity.map((day, index) => {
                  const maxSessions = Math.max(...analytics.dailyActivity.map(d => d.sessions));
                  const height = maxSessions > 0 ? (day.sessions / maxSessions) * 100 : 0;

                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${height}%`, minHeight: day.sessions > 0 ? '4px' : '0px' }}
                      />
                      <div className="text-xs text-muted-foreground mt-2 transform -rotate-45 origin-top">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Sessions per day
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}