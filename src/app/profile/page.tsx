'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Download, Calendar, Target, Award, TrendingUp } from 'lucide-react';

interface UserStats {
  moodEntries: number;
  cbtSessions: number;
  completedSessions: number;
  avgMood: number;
  streakDays: number;
  totalScore: number;
}

interface RecentActivity {
  type: 'mood' | 'cbt';
  title: string;
  date: string;
  value?: number;
  completed?: boolean;
}

export default function ProfilePage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // This would typically fetch from an API endpoint
      // For now, we'll use mock data
      setStats({
        moodEntries: 45,
        cbtSessions: 12,
        completedSessions: 8,
        avgMood: 6.2,
        streakDays: 7,
        totalScore: 720,
      });

      setRecentActivity([
        { type: 'mood', title: 'Mood logged', date: '2024-01-15', value: 7 },
        { type: 'cbt', title: 'Thought Challenging Exercise', date: '2024-01-14', completed: true },
        { type: 'mood', title: 'Mood logged', date: '2024-01-14', value: 6 },
        { type: 'cbt', title: 'Relaxation Exercise', date: '2024-01-13', completed: false },
        { type: 'mood', title: 'Mood logged', date: '2024-01-13', value: 8 },
      ]);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (format: 'json' | 'csv' = 'json') => {
    try {
      setExporting(true);
      const response = await fetch(`/api/user/export?format=${format}&includeMood=true&includeSessions=true`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mental-health-data.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-muted-foreground">Track your mental health journey and export your data</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Mood Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.moodEntries}</div>
              <p className="text-xs text-muted-foreground">Total logged</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Target className="h-4 w-4 mr-2" />
                CBT Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedSessions}/{stats.cbtSessions}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Average Mood
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgMood}/10</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Award className="h-4 w-4 mr-2" />
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.streakDays} days</div>
              <p className="text-xs text-muted-foreground">Logging streak</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.cbtSessions > 0 ? Math.round((stats.completedSessions / stats.cbtSessions) * 100) : 0}%
              </div>
              <Progress
                value={stats.cbtSessions > 0 ? (stats.completedSessions / stats.cbtSessions) * 100 : 0}
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total CBT Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalScore}</div>
              <p className="text-xs text-muted-foreground">Points earned</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.type === 'mood' ? 'bg-blue-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {activity.type === 'mood' && activity.value && (
                        <Badge variant="outline">{activity.value}/10</Badge>
                      )}
                      {activity.type === 'cbt' && (
                        <Badge variant={activity.completed ? "default" : "secondary"}>
                          {activity.completed ? "Completed" : "In Progress"}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Your Data</CardTitle>
              <p className="text-sm text-muted-foreground">
                Download your mood tracking and CBT session data for personal records or sharing with healthcare providers.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-medium">JSON Format</h3>
                  <p className="text-sm text-muted-foreground">
                    Structured data format, ideal for importing into other applications or for developers.
                  </p>
                  <Button
                    onClick={() => handleExportData('json')}
                    disabled={exporting}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {exporting ? 'Exporting...' : 'Export as JSON'}
                  </Button>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">CSV Format</h3>
                  <p className="text-sm text-muted-foreground">
                    Spreadsheet-friendly format, perfect for Excel, Google Sheets, or data analysis.
                  </p>
                  <Button
                    onClick={() => handleExportData('csv')}
                    disabled={exporting}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {exporting ? 'Exporting...' : 'Export as CSV'}
                  </Button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">What gets exported?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• All your mood entries with dates, levels, notes, and factors</li>
                  <li>• CBT exercise sessions with progress and completion status</li>
                  <li>• Summary statistics and insights</li>
                  <li>• Exercise recommendations and performance data</li>
                </ul>
              </div>

              <div className="text-xs text-muted-foreground">
                Your data is exported securely and remains private. No personal information is included in the export.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}