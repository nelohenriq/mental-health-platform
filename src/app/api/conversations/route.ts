import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAIProviderManager } from '@/lib/ai/providers';
import { getPersonalizedPrompt, detectCrisisIndicators } from '@/lib/ai/prompts';
import { z } from 'zod';

const startConversationSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'groq']).optional(),
  promptId: z.string().optional(),
  initialMessage: z.string().optional(),
});

const sendMessageSchema = z.object({
  message: z.string().min(1),
  provider: z.enum(['openai', 'anthropic', 'google', 'groq']).optional(),
});

// GET /api/conversations - Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const conversations = await prisma.conversation.findMany({
      where: { userId: session.user.id },
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1, // Get latest message for preview
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { startAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      conversations: conversations.map(conv => ({
        id: conv.id,
        startAt: conv.startAt,
        endAt: conv.endAt,
        crisisDetected: conv.crisisDetected,
        messageCount: conv._count.messages,
        lastMessage: conv.messages[0]?.content.substring(0, 100) + (conv.messages[0]?.content.length > 100 ? '...' : ''),
        lastMessageTime: conv.messages[0]?.timestamp,
      })),
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/conversations - Start new conversation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = startConversationSchema.parse(body);

    const { provider = 'openai', promptId, initialMessage } = validatedData;

    // Verify provider is available
    const aiManager = getAIProviderManager();
    if (!aiManager.isProviderAvailable(provider as any)) {
      return NextResponse.json({ error: `AI provider ${provider} is not available` }, { status: 400 });
    }

    // Get user's recent context for personalization
    const recentMoodEntries = await prisma.moodEntry.findMany({
      where: {
        userId: session.user.id,
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 5,
    });

    const avgMood = recentMoodEntries.length > 0
      ? recentMoodEntries.reduce((sum, entry) => sum + entry.moodLevel, 0) / recentMoodEntries.length
      : 5;

    // Get personalized prompt
    const prompt = promptId
      ? getPersonalizedPrompt({ recentMood: avgMood })
      : getPersonalizedPrompt({ recentMood: avgMood });

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        userId: session.user.id,
        sessionContext: JSON.stringify({
          provider,
          promptId: prompt.id,
          systemMessage: prompt.systemMessage,
          userContext: {
            avgMood,
            moodEntriesCount: recentMoodEntries.length,
          },
        }),
      },
    });

    // If initial message provided, process it
    let aiResponse = null;
    if (initialMessage) {
      // Save user message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'USER',
          content: initialMessage,
        },
      });

      // Check for crisis indicators
      const crisisDetected = detectCrisisIndicators(initialMessage);

      if (crisisDetected) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { crisisDetected: true },
        });

        // Create crisis event
        await (prisma as any).crisisEvent.create({
          data: {
            userId: session.user.id,
            source: 'CONVERSATION',
            flagLevel: 'HIGH',
            escalationStatus: 'PENDING',
          },
        });
      }

      // Generate AI response
      try {
        const messages = [
          { role: 'system' as const, content: prompt.systemMessage },
          { role: 'user' as const, content: initialMessage },
        ];

        const aiManager = getAIProviderManager();
        const response = await aiManager.generateResponse(provider as any, messages);

        // Save AI response
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'ASSISTANT',
            content: response.content,
          },
        });

        aiResponse = {
          content: response.content,
          usage: response.usage,
        };
      } catch (error) {
        console.error('Error generating AI response:', error);
        // Save error message
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'ASSISTANT',
            content: 'I apologize, but I\'m having trouble responding right now. Please try again in a moment.',
          },
        });
      }
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        startAt: conversation.startAt,
        provider,
        prompt: {
          id: prompt.id,
          name: prompt.name,
          category: prompt.category,
        },
      },
      aiResponse,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}