import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateExerciseSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(['THOUGHT_CHALLENGING', 'BEHAVIOR_ACTIVATION', 'RELAXATION', 'MINDFULNESS', 'COGNITIVE_RESTRUCTURING', 'EXPOSURE', 'PROBLEM_SOLVING', 'COMMUNICATION']).optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  content: z.any().optional(),
  mediaUrls: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/cbt/[id] - Get specific CBT exercise
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exercise = await prisma.cBTExercise.findUnique({
      where: { id: params.id },
    });

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Error fetching CBT exercise:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/cbt/[id] - Update CBT exercise
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateExerciseSchema.parse(body);

    // Check if exercise exists
    const existingExercise = await prisma.cBTExercise.findUnique({
      where: { id: params.id },
    });

    if (!existingExercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    const updateData: any = { ...validatedData };

    // Increment version if content changes
    if (validatedData.content || validatedData.title || validatedData.description) {
      updateData.version = existingExercise.version + 1;
    }

    const updatedExercise = await prisma.cBTExercise.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updatedExercise);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error updating CBT exercise:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/cbt/[id] - Delete CBT exercise
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if exercise exists
    const existingExercise = await prisma.cBTExercise.findUnique({
      where: { id: params.id },
    });

    if (!existingExercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    // Check if exercise has active sessions
    const activeSessions = await prisma.cBTSession.count({
      where: {
        exerciseId: params.id,
        isCompleted: false,
      },
    });

    if (activeSessions > 0) {
      return NextResponse.json({
        error: 'Cannot delete exercise with active sessions. Deactivate it instead.'
      }, { status: 409 });
    }

    await prisma.cBTExercise.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    console.error('Error deleting CBT exercise:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}