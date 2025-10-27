import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const workflowActionSchema = z.object({
  exerciseId: z.string(),
  action: z.enum(['submit_for_review', 'approve', 'reject', 'publish', 'unpublish']),
  comments: z.string().optional(),
});

// POST /api/cbt/workflow - Handle workflow actions for CBT exercises
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = workflowActionSchema.parse(body);

    const { exerciseId, action, comments } = validatedData;

    // Get current exercise
    const exercise = await (prisma as any).cBTExercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    let newStatus: string;
    let updateData: any = {};

    switch (action) {
      case 'submit_for_review':
        if (exercise.status !== 'DRAFT') {
          return NextResponse.json({ error: 'Only draft exercises can be submitted for review' }, { status: 400 });
        }
        newStatus = 'PENDING_REVIEW';
        break;

      case 'approve':
        if (exercise.status !== 'PENDING_REVIEW') {
          return NextResponse.json({ error: 'Only pending review exercises can be approved' }, { status: 400 });
        }
        newStatus = 'APPROVED';
        updateData.reviewedBy = session.user.id;
        updateData.reviewedAt = new Date();
        break;

      case 'reject':
        if (exercise.status !== 'PENDING_REVIEW') {
          return NextResponse.json({ error: 'Only pending review exercises can be rejected' }, { status: 400 });
        }
        newStatus = 'REJECTED';
        updateData.reviewedBy = session.user.id;
        updateData.reviewedAt = new Date();
        break;

      case 'publish':
        if (exercise.status !== 'APPROVED') {
          return NextResponse.json({ error: 'Only approved exercises can be published' }, { status: 400 });
        }
        newStatus = 'PUBLISHED';
        updateData.isActive = true;
        break;

      case 'unpublish':
        if (exercise.status !== 'PUBLISHED') {
          return NextResponse.json({ error: 'Only published exercises can be unpublished' }, { status: 400 });
        }
        newStatus = 'APPROVED';
        updateData.isActive = false;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Create version snapshot before major changes
    if (['approve', 'publish'].includes(action)) {
      await (prisma as any).cBTExerciseVersion.create({
        data: {
          exerciseId,
          version: exercise.version,
          title: exercise.title,
          description: exercise.description,
          category: exercise.category,
          difficulty: exercise.difficulty,
          content: exercise.content,
          mediaUrls: exercise.mediaUrls,
          changes: comments || `${action} action performed`,
          createdBy: session.user.id,
        },
      });
    }

    // Update exercise status
    const updatedExercise = await (prisma as any).cBTExercise.update({
      where: { id: exerciseId },
      data: {
        ...updateData,
        status: newStatus as any,
      },
    });

    return NextResponse.json({
      exercise: updatedExercise,
      message: `Exercise ${action.replace('_', ' ')} successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error processing workflow action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}