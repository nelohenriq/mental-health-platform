import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SegmentationService } from '@/lib/analytics/segmentation';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSegmentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  criteria: z.object({
    userType: z.enum(['USER', 'THERAPIST', 'ADMIN']).optional(),
    moodRange: z.object({
      min: z.number().min(1).max(10),
      max: z.number().min(1).max(10),
    }).optional(),
    activityLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    crisisHistory: z.boolean().optional(),
    registrationDate: z.object({
      before: z.string().datetime().optional(),
      after: z.string().datetime().optional(),
    }).optional(),
    lastActivity: z.object({
      daysAgo: z.number().min(1),
    }).optional(),
    featureUsage: z.object({
      feature: z.string(),
      count: z.number().min(0),
      operator: z.enum(['gt', 'lt', 'eq']),
    }).optional(),
  }).optional(),
  isActive: z.boolean().optional(),
});

const segmentationService = new SegmentationService();

// GET /api/analytics/segments/[id] - Get segment analysis
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'THERAPIST'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analysis = await segmentationService.getCohortAnalysis(params.id);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error fetching segment analysis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/analytics/segments/[id] - Update segment
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
    const validatedData = updateSegmentSchema.parse(body);

    // Convert date strings to Date objects and prepare criteria
    const updates: any = { ...validatedData };
    if (validatedData.criteria?.registrationDate) {
      updates.criteria = {
        ...validatedData.criteria,
        registrationDate: {
          before: validatedData.criteria.registrationDate.before ? new Date(validatedData.criteria.registrationDate.before) : undefined,
          after: validatedData.criteria.registrationDate.after ? new Date(validatedData.criteria.registrationDate.after) : undefined,
        },
      };
    }

    const segment = await segmentationService.updateSegment(params.id, updates);

    return NextResponse.json({ segment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error updating segment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/analytics/segments/[id] - Delete segment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Note: Prisma will handle cascading deletes for memberships
    await prisma.userSegment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Segment deleted successfully' });
  } catch (error) {
    console.error('Error deleting segment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}