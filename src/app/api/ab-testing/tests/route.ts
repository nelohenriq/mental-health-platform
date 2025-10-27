import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ABTestingService } from '@/lib/ab-testing/ab-testing';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const createTestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  feature: z.string().min(1),
  variants: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    config: z.record(z.any()),
    weight: z.number().min(1),
    isControl: z.boolean().optional(),
  })).min(2),
  targetAudience: z.object({
    userType: z.array(z.string()).optional(),
    segments: z.array(z.string()).optional(),
    excludeSegments: z.array(z.string()).optional(),
  }).optional(),
});

const abTestingService = new ABTestingService();

// GET /api/ab-testing/tests - Get all A/B tests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'THERAPIST'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const tests = await prisma.aBTest.findMany({
      where: status ? { status } : {},
      include: {
        variants: {
          include: {
            _count: {
              select: { assignments: true },
            },
          },
        },
        _count: {
          select: { assignments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tests });
  } catch (error) {
    console.error('Error fetching A/B tests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/ab-testing/tests - Create new A/B test
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTestSchema.parse(body);

    const test = await abTestingService.createTest(validatedData);

    return NextResponse.json({ test }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error creating A/B test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}