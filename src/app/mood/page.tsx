"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, TrendingUp, BarChart3, Plus } from "lucide-react";
import Link from "next/link";

interface MoodEntry {
  id: string;
  moodLevel: number;
  notes?: string;
  factors?: string[];
  timestamp: string;
}

export default function MoodPage() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEntries: 0,
    averageMood: 0,
    trend: "stable",
    streak: 0,
  });

  useEffect(() => {
    fetchMoodData();
  }, []);

  const fetchMoodData = async () => {
    try {
      const [entriesResponse, analyticsResponse] = await Promise.all([
        fetch("/api/mood/entries"),
        fetch("/api/mood/analytics"),
      ]);

      if (entriesResponse.ok) {
        const data = await entriesResponse.json();
        const entries = data.entries || data;
        setMoodEntries(Array.isArray(entries) ? entries.slice(0, 10) : []);
      }

      if (analyticsResponse.ok) {
        const analytics = await analyticsResponse.json();
        setStats(analytics);
      }
    } catch (error) {
      console.error("Error fetching mood data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMoodColor = (level: number) => {
    if (level <= 2) return "bg-red-100 text-red-800";
    if (level <= 4) return "bg-yellow-100 text-yellow-800";
    if (level <= 6) return "bg-blue-100 text-blue-800";
    if (level <= 8) return "bg-green-100 text-green-800";
    return "bg-emerald-100 text-emerald-800";
  };

  const getMoodLabel = (level: number) => {
    if (level <= 2) return "Very Low";
    if (level <= 4) return "Low";
    if (level <= 6) return "Neutral";
    if (level <= 8) return "Good";
    return "Excellent";
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mood Tracking</h1>
          <p className="text-muted-foreground">
            Monitor your emotional well-being over time
          </p>
        </div>
        <Link href="/mood/log">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Log Mood
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Total Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEntries}</div>
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
            <div className="text-2xl font-bold">
              {stats.averageMood.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              {getMoodLabel(Math.round(stats.averageMood))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                stats.trend === "improving"
                  ? "default"
                  : stats.trend === "declining"
                    ? "destructive"
                    : "secondary"
              }
            >
              {stats.trend.charAt(0).toUpperCase() + stats.trend.slice(1)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Logging Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.streak}</div>
            <p className="text-xs text-muted-foreground">days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Entries</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Mood Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {moodEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No mood entries yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Start tracking your mood to see patterns and insights.
                  </p>
                  <Link href="/mood/log">
                    <Button>Log Your First Mood</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {moodEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Badge className={getMoodColor(entry.moodLevel)}>
                          {entry.moodLevel}/10
                        </Badge>
                        <div>
                          <p className="font-medium">
                            {getMoodLabel(entry.moodLevel)}
                          </p>
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground">
                              {entry.notes}
                            </p>
                          )}
                          {entry.factors && entry.factors.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {entry.factors.map((factor, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {factor}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mood Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Trend Analysis Coming Soon
                </h3>
                <p className="text-muted-foreground">
                  Detailed mood trend charts and analysis will be available
                  here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mood Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  AI-Powered Insights Coming Soon
                </h3>
                <p className="text-muted-foreground">
                  Personalized insights and recommendations based on your mood
                  patterns.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
