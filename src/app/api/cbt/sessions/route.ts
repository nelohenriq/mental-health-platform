import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSessionSchema = z.object({
  exerciseId: z.string(),
  progress: z.record(z.any()).optional(),
});

// GET /api/cbt/sessions - Get user's CBT sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get('exerciseId');
    const completed = searchParams.get('completed');

    const sessions = await prisma.cBTSession.findMany({
      where: {
        userId: session.user.id,
        ...(exerciseId && { exerciseId }),
        ...(completed !== null && { isCompleted: completed === 'true' }),
      },
      include: {
        exercise: {
          select: {
            id: true,
            title: true,
            category: true,
            difficulty: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching CBT sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/cbt/sessions - Start new CBT session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSessionSchema.parse(body);

    // Check if exercise exists and is active
    const exercise = await prisma.cBTExercise.findUnique({
      where: { id: validatedData.exerciseId },
    });

    if (!exercise || !exercise.isActive) {
      return NextResponse.json({ error: 'Exercise not found or inactive' }, { status: 404 });
    }

    // Check if user already has an active session for this exercise
    const existingSession = await prisma.cBTSession.findFirst({
      where: {
        userId: session.user.id,
        exerciseId: validatedData.exerciseId,
        isCompleted: false,
      },
    });

    if (existingSession) {
      return NextResponse.json({ error: 'Active session already exists for this exercise' }, { status: 409 });
    }

    const newSession = await prisma.cBTSession.create({
      data: {
        userId: session.user.id,
        exerciseId: validatedData.exerciseId,
        progress: validatedData.progress ? JSON.stringify(validatedData.progress) : '{}',
      },
      include: {
        exercise: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            difficulty: true,
            content: true,
            mediaUrls: true,
          },
        },
      },
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error creating CBT session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}