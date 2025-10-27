import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createInterventionProtocolSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  steps: z.string(), // JSON array of steps
  resources: z.string().optional(), // JSON array of resources
});

// GET /api/intervention-protocols - Get intervention protocols (admin/therapist only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'THERAPIST'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const isActive = searchParams.get('isActive') !== 'false';

    const protocols = await prisma.interventionProtocol.findMany({
      where: {
        ...(severity && { severity }),
        isActive,
      },
      orderBy: { severity: 'desc' },
    });

    return NextResponse.json({
      protocols: protocols.map(protocol => ({
        ...protocol,
        steps: JSON.parse(protocol.steps),
        resources: protocol.resources ? JSON.parse(protocol.resources) : [],
      }))
    });
  } catch (error) {
    console.error('Error fetching intervention protocols:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/intervention-protocols - Create new intervention protocol (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createInterventionProtocolSchema.parse(body);

    // Validate JSON structure
    try {
      JSON.parse(validatedData.steps);
      if (validatedData.resources) {
        JSON.parse(validatedData.resources);
      }
    } catch (jsonError) {
      return NextResponse.json({ error: 'Invalid JSON format in steps or resources' }, { status: 400 });
    }

    const protocol = await prisma.interventionProtocol.create({
      data: validatedData,
    });

    return NextResponse.json({
      protocol: {
        ...protocol,
        steps: JSON.parse(protocol.steps),
        resources: protocol.resources ? JSON.parse(protocol.resources) : [],
      }
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error creating intervention protocol:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}