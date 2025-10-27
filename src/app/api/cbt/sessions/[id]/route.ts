import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSessionSchema = z.object({
  progress: z.record(z.any()).optional(),
  isCompleted: z.boolean().optional(),
  score: z.number().min(0).max(100).optional(),
});

// GET /api/cbt/sessions/[id] - Get specific CBT session
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cbtSession = await prisma.cBTSession.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
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

    if (!cbtSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(cbtSession);
  } catch (error) {
    console.error('Error fetching CBT session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/cbt/sessions/[id] - Update CBT session progress
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSessionSchema.parse(body);

    // Check if session exists and belongs to user
    const existingSession = await prisma.cBTSession.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (validatedData.progress !== undefined) {
      updateData.progress = JSON.stringify(validatedData.progress);
    }
    if (validatedData.isCompleted !== undefined) {
      updateData.isCompleted = validatedData.isCompleted;
      if (validatedData.isCompleted) {
        updateData.completedAt = new Date();
      }
    }
    if (validatedData.score !== undefined) {
      updateData.score = validatedData.score;
    }

    const updatedSession = await prisma.cBTSession.update({
      where: { id: params.id },
      data: updateData,
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
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error updating CBT session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/cbt/sessions/[id] - Delete CBT session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if session exists and belongs to user
    const existingSession = await prisma.cBTSession.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    await prisma.cBTSession.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting CBT session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}