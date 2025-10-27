import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const exportDataSchema = z.object({
  userId: z.string(),
  dataTypes: z.array(z.enum(['mood_entries', 'cbt_sessions', 'conversations', 'analytics'])),
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// POST /api/public/v1/export - Export user data
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
    const validatedData = exportDataSchema.parse(body);

    const startDate = validatedData.startDate ? new Date(validatedData.startDate) : undefined;
    const endDate = validatedData.endDate ? new Date(validatedData.endDate) : undefined;

    // Collect all requested data
    const exportData: any = {
      userId: validatedData.userId,
      exportDate: new Date(),
      dataTypes: validatedData.dataTypes,
      dateRange: { startDate, endDate },
    };

    // Export mood entries
    if (validatedData.dataTypes.includes('mood_entries')) {
      exportData.moodEntries = await exportMoodEntries(validatedData.userId, startDate, endDate);
    }

    // Export CBT sessions
    if (validatedData.dataTypes.includes('cbt_sessions')) {
      exportData.cbtSessions = await exportCBTSessions(validatedData.userId, startDate, endDate);
    }

    // Export conversations
    if (validatedData.dataTypes.includes('conversations')) {
      exportData.conversations = await exportConversations(validatedData.userId, startDate, endDate);
    }

    // Export analytics
    if (validatedData.dataTypes.includes('analytics')) {
      exportData.analytics = await exportAnalytics(validatedData.userId, startDate, endDate);
    }

    // Format the data based on requested format
    let formattedData: string;
    let contentType: string;
    let filename: string;

    switch (validatedData.format) {
      case 'csv':
        formattedData = convertToCSV(exportData);
        contentType = 'text/csv';
        filename = `mental-health-data-${validatedData.userId}-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'pdf':
        // In production, use a PDF generation library
        formattedData = JSON.stringify(exportData, null, 2);
        contentType = 'application/pdf';
        filename = `mental-health-data-${validatedData.userId}-${new Date().toISOString().split('T')[0]}.pdf`;
        break;
      default: // json
        formattedData = JSON.stringify(exportData, null, 2);
        contentType = 'application/json';
        filename = `mental-health-data-${validatedData.userId}-${new Date().toISOString().split('T')[0]}.json`;
    }

    // Log the export for audit purposes
    console.log(`Data export completed for user ${validatedData.userId}: ${validatedData.dataTypes.join(', ')}`);

    return new NextResponse(formattedData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Export-Date': new Date().toISOString(),
        'X-Data-Types': validatedData.dataTypes.join(', '),
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions for data export
async function exportMoodEntries(userId: string, startDate?: Date, endDate?: Date) {
  const whereClause: any = { userId };
  if (startDate || endDate) {
    whereClause.timestamp = {};
    if (startDate) whereClause.timestamp.gte = startDate;
    if (endDate) whereClause.timestamp.lte = endDate;
  }

  const entries = await prisma.moodEntry.findMany({
    where: whereClause,
    orderBy: { timestamp: 'asc' },
    select: {
      id: true,
      moodLevel: true,
      notes: true,
      factors: true,
      timestamp: true,
    },
  });

  return entries.map(entry => ({
    ...entry,
    factors: entry.factors ? JSON.parse(entry.factors) : null,
  }));
}

async function exportCBTSessions(userId: string, startDate?: Date, endDate?: Date) {
  const whereClause: any = { userId };
  if (startDate || endDate) {
    whereClause.startedAt = {};
    if (startDate) whereClause.startedAt.gte = startDate;
    if (endDate) whereClause.startedAt.lte = endDate;
  }

  const sessions = await prisma.cBTSession.findMany({
    where: whereClause,
    include: {
      exercise: {
        select: {
          id: true,
          title: true,
          category: true,
          difficulty: true,
        },
      },
    },
    orderBy: { startedAt: 'asc' },
  });

  return sessions.map(session => ({
    id: session.id,
    exercise: session.exercise,
    progress: session.progress ? JSON.parse(session.progress) : null,
    isCompleted: session.isCompleted,
    score: session.score,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
  }));
}

async function exportConversations(userId: string, startDate?: Date, endDate?: Date) {
  const whereClause: any = { userId };
  if (startDate || endDate) {
    whereClause.startAt = {};
    if (startDate) whereClause.startAt.gte = startDate;
    if (endDate) whereClause.startAt.lte = endDate;
  }

  const conversations = await prisma.conversation.findMany({
    where: whereClause,
    include: {
      messages: {
        orderBy: { timestamp: 'asc' },
        select: {
          id: true,
          role: true,
          content: true,
          timestamp: true,
        },
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { startAt: 'asc' },
  });

  return conversations.map(conv => ({
    id: conv.id,
    startTime: conv.startAt,
    endTime: conv.endAt,
    messageCount: conv._count.messages,
    crisisDetected: conv.crisisDetected,
    messages: conv.messages,
  }));
}

async function exportAnalytics(userId: string, startDate?: Date, endDate?: Date) {
  const periodStart = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const periodEnd = endDate || new Date();

  // Mood analytics
  const moodEntries = await prisma.moodEntry.findMany({
    where: {
      userId,
      timestamp: { gte: periodStart, lte: periodEnd },
    },
  });

  const avgMood = moodEntries.length > 0
    ? moodEntries.reduce((sum, entry) => sum + entry.moodLevel, 0) / moodEntries.length
    : 0;

  // CBT analytics
  const cbtSessions = await prisma.cBTSession.findMany({
    where: {
      userId,
      startedAt: { gte: periodStart, lte: periodEnd },
    },
  });

  const completionRate = cbtSessions.length > 0
    ? (cbtSessions.filter(s => s.isCompleted).length / cbtSessions.length) * 100
    : 0;

  // Conversation analytics
  const conversations = await prisma.conversation.findMany({
    where: {
      userId,
      startAt: { gte: periodStart, lte: periodEnd },
    },
    include: {
      _count: { select: { messages: true } },
    },
  });

  const totalMessages = conversations.reduce((sum, conv) => sum + conv._count.messages, 0);

  return {
    period: { start: periodStart, end: periodEnd },
    moodAnalytics: {
      totalEntries: moodEntries.length,
      averageMood: Math.round(avgMood * 10) / 10,
      moodRange: moodEntries.length > 0 ? {
        min: Math.min(...moodEntries.map(e => e.moodLevel)),
        max: Math.max(...moodEntries.map(e => e.moodLevel)),
      } : null,
    },
    cbtAnalytics: {
      totalSessions: cbtSessions.length,
      completedSessions: cbtSessions.filter(s => s.isCompleted).length,
      completionRate: Math.round(completionRate),
      averageScore: cbtSessions.filter(s => s.score).length > 0
        ? Math.round(cbtSessions.filter(s => s.score).reduce((sum, s) => sum + (s.score || 0), 0) / cbtSessions.filter(s => s.score).length)
        : 0,
    },
    conversationAnalytics: {
      totalConversations: conversations.length,
      totalMessages,
      averageMessagesPerConversation: conversations.length > 0
        ? Math.round(totalMessages / conversations.length * 10) / 10
        : 0,
      crisisDetections: conversations.filter(c => c.crisisDetected).length,
    },
  };
}

// Convert data to CSV format
function convertToCSV(data: any): string {
  const rows: string[] = [];

  // Add header
  rows.push('Section,Field,Value');

  // Flatten the data structure
  function flatten(obj: any, prefix = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flatten(value, fullKey);
      } else if (Array.isArray(value)) {
        rows.push(`${prefix},${key},"${JSON.stringify(value).replace(/"/g, '""')}"`);
      } else {
        rows.push(`${prefix},${key},"${value}"`);
      }
    }
  }

  flatten(data);
  return rows.join('\n');
}