'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Target, Star, Award, Lock, CheckCircle } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
  category: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  category: string;
  reward: string;
}

interface AchievementStats {
  totalSessions: number;
  completedSessions: number;
  totalScore: number;
  moodEntries: number;
  unlockedAchievements: number;
  totalAchievements: number;
  achievementProgress: number;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await fetch('/api/achievements');
      if (response.ok) {
        const data = await response.json();
        setAchievements(data.achievements);
        setMilestones(data.milestones);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      cbt: 'bg-blue-100 text-blue-800',
      mood: 'bg-green-100 text-green-800',
      consistency: 'bg-purple-100 text-purple-800',
      performance: 'bg-orange-100 text-orange-800',
      exploration: 'bg-pink-100 text-pink-800',
      community: 'bg-teal-100 text-teal-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const AchievementCard = ({ achievement, isMilestone = false }: { achievement: Achievement | Milestone; isMilestone?: boolean }) => {
    const isUnlocked = 'unlocked' in achievement ? achievement.unlocked : achievement.progress >= achievement.target;
    const progressPercent = (achievement.progress / achievement.target) * 100;

    return (
      <Card className={`relative ${isUnlocked ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className={`text-3xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
              {achievement.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-semibold">{achievement.title}</h3>
                {isUnlocked && <CheckCircle className="h-5 w-5 text-green-600" />}
                {!isUnlocked && <Lock className="h-4 w-4 text-gray-400" />}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>

              <div className="flex items-center justify-between mb-2">
                <Badge className={getCategoryColor(achievement.category)}>
                  {achievement.category}
                </Badge>
                <span className="text-sm font-medium">
                  {achievement.progress}/{achievement.target}
                </span>
              </div>

              <Progress value={progressPercent} className="h-2" />

              {'reward' in achievement && achievement.reward && (
                <p className="text-xs text-green-600 mt-2 font-medium">
                  Reward: {achievement.reward}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading achievements...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Achievements & Milestones 🏆</h1>
        <p className="text-muted-foreground">Track your progress and unlock rewards</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Achievement Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.achievementProgress}%</div>
              <Progress value={stats.achievementProgress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {stats.unlockedAchievements}/{stats.totalAchievements} unlocked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">CBT Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completedSessions} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalScore}</div>
              <p className="text-xs text-muted-foreground">Points earned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Mood Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.moodEntries}</div>
              <p className="text-xs text-muted-foreground">Logs recorded</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="achievements" className="space-y-6">
        <TabsList>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {milestones.map((milestone) => (
              <AchievementCard key={milestone.id} achievement={milestone} isMilestone />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Achievement Categories Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Achievement Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center space-x-3">
              <Badge className="bg-blue-100 text-blue-800">CBT</Badge>
              <span className="text-sm">Cognitive Behavioral Therapy exercises</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-green-100 text-green-800">Mood</Badge>
              <span className="text-sm">Mood tracking and logging</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-purple-100 text-purple-800">Consistency</Badge>
              <span className="text-sm">Regular activity and streaks</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-orange-100 text-orange-800">Performance</Badge>
              <span className="text-sm">High scores and excellence</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-pink-100 text-pink-800">Exploration</Badge>
              <span className="text-sm">Trying different exercise types</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-teal-100 text-teal-800">Community</Badge>
              <span className="text-sm">Platform contribution and feedback</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}