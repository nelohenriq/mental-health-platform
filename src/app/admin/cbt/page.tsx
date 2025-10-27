'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react';

interface CBTExercise {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: string;
  content: any;
  mediaUrls?: string[];
  isActive: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  reviewedBy?: string;
  reviewedAt?: string;
}

export default function CBTAdminPage() {
  const [exercises, setExercises] = useState<CBTExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<CBTExercise | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const [workflowAction, setWorkflowAction] = useState('');
  const [workflowComments, setWorkflowComments] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: '',
    content: '',
    mediaUrls: '',
  });

  useEffect(() => {
    fetchExercises();
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
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExercise = async () => {
    try {
      const exerciseData = {
        ...formData,
        content: JSON.parse(formData.content || '{}'),
        mediaUrls: formData.mediaUrls ? formData.mediaUrls.split(',').map(url => url.trim()) : [],
      };

      const response = await fetch('/api/cbt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exerciseData),
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        resetForm();
        fetchExercises();
      }
    } catch (error) {
      console.error('Error creating exercise:', error);
    }
  };

  const handleUpdateExercise = async () => {
    if (!selectedExercise) return;

    try {
      const exerciseData = {
        ...formData,
        content: JSON.parse(formData.content || '{}'),
        mediaUrls: formData.mediaUrls ? formData.mediaUrls.split(',').map(url => url.trim()) : [],
      };

      const response = await fetch(`/api/cbt/${selectedExercise.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exerciseData),
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        setSelectedExercise(null);
        resetForm();
        fetchExercises();
      }
    } catch (error) {
      console.error('Error updating exercise:', error);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm('Are you sure you want to delete this exercise?')) return;

    try {
      const response = await fetch(`/api/cbt/${exerciseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchExercises();
      }
    } catch (error) {
      console.error('Error deleting exercise:', error);
    }
  };

  const handleToggleActive = async (exercise: CBTExercise) => {
    try {
      const response = await fetch(`/api/cbt/${exercise.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !exercise.isActive }),
      });

      if (response.ok) {
        fetchExercises();
      }
    } catch (error) {
      console.error('Error toggling exercise status:', error);
    }
  };

  const handleWorkflowAction = async () => {
    if (!selectedExercise) return;

    try {
      const response = await fetch('/api/cbt/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: selectedExercise.id,
          action: workflowAction,
          comments: workflowComments,
        }),
      });

      if (response.ok) {
        setIsWorkflowDialogOpen(false);
        setWorkflowAction('');
        setWorkflowComments('');
        setSelectedExercise(null);
        fetchExercises();
      }
    } catch (error) {
      console.error('Error processing workflow action:', error);
    }
  };

  const openWorkflowDialog = (exercise: CBTExercise, action: string) => {
    setSelectedExercise(exercise);
    setWorkflowAction(action);
    setIsWorkflowDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      difficulty: '',
      content: '',
      mediaUrls: '',
    });
  };

  const openEditDialog = (exercise: CBTExercise) => {
    setSelectedExercise(exercise);
    setFormData({
      title: exercise.title,
      description: exercise.description || '',
      category: exercise.category,
      difficulty: exercise.difficulty,
      content: JSON.stringify(exercise.content, null, 2),
      mediaUrls: exercise.mediaUrls ? exercise.mediaUrls.join(', ') : '',
    });
    setIsEditDialogOpen(true);
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
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">CBT Content Management</h1>
          <p className="text-muted-foreground">Manage CBT exercises and content</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Exercise
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New CBT Exercise</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Exercise title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Exercise description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="THOUGHT_CHALLENGING">Thought Challenging</SelectItem>
                      <SelectItem value="BEHAVIOR_ACTIVATION">Behavior Activation</SelectItem>
                      <SelectItem value="RELAXATION">Relaxation</SelectItem>
                      <SelectItem value="MINDFULNESS">Mindfulness</SelectItem>
                      <SelectItem value="COGNITIVE_RESTRUCTURING">Cognitive Restructuring</SelectItem>
                      <SelectItem value="EXPOSURE">Exposure</SelectItem>
                      <SelectItem value="PROBLEM_SOLVING">Problem Solving</SelectItem>
                      <SelectItem value="COMMUNICATION">Communication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEGINNER">Beginner</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="content">Content (JSON)</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder='{"instructions": "Exercise instructions", "fields": [...]}'
                  rows={8}
                />
              </div>
              <div>
                <Label htmlFor="mediaUrls">Media URLs (comma-separated)</Label>
                <Input
                  id="mediaUrls"
                  value={formData.mediaUrls}
                  onChange={(e) => setFormData({ ...formData, mediaUrls: e.target.value })}
                  placeholder="https://example.com/image1.jpg, https://example.com/audio1.mp3"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateExercise}>Create Exercise</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Exercises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exercises.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Exercises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exercises.filter(e => e.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(exercises.map(e => e.category)).size}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Version</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(exercises.reduce((sum, e) => sum + e.version, 0) / exercises.length || 0).toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exercises Table */}
      <Card>
        <CardHeader>
          <CardTitle>CBT Exercises</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Workflow</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exercises.map((exercise) => (
                <TableRow key={exercise.id}>
                  <TableCell className="font-medium">{exercise.title}</TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(exercise.category)}>
                      {exercise.category.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getDifficultyColor(exercise.difficulty)}>
                      {exercise.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={exercise.isActive ? "default" : "secondary"}>
                      {exercise.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <Badge
                        className={
                          exercise.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                          exercise.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                          exercise.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                          exercise.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {exercise.status.replace('_', ' ')}
                      </Badge>
                      {exercise.status === 'DRAFT' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openWorkflowDialog(exercise, 'submit_for_review')}
                        >
                          Submit for Review
                        </Button>
                      )}
                      {exercise.status === 'PENDING_REVIEW' && (
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openWorkflowDialog(exercise, 'approve')}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openWorkflowDialog(exercise, 'reject')}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {exercise.status === 'APPROVED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openWorkflowDialog(exercise, 'publish')}
                        >
                          Publish
                        </Button>
                      )}
                      {exercise.status === 'PUBLISHED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openWorkflowDialog(exercise, 'unpublish')}
                        >
                          Unpublish
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>v{exercise.version}</TableCell>
                  <TableCell>{new Date(exercise.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(exercise)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(exercise)}
                      >
                        {exercise.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteExercise(exercise.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit CBT Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="THOUGHT_CHALLENGING">Thought Challenging</SelectItem>
                    <SelectItem value="BEHAVIOR_ACTIVATION">Behavior Activation</SelectItem>
                    <SelectItem value="RELAXATION">Relaxation</SelectItem>
                    <SelectItem value="MINDFULNESS">Mindfulness</SelectItem>
                    <SelectItem value="COGNITIVE_RESTRUCTURING">Cognitive Restructuring</SelectItem>
                    <SelectItem value="EXPOSURE">Exposure</SelectItem>
                    <SelectItem value="PROBLEM_SOLVING">Problem Solving</SelectItem>
                    <SelectItem value="COMMUNICATION">Communication</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-difficulty">Difficulty</Label>
                <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-content">Content (JSON)</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
              />
            </div>
            <div>
              <Label htmlFor="edit-mediaUrls">Media URLs (comma-separated)</Label>
              <Input
                id="edit-mediaUrls"
                value={formData.mediaUrls}
                onChange={(e) => setFormData({ ...formData, mediaUrls: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateExercise}>Update Exercise</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Workflow Action Dialog */}
      <Dialog open={isWorkflowDialogOpen} onOpenChange={setIsWorkflowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {workflowAction === 'submit_for_review' && 'Submit for Review'}
              {workflowAction === 'approve' && 'Approve Exercise'}
              {workflowAction === 'reject' && 'Reject Exercise'}
              {workflowAction === 'publish' && 'Publish Exercise'}
              {workflowAction === 'unpublish' && 'Unpublish Exercise'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {workflowAction === 'submit_for_review' && 'Submit this exercise for review by another administrator.'}
              {workflowAction === 'approve' && 'Approve this exercise for publication.'}
              {workflowAction === 'reject' && 'Reject this exercise. It will need revisions before resubmission.'}
              {workflowAction === 'publish' && 'Publish this exercise to make it available to users.'}
              {workflowAction === 'unpublish' && 'Unpublish this exercise to remove it from user access.'}
            </p>

            {selectedExercise && (
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium">{selectedExercise.title}</p>
                <p className="text-sm text-muted-foreground">
                  Current status: {selectedExercise.status.replace('_', ' ')}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="workflow-comments">Comments (optional)</Label>
              <Textarea
                id="workflow-comments"
                value={workflowComments}
                onChange={(e) => setWorkflowComments(e.target.value)}
                placeholder="Add any comments or notes..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsWorkflowDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleWorkflowAction}>
                {workflowAction === 'submit_for_review' && 'Submit for Review'}
                {workflowAction === 'approve' && 'Approve'}
                {workflowAction === 'reject' && 'Reject'}
                {workflowAction === 'publish' && 'Publish'}
                {workflowAction === 'unpublish' && 'Unpublish'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}