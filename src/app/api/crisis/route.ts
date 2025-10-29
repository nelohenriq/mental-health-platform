import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

interface CrisisEventWithUser {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  source: string;
  detectedAt: Date;
  flagLevel: string;
  escalationStatus: string;
  notes: string | null;
}

const updateCrisisEventSchema = z.object({
  status: z.enum(['PENDING', 'ESCALATED', 'RESOLVED', 'DISMISSED']),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
});

// GET /api/crisis - Get crisis events (admin/therapist only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'THERAPIST'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50');

    const crisisEvents = await (prisma as any).crisisEvent.findMany({
      where: {
        ...(status && { escalationStatus: status }),
        ...(severity && { flagLevel: severity }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { detectedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      crisisEvents: crisisEvents.map((event: CrisisEventWithUser) => ({
        id: event.id,
        user: event.user,
        source: event.source,
        detectedAt: event.detectedAt,
        flagLevel: event.flagLevel,
        escalationStatus: event.escalationStatus,
        notes: event.notes ? JSON.parse(event.notes) : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching crisis events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/crisis - Create manual crisis report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reason, description, severity = 'MEDIUM' } = body;

    const crisisEvent = await (prisma as any).crisisEvent.create({
      data: {
        userId: session.user.id,
        source: 'MANUAL_REPORT',
        detectedAt: new Date(),
        flagLevel: severity,
        escalationStatus: 'PENDING',
        notes: JSON.stringify({
          reason,
          description,
          reportedBy: 'user',
        }),
      },
    });

    return NextResponse.json({
      message: 'Crisis report submitted successfully',
      eventId: crisisEvent.id,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating crisis report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/crisis/[id] - Update crisis event status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'THERAPIST'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateCrisisEventSchema.parse(body);

    const resolvedParams = await params;
    const existingEvent = await (prisma as any).crisisEvent.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Crisis event not found' }, { status: 404 });
    }

    // Update event
    const updatedEvent = await (prisma as any).crisisEvent.update({
      where: { id: resolvedParams.id },
      data: {
        escalationStatus: validatedData.status,
        ...(validatedData.notes && {
          notes: JSON.stringify({
            ...(existingEvent.notes ? JSON.parse(existingEvent.notes) : {}),
            ...validatedData,
            updatedBy: session.user.id,
            updatedAt: new Date().toISOString(),
          }),
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Implement escalation actions based on status change
    if (validatedData.status === 'ESCALATED') {
      // Send notifications to crisis team
      console.log(`Crisis event ${resolvedParams.id} escalated. Notifying crisis team.`);
      // TODO: Implement actual notification system (email, SMS, etc.)

      // Update user crisis flag if critical
      if (updatedEvent.flagLevel === 'CRITICAL') {
        await prisma.user.update({
          where: { id: updatedEvent.userId },
          data: { crisisFlag: true }
        });
      }
    } else if (validatedData.status === 'RESOLVED') {
      // Clear user crisis flag
      await prisma.user.update({
        where: { id: updatedEvent.userId },
        data: { crisisFlag: false }
      });

      console.log(`Crisis event ${resolvedParams.id} resolved. User crisis flag cleared.`);
    }

    // Log intervention actions
    console.log(`Crisis event ${resolvedParams.id} updated by ${session.user.id}: ${validatedData.status}`);

    return NextResponse.json({
      event: {
        id: updatedEvent.id,
        user: updatedEvent.user,
        escalationStatus: updatedEvent.escalationStatus,
        notes: updatedEvent.notes ? JSON.parse(updatedEvent.notes) : null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error updating crisis event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}