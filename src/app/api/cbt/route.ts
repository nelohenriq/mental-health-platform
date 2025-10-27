import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createExerciseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['THOUGHT_CHALLENGING', 'BEHAVIOR_ACTIVATION', 'RELAXATION', 'MINDFULNESS', 'COGNITIVE_RESTRUCTURING', 'EXPOSURE', 'PROBLEM_SOLVING', 'COMMUNICATION']),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  content: z.string(),
  mediaUrls: z.string().optional(),
});

// GET /api/cbt - Get CBT exercises
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');

    const exercises = await prisma.cBTExercise.findMany({
      where: {
        isActive: true,
        ...(category && { category: category as any }),
        ...(difficulty && { difficulty: difficulty as any }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(exercises);
  } catch (error) {
    console.error('Error fetching CBT exercises:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/cbt - Create new CBT exercise (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createExerciseSchema.parse(body);

    const exercise = await prisma.cBTExercise.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(exercise, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error creating CBT exercise:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}