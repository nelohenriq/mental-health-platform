import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAIProviderManager } from '@/lib/ai/providers';
import { detectCrisisIndicators } from '@/lib/ai/prompts';
import { executeCrisisDetectionPipeline } from '@/lib/ai/crisis';
import { z } from 'zod';

const sendMessageSchema = z.object({
  message: z.string().min(1),
  provider: z.enum(['openai', 'anthropic', 'google', 'groq']).optional(),
});

// GET /api/conversations/[id] - Get conversation with messages
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Parse session context
    let sessionContext = {};
    try {
      sessionContext = JSON.parse(conversation.sessionContext || '{}');
    } catch (error) {
      console.error('Error parsing session context:', error);
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        startAt: conversation.startAt,
        endAt: conversation.endAt,
        crisisDetected: conversation.crisisDetected,
        sessionContext,
      },
      messages: conversation.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      })),
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/conversations/[id] - Send message in conversation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    const { message, provider: overrideProvider } = validatedData;

    // Get conversation and verify ownership
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Parse session context
    let sessionContext = { provider: 'openai', systemMessage: '' };
    try {
      sessionContext = JSON.parse(conversation.sessionContext || '{}');
    } catch (error) {
      console.error('Error parsing session context:', error);
    }

    const provider = overrideProvider || sessionContext.provider || 'openai';

    // Verify provider is available
    const aiManager = getAIProviderManager();
    if (!aiManager.isProviderAvailable(provider as any)) {
      return NextResponse.json({ error: `AI provider ${provider} is not available` }, { status: 400 });
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: params.id,
        role: 'USER',
        content: message,
      },
    });

    // Enhanced crisis detection using comprehensive pipeline
    const userMoodEntries = await prisma.moodEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    const recentMoods = userMoodEntries.map(entry => entry.moodLevel);
    const currentMood = recentMoods[0];

    const conversationHistory = conversation.messages.map(msg => msg.content);

    const previousCrisisEvents = await (prisma as any).crisisEvent.count({
      where: {
        userId: session.user.id,
        detectedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    const crisisContext = {
      userId: session.user.id,
      currentMood,
      recentMoods,
      conversationHistory,
      previousCrisisEvents,
      timeOfDay: new Date().toTimeString().split(' ')[0],
    };

    const crisisHistory = {
      previousIncidents: [], // Would need to fetch from crisis events
      patterns: [],
      riskFactors: [],
    };

    // Execute comprehensive crisis detection pipeline
    const crisisAssessment = await executeCrisisDetectionPipeline(
      message,
      crisisContext,
      crisisHistory
    );

    const crisisDetected = crisisAssessment.overallLevel !== 'NONE';

    if (crisisDetected && !conversation.crisisDetected) {
      await prisma.conversation.update({
        where: { id: params.id },
        data: { crisisDetected: true },
      });

      // Create crisis event with enhanced data
      await (prisma as any).crisisEvent.create({
        data: {
          userId: session.user.id,
          source: 'CONVERSATION',
          flagLevel: crisisAssessment.overallLevel,
          escalationStatus: crisisAssessment.requiresImmediateAction ? 'ESCALATED' : 'PENDING',
          notes: JSON.stringify({
            assessment: crisisAssessment,
            message: message,
            confidence: crisisAssessment.confidence,
            riskFactors: crisisAssessment.escalationPath,
          }),
        },
      });
    }

    // Prepare conversation history for AI
    const messages = [
      { role: 'system' as const, content: sessionContext.systemMessage || 'You are a helpful AI assistant.' },
      ...conversation.messages.slice(-19).map(msg => ({ // Keep last 19 messages + new one = 20 total
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ];

    // Generate AI response
    let aiResponse;
    try {
      const response = await aiManager.generateResponse(provider as any, messages);

      // Save AI response
      const savedResponse = await prisma.message.create({
        data: {
          conversationId: params.id,
          role: 'ASSISTANT',
          content: response.content,
        },
      });

      aiResponse = {
        id: savedResponse.id,
        content: response.content,
        usage: response.usage,
        timestamp: savedResponse.timestamp,
      };
    } catch (error) {
      console.error('Error generating AI response:', error);

      // Save error message
      const savedResponse = await prisma.message.create({
        data: {
          conversationId: params.id,
          role: 'ASSISTANT',
          content: 'I apologize, but I\'m having trouble responding right now. Please try again in a moment, or consider speaking with a human professional for immediate support.',
        },
      });

      aiResponse = {
        id: savedResponse.id,
        content: savedResponse.content,
        timestamp: savedResponse.timestamp,
        error: true,
      };
    }

    return NextResponse.json({
      message: aiResponse,
      crisisDetected,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/conversations/[id] - End conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify conversation ownership
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // End conversation
    await prisma.conversation.update({
      where: { id: params.id },
      data: { endAt: new Date() },
    });

    return NextResponse.json({ message: 'Conversation ended successfully' });
  } catch (error) {
    console.error('Error ending conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}