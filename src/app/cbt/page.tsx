'use client';

import React, { useState, useEffect } from 'react';
import { CBTExerciseList } from '@/components/cbt/CBTExerciseList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CBTExercise {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: string;
  content: any;
}

interface CBTSession {
  id: string;
  exerciseId: string;
  progress: any;
  isCompleted: boolean;
  startedAt: string;
  completedAt?: string;
  score?: number;
  exercise: {
    id: string;
    title: string;
    category: string;
    difficulty: string;
  };
}

export default function CBTPage() {
  const [exercises, setExercises] = useState<CBTExercise[]>([]);
  const [sessions, setSessions] = useState<CBTSession[]>([]);
  const [recommendations, setRecommendations] = useState<CBTExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recommended');

  useEffect(() => {
    fetchExercises();
    fetchSessions();
    fetchRecommendations();
  }, []);

  const fetchExercises = async () => {
    try {
      const response = await fetch('/api/cbt');
      if (response.ok) {
        const data = await response.json();
        setExercises(data);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/cbt/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/cbt/recommendations');
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExercise = async (exerciseId: string) => {
    try {
      const response = await fetch('/api/cbt/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId }),
      });

      if (response.ok) {
        const session = await response.json();
        // Update sessions list
        fetchSessions();
        return session;
      }
    } catch (error) {
      console.error('Error starting exercise:', error);
    }
  };

  const handleCompleteExercise = async (exerciseId: string, data: any) => {
    try {
      // Find the active session for this exercise
      const activeSession = sessions.find(
        s => s.exerciseId === exerciseId && !s.isCompleted
      );

      if (activeSession) {
        await fetch(`/api/cbt/sessions/${activeSession.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            progress: data,
            isCompleted: true,
            score: data.score || null,
          }),
        });
      }

      // Refresh data
      fetchSessions();
      fetchRecommendations();
    } catch (error) {
      console.error('Error completing exercise:', error);
    }
  };

  const handleSaveProgress = async (exerciseId: string, data: any) => {
    try {
      // Find the active session for this exercise
      const activeSession = sessions.find(
        s => s.exerciseId === exerciseId && !s.isCompleted
      );

      if (activeSession) {
        await fetch(`/api/cbt/sessions/${activeSession.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progress: data }),
        });
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading CBT exercises...</div>
      </div>
    );
  }

  const completedSessions = sessions.filter(s => s.isCompleted);
  const inProgressSessions = sessions.filter(s => !s.isCompleted);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">CBT Exercises</h1>
        <p className="text-muted-foreground">
          Cognitive Behavioral Therapy exercises to help you build healthier thought patterns and behaviors.
        </p>
      </div>

      {/* Progress Summary */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Exercises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressSessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Exercises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exercises.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="all">All Exercises</TabsTrigger>
          <TabsTrigger value="progress">My Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="mt-6">
          <CBTExerciseList
            exercises={recommendations}
            onStartExercise={handleStartExercise}
            onCompleteExercise={handleCompleteExercise}
            onSaveProgress={handleSaveProgress}
          />
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <CBTExerciseList
            exercises={exercises}
            onStartExercise={handleStartExercise}
            onCompleteExercise={handleCompleteExercise}
            onSaveProgress={handleSaveProgress}
          />
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <div className="space-y-6">
            {inProgressSessions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">In Progress</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {inProgressSessions.map((session) => (
                    <Card key={session.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{session.exercise.title}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline">{session.exercise.category}</Badge>
                          <Badge variant="secondary">{session.exercise.difficulty}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Started: {new Date(session.startedAt).toLocaleDateString()}
                        </p>
                        <Button
                          onClick={() => handleStartExercise(session.exerciseId)}
                          className="w-full"
                        >
                          Continue Exercise
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {completedSessions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Completed</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {completedSessions.map((session) => (
                    <Card key={session.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{session.exercise.title}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline">{session.exercise.category}</Badge>
                          <Badge variant="secondary">{session.exercise.difficulty}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          Completed: {new Date(session.completedAt!).toLocaleDateString()}
                        </p>
                        {session.score && (
                          <p className="text-sm text-muted-foreground">
                            Score: {session.score}/100
                          </p>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => handleStartExercise(session.exerciseId)}
                          className="w-full mt-4"
                        >
                          Practice Again
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}