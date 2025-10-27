import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/conversations/[id]/export - Export conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // Get conversation with messages
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
    let sessionContext: any = {};
    try {
      sessionContext = JSON.parse(conversation.sessionContext || '{}');
    } catch (error) {
      console.error('Error parsing session context:', error);
    }

    const exportData = {
      conversationId: conversation.id,
      exportDate: new Date().toISOString(),
      startDate: conversation.startAt,
      endDate: conversation.endAt,
      crisisDetected: conversation.crisisDetected,
      provider: sessionContext.provider || 'unknown',
      prompt: sessionContext.promptId || 'unknown',
      messageCount: conversation.messages.length,
      messages: conversation.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      })),
      summary: {
        duration: conversation.endAt
          ? Math.round((conversation.endAt.getTime() - conversation.startAt.getTime()) / (1000 * 60)) // minutes
          : null,
        userMessages: conversation.messages.filter(m => m.role === 'USER').length,
        assistantMessages: conversation.messages.filter(m => m.role === 'ASSISTANT').length,
        avgMessageLength: Math.round(
          conversation.messages.reduce((sum, m) => sum + m.content.length, 0) / conversation.messages.length
        ),
      },
    };

    if (format === 'txt') {
      // Generate readable text format
      let textContent = `Mental Health Conversation Export\n`;
      textContent += `================================\n\n`;
      textContent += `Conversation ID: ${conversation.id}\n`;
      textContent += `Started: ${conversation.startAt.toLocaleString()}\n`;
      textContent += `Ended: ${conversation.endAt?.toLocaleString() || 'Ongoing'}\n`;
      textContent += `Provider: ${sessionContext.provider || 'Unknown'}\n`;
      textContent += `Crisis Detected: ${conversation.crisisDetected ? 'Yes' : 'No'}\n`;
      textContent += `Total Messages: ${conversation.messages.length}\n\n`;

      textContent += `Conversation:\n`;
      textContent += `-------------\n\n`;

      conversation.messages.forEach((msg, index) => {
        const role = msg.role === 'USER' ? 'You' : 'Assistant';
        const time = msg.timestamp.toLocaleTimeString();
        textContent += `[${time}] ${role}:\n${msg.content}\n\n`;
      });

      textContent += `\nSummary:\n`;
      textContent += `--------\n`;
      textContent += `Duration: ${exportData.summary.duration ? `${exportData.summary.duration} minutes` : 'Ongoing'}\n`;
      textContent += `Your messages: ${exportData.summary.userMessages}\n`;
      textContent += `Assistant messages: ${exportData.summary.assistantMessages}\n`;
      textContent += `Average message length: ${exportData.summary.avgMessageLength} characters\n`;

      return new NextResponse(textContent, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="conversation-${conversation.id}.txt"`,
        },
      });
    }

    // Default JSON response
    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="conversation-${conversation.id}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}