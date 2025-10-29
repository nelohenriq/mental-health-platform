import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { executeCrisisDetectionPipeline } from '@/lib/ai/crisis';
import { z } from 'zod';

const crisisDetectionSchema = z.object({
  text: z.string().min(1),
  context: z.object({
    currentMood: z.number().optional(),
    recentMoods: z.array(z.number()).optional(),
    conversationHistory: z.array(z.string()).optional(),
    timeOfDay: z.string().optional(),
    location: z.string().optional(),
  }).optional(),
});

// POST /api/crisis/detect - Advanced crisis detection endpoint
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = crisisDetectionSchema.parse(body);

    const { text, context: providedContext } = validatedData;

    // Gather comprehensive context from database
    const userMoodEntries = await prisma.moodEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { timestamp: 'desc' },
      take: 14, // Last 2 weeks of mood data
    });

    const recentMoods = userMoodEntries.map(entry => entry.moodLevel);
    const currentMood = recentMoods[0] || providedContext?.currentMood;

    // Get recent conversation history
    const recentConversations = await prisma.conversation.findMany({
      where: { userId: session.user.id },
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
      orderBy: { startAt: 'desc' },
      take: 5,
    });

    const conversationHistory = recentConversations.flatMap(conv =>
      conv.messages.map(msg => msg.content)
    );

    // Get crisis history
    const previousCrisisEvents = await (prisma as any).crisisEvent.findMany({
      where: {
        userId: session.user.id,
        detectedAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      },
      orderBy: { detectedAt: 'desc' },
    });

    const crisisContext = {
      userId: session.user.id,
      currentMood,
      recentMoods: providedContext?.recentMoods || recentMoods,
      conversationHistory: providedContext?.conversationHistory || conversationHistory,
      previousCrisisEvents: previousCrisisEvents.length,
      timeOfDay: providedContext?.timeOfDay || new Date().toTimeString().split(' ')[0],
      location: providedContext?.location,
    };

    const crisisHistory = {
      previousIncidents: previousCrisisEvents.map((event: any) => ({
        timestamp: event.detectedAt,
        level: event.flagLevel,
        resolution: event.escalationStatus,
      })),
      patterns: [], // Could be enhanced with pattern analysis
      riskFactors: [], // Could be enhanced with risk factor analysis
    };

    // Execute comprehensive crisis detection pipeline
    const assessment = await executeCrisisDetectionPipeline(
      text,
      crisisContext,
      crisisHistory
    );

    // Log the detection for monitoring
    console.log(`Crisis detection for user ${session.user.id}:`, {
      level: assessment.overallLevel,
      confidence: assessment.confidence,
      requiresAction: assessment.requiresImmediateAction,
    });

    // If high-risk crisis detected, create an event
    if (['CRITICAL', 'HIGH'].includes(assessment.overallLevel)) {
      await (prisma as any).crisisEvent.create({
        data: {
          userId: session.user.id,
          source: 'API_DETECTION',
          flagLevel: assessment.overallLevel,
          escalationStatus: assessment.requiresImmediateAction ? 'ESCALATED' : 'PENDING',
          notes: JSON.stringify({
            assessment,
            text: text.substring(0, 500), // Truncate for storage
            context: crisisContext,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    }

    return NextResponse.json({
      assessment,
      context: {
        moodData: recentMoods.length,
        conversationHistory: conversationHistory.length,
        previousCrises: previousCrisisEvents.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error in crisis detection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}