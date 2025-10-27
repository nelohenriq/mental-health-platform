'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CBTWorksheet } from './CBTWorksheet';

interface CBTExercise {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: string;
  content: any;
}

interface CBTExerciseListProps {
  exercises: CBTExercise[];
  onStartExercise: (exerciseId: string) => void;
  onCompleteExercise: (exerciseId: string, data: any) => void;
  onSaveProgress: (exerciseId: string, data: any) => void;
}

export function CBTExerciseList({
  exercises,
  onStartExercise,
  onCompleteExercise,
  onSaveProgress,
}: CBTExerciseListProps) {
  const [selectedExercise, setSelectedExercise] = useState<CBTExercise | null>(null);
  const [activeSession, setActiveSession] = useState<any>(null);

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

  const handleStartExercise = (exercise: CBTExercise) => {
    setSelectedExercise(exercise);
    onStartExercise(exercise.id);
  };

  const handleComplete = (data: any) => {
    if (selectedExercise) {
      onCompleteExercise(selectedExercise.id, data);
      setSelectedExercise(null);
      setActiveSession(null);
    }
  };

  const handleSave = (data: any) => {
    if (selectedExercise) {
      onSaveProgress(selectedExercise.id, data);
    }
  };

  if (selectedExercise) {
    return (
      <CBTWorksheet
        exerciseId={selectedExercise.id}
        content={selectedExercise.content}
        onComplete={handleComplete}
        onSave={handleSave}
        initialData={activeSession?.progress || {}}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {exercises.map((exercise) => (
          <Card key={exercise.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{exercise.title}</CardTitle>
                <Badge className={getDifficultyColor(exercise.difficulty)}>
                  {exercise.difficulty}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className={getCategoryColor(exercise.category)}>
                  {exercise.category.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {exercise.description || 'No description available.'}
              </p>
              <Button
                onClick={() => handleStartExercise(exercise)}
                className="w-full"
              >
                Start Exercise
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {exercises.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No CBT exercises available at the moment.</p>
        </div>
      )}
    </div>
  );
}