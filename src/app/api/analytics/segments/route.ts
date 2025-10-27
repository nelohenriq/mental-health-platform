import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SegmentationService } from '@/lib/analytics/segmentation';
import { z } from 'zod';

const createSegmentSchema = z.object({
  name: z.string().min(1),
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
  }),
});

const segmentationService = new SegmentationService();

// GET /api/analytics/segments - Get all segments with analysis
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'THERAPIST'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analyses = await segmentationService.getAllSegmentsAnalysis();

    return NextResponse.json({ segments: analyses });
  } catch (error) {
    console.error('Error fetching segment analysis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/analytics/segments - Create new segment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSegmentSchema.parse(body);

    // Convert string dates to Date objects
    const criteria = {
      ...validatedData.criteria,
      registrationDate: validatedData.criteria.registrationDate ? {
        before: validatedData.criteria.registrationDate.before ? new Date(validatedData.criteria.registrationDate.before) : undefined,
        after: validatedData.criteria.registrationDate.after ? new Date(validatedData.criteria.registrationDate.after) : undefined,
      } : undefined,
    };

    const segment = await segmentationService.createSegment(
      validatedData.name,
      validatedData.description || '',
      criteria
    );

    return NextResponse.json({ segment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error creating segment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}