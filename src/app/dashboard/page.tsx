"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Target,
  Calendar,
  Award,
  Brain,
  Heart,
  BarChart3,
  Plus,
  Play,
  CheckCircle,
  Clock,
} from "lucide-react";

interface DashboardStats {
  moodToday: number | null;
  moodStreak: number;
  cbtSessionsThisWeek: number;
  cbtCompletionRate: number;
  totalExercisesCompleted: number;
  currentGoals: Array<{
    id: string;
    title: string;
    progress: number;
    target: number;
  }>;
}

interface RecentActivity {
  id: string;
  type: "mood" | "cbt" | "achievement";
  title: string;
  description: string;
  timestamp: string;
  value?: number;
  completed?: boolean;
}

interface RecommendedExercise {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  estimatedTime: number;
  description: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedExercise[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const session = await response.json();
        setIsAuthenticated(!!session?.user);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchDashboardData();
    }
  }, [isAuthenticated, authLoading]);

  const fetchDashboardData = async () => {
    try {
      // Mock data - in real app, this would come from API
      setStats({
        moodToday: 7,
        moodStreak: 5,
        cbtSessionsThisWeek: 3,
        cbtCompletionRate: 75,
        totalExercisesCompleted: 12,
        currentGoals: [
          {
            id: "1",
            title: "Complete 5 CBT exercises this week",
            progress: 3,
            target: 5,
          },
          {
            id: "2",
            title: "Log mood daily for 7 days",
            progress: 5,
            target: 7,
          },
          {
            id: "3",
            title: "Try mindfulness exercises",
            progress: 2,
            target: 3,
          },
        ],
      });

      setRecentActivity([
        {
          id: "1",
          type: "mood",
          title: "Mood Logged",
          description: "You rated your mood as 7/10",
          timestamp: new Date().toISOString(),
          value: 7,
        },
        {
          id: "2",
          type: "cbt",
          title: "Exercise Completed",
          description: "Thought Challenging: Cognitive Restructuring",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          completed: true,
        },
        {
          id: "3",
          type: "achievement",
          title: "Streak Achievement",
          description: "5-day mood logging streak!",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ]);

      setRecommendations([
        {
          id: "1",
          title: "Deep Breathing Exercise",
          category: "RELAXATION",
          difficulty: "BEGINNER",
          estimatedTime: 5,
          description: "Learn breathing techniques to reduce anxiety",
        },
        {
          id: "2",
          title: "Thought Records",
          category: "COGNITIVE_RESTRUCTURING",
          difficulty: "INTERMEDIATE",
          estimatedTime: 15,
          description: "Challenge negative thought patterns",
        },
        {
          id: "3",
          title: "Activity Scheduling",
          category: "BEHAVIOR_ACTIVATION",
          difficulty: "BEGINNER",
          estimatedTime: 10,
          description: "Plan enjoyable activities to improve mood",
        },
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "BEGINNER":
        return "bg-green-100 text-green-800";
      case "INTERMEDIATE":
        return "bg-yellow-100 text-yellow-800";
      case "ADVANCED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      THOUGHT_CHALLENGING: "bg-blue-100 text-blue-800",
      BEHAVIOR_ACTIVATION: "bg-purple-100 text-purple-800",
      RELAXATION: "bg-pink-100 text-pink-800",
      MINDFULNESS: "bg-indigo-100 text-indigo-800",
      COGNITIVE_RESTRUCTURING: "bg-orange-100 text-orange-800",
      EXPOSURE: "bg-red-100 text-red-800",
      PROBLEM_SOLVING: "bg-teal-100 text-teal-800",
      COMMUNICATION: "bg-cyan-100 text-cyan-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  if (authLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-16">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">
            Welcome to Mental Health Support
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Sign in to access your personalized dashboard and mental health
            tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login">
              <Button>Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="outline">Create Account</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
        <p className="text-muted-foreground">
          Here's your mental health progress overview
        </p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Heart className="h-4 w-4 mr-2 text-red-500" />
                Today's Mood
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.moodToday ? `${stats.moodToday}/10` : "Not logged"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.moodStreak} day streak
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Brain className="h-4 w-4 mr-2 text-blue-500" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.cbtSessionsThisWeek}
              </div>
              <p className="text-xs text-muted-foreground">CBT sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Target className="h-4 w-4 mr-2 text-green-500" />
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.cbtCompletionRate}%
              </div>
              <Progress value={stats.cbtCompletionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Award className="h-4 w-4 mr-2 text-purple-500" />
                Total Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalExercisesCompleted}
              </div>
              <p className="text-xs text-muted-foreground">Exercises done</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Current Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats?.currentGoals.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{goal.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {goal.progress}/{goal.target}
                    </span>
                  </div>
                  <Progress value={(goal.progress / goal.target) * 100} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recommended Exercises */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Recommended for You
                </span>
                <Link href="/cbt">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.slice(0, 3).map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{exercise.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {exercise.description}
                    </p>
                    <div className="flex space-x-2">
                      <Badge className={getCategoryColor(exercise.category)}>
                        {exercise.category.replace("_", " ")}
                      </Badge>
                      <Badge
                        className={getDifficultyColor(exercise.difficulty)}
                      >
                        {exercise.difficulty}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {exercise.estimatedTime} min
                      </span>
                    </div>
                  </div>
                  <Link href={`/cbt/${exercise.id}`}>
                    <Button size="sm">
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/mood/log">
                <Button className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Mood
                </Button>
              </Link>
              <Link href="/cbt">
                <Button variant="outline" className="w-full justify-start">
                  <Brain className="h-4 w-4 mr-2" />
                  Start CBT Exercise
                </Button>
              </Link>
              <Link href="/conversations">
                <Button variant="outline" className="w-full justify-start">
                  <Heart className="h-4 w-4 mr-2" />
                  Talk to AI Therapist
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === "mood"
                        ? "bg-blue-500"
                        : activity.type === "cbt"
                          ? "bg-green-500"
                          : "bg-purple-500"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  {activity.type === "mood" && activity.value && (
                    <Badge variant="outline" className="text-xs">
                      {activity.value}/10
                    </Badge>
                  )}
                  {activity.type === "cbt" && activity.completed && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Progress Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Mood logs</span>
                <span className="font-medium">5/7</span>
              </div>
              <Progress value={71} />

              <div className="flex justify-between text-sm">
                <span>CBT exercises</span>
                <span className="font-medium">3/5</span>
              </div>
              <Progress value={60} />

              <div className="flex justify-between text-sm">
                <span>AI conversations</span>
                <span className="font-medium">2/3</span>
              </div>
              <Progress value={67} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
