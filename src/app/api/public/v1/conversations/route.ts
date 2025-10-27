import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createConversationSchema = z.object({
  userId: z.string(),
  message: z.string().min(1),
  context: z.record(z.any()).optional(),
});

const getConversationsSchema = z.object({
  userId: z.string(),
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional(),
});

// POST /api/public/v1/conversations - Create conversation and get AI response
export async function POST(request: NextRequest) {
  try {
    // API key authentication
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.PUBLIC_API_KEY) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createConversationSchema.parse(body);

    // Create or get existing conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        userId: validatedData.userId,
        endAt: null, // Active conversation
      },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
          take: 50, // Last 50 messages for context
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: validatedData.userId,
          sessionContext: validatedData.context ? JSON.stringify(validatedData.context) : null,
        },
        include: { messages: true },
      });
    }

    // Add user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: validatedData.message,
      },
    });

    // Generate AI response (simplified - in production, use actual AI service)
    const aiResponse = await generateTherapeuticResponse(validatedData.message, conversation.messages);

    // Add AI response
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: aiResponse,
      },
    });

    // Check for crisis indicators
    const crisisDetected = detectCrisisIndicators(validatedData.message);
    if (crisisDetected) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { crisisDetected: true },
      });

      // Trigger crisis response
      await handleCrisisDetection(conversation.id, validatedData.userId);
    }

    return NextResponse.json({
      conversationId: conversation.id,
      message: aiResponse,
      crisisDetected,
      timestamp: new Date(),
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/public/v1/conversations - Get conversation history
export async function GET(request: NextRequest) {
  try {
    // API key authentication
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.PUBLIC_API_KEY) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const queryParams = getConversationsSchema.parse({
      userId,
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    const conversations = await prisma.conversation.findMany({
      where: { userId: queryParams.userId },
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 10, // Last 10 messages per conversation
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { startAt: 'desc' },
      take: queryParams.limit || 20,
      skip: queryParams.offset || 0,
    });

    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      startTime: conv.startAt,
      endTime: conv.endAt,
      messageCount: conv._count.messages,
      crisisDetected: conv.crisisDetected,
      lastMessages: conv.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      })),
    }));

    return NextResponse.json({
      conversations: formattedConversations,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
async function generateTherapeuticResponse(message: string, context: any[]): Promise<string> {
  // Simplified AI response generation - in production, use actual AI service
  const responses = [
    "I understand you're going through a difficult time. Can you tell me more about what's been bothering you?",
    "It's completely normal to feel this way. What coping strategies have you tried in the past?",
    "Thank you for sharing that with me. How long have you been feeling this way?",
    "That sounds challenging. What would be most helpful for you right now?",
    "I hear that you're feeling overwhelmed. Let's break this down into smaller, manageable steps.",
  ];

  // Simple keyword-based response selection
  if (message.toLowerCase().includes('anxious') || message.toLowerCase().includes('anxiety')) {
    return "Anxiety can be very uncomfortable. Let's try a simple breathing exercise: inhale for 4 counts, hold for 4, exhale for 4. How does that feel?";
  }

  if (message.toLowerCase().includes('sad') || message.toLowerCase().includes('depressed')) {
    return "I'm sorry you're feeling sad. Sometimes it helps to acknowledge these feelings without judgment. What activities usually bring you comfort?";
  }

  if (message.toLowerCase().includes('angry') || message.toLowerCase().includes('frustrated')) {
    return "Anger is a valid emotion. It might be helpful to identify what triggered these feelings and explore healthier ways to express them.";

  }

  return responses[Math.floor(Math.random() * responses.length)];
}

function detectCrisisIndicators(message: string): boolean {
  const crisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'not worth living',
    'harm myself', 'hurt myself', 'self-harm', 'cutting',
    'overdose', 'die', 'death', 'dead'
  ];

  const lowerMessage = message.toLowerCase();
  return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
}

async function handleCrisisDetection(conversationId: string, userId: string): Promise<void> {
  // Create crisis event
  await prisma.crisisEvent.create({
    data: {
      userId,
      source: 'CONVERSATION',
      flagLevel: 'HIGH',
      escalationStatus: 'PENDING',
    },
  });

  // In production, this would trigger notifications to crisis counselors
  console.warn(`Crisis detected for user ${userId} in conversation ${conversationId}`);
}