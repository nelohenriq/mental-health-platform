import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCrisisResponse } from '@/lib/ai/crisis';
import { z } from 'zod';

const interventionSchema = z.object({
  crisisLevel: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  triggers: z.array(z.string()),
  context: z.string().optional(),
});

// POST /api/crisis/intervene - Generate intervention response
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = interventionSchema.parse(body);

    const { crisisLevel, triggers, context } = validatedData;

    // Generate appropriate crisis response
    const response = generateCrisisResponse({
      level: crisisLevel,
      triggers,
      context: context || '',
    });

    // Log the intervention
    console.log(`Crisis intervention generated for user ${session.user.id}:`, {
      level: crisisLevel,
      triggers,
      immediateAction: response.immediateAction,
      contactEmergency: response.contactEmergency,
    });

    return NextResponse.json({
      response,
      generatedAt: new Date().toISOString(),
      level: crisisLevel,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error generating crisis intervention:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}