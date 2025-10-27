import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createReferralSchema = z.object({
  crisisEventId: z.string().optional(),
  professionalType: z.enum(['THERAPIST', 'PSYCHIATRIST', 'COUNSELOR', 'OTHER']),
  urgency: z.enum(['IMMEDIATE', 'URGENT', 'ROUTINE']),
  notes: z.string().optional(),
});

// GET /api/professional-referrals - Get referrals (admin/therapist only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'THERAPIST'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const urgency = searchParams.get('urgency');

    const referrals = await prisma.professionalReferral.findMany({
      where: {
        ...(status && { status }),
        ...(urgency && { urgency }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        crisisEvent: {
          select: {
            id: true,
            flagLevel: true,
            detectedAt: true,
          },
        },
      },
      orderBy: [
        { urgency: 'desc' },
        { referredAt: 'desc' }
      ],
    });

    return NextResponse.json({ referrals });
  } catch (error) {
    console.error('Error fetching professional referrals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/professional-referrals - Create new referral (admin/therapist only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'THERAPIST'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createReferralSchema.parse(body);

    // If crisisEventId is provided, verify it exists and belongs to a user
    let userId: string;
    if (validatedData.crisisEventId) {
      const crisisEvent = await prisma.crisisEvent.findUnique({
        where: { id: validatedData.crisisEventId },
      });
      if (!crisisEvent) {
        return NextResponse.json({ error: 'Crisis event not found' }, { status: 404 });
      }
      userId = crisisEvent.userId;
    } else {
      // Manual referral - requires userId in body
      if (!body.userId) {
        return NextResponse.json({ error: 'userId required for manual referrals' }, { status: 400 });
      }
      userId = body.userId;
    }

    const referral = await prisma.professionalReferral.create({
      data: {
        ...validatedData,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        crisisEvent: {
          select: {
            id: true,
            flagLevel: true,
            detectedAt: true,
          },
        },
      },
    });

    return NextResponse.json({ referral }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error creating professional referral:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}