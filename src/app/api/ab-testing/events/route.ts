import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ABTestingService } from '@/lib/ab-testing/ab-testing';
import { z } from 'zod';

const trackEventSchema = z.object({
  testId: z.string(),
  eventType: z.string(),
  eventName: z.string(),
  properties: z.record(z.any()).optional(),
});

const abTestingService = new ABTestingService();

// POST /api/ab-testing/events - Track A/B test event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = trackEventSchema.parse(body);

    await abTestingService.trackEvent(
      validatedData.testId,
      session.user.id,
      validatedData.eventType,
      validatedData.eventName,
      validatedData.properties
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error tracking A/B test event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}