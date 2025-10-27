import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createMoodEntrySchema = z.object({
  moodLevel: z.number().min(1).max(10),
  notes: z.string().optional(),
  factors: z.array(z.string()).optional(),
  timestamp: z.string().datetime().optional(),
});

const getMoodEntriesSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional(),
});

// POST /api/public/v1/mood - Create mood entry
export async function POST(request: NextRequest) {
  try {
    // API key authentication for external integrations
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401 }
      );
    }

    // Validate API key (simplified - in production, check against database)
    if (apiKey !== process.env.PUBLIC_API_KEY) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createMoodEntrySchema.parse(body);

    // Extract user ID from request (could be from API key mapping or request body)
    const userId = body.userId || request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const moodEntry = await prisma.moodEntry.create({
      data: {
        userId,
        moodLevel: validatedData.moodLevel,
        notes: validatedData.notes,
        factors: validatedData.factors ? JSON.stringify(validatedData.factors) : null,
        timestamp: validatedData.timestamp ? new Date(validatedData.timestamp) : new Date(),
      },
    });

    return NextResponse.json({
      id: moodEntry.id,
      moodLevel: moodEntry.moodLevel,
      notes: moodEntry.notes,
      factors: moodEntry.factors ? JSON.parse(moodEntry.factors) : null,
      timestamp: moodEntry.timestamp,
      createdAt: moodEntry.timestamp,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating mood entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/public/v1/mood - Get mood entries
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

    const userId = request.headers.get('x-user-id') || request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = getMoodEntriesSchema.parse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    const whereClause: any = { userId };
    if (queryParams.startDate || queryParams.endDate) {
      whereClause.timestamp = {};
      if (queryParams.startDate) {
        whereClause.timestamp.gte = new Date(queryParams.startDate);
      }
      if (queryParams.endDate) {
        whereClause.timestamp.lte = new Date(queryParams.endDate);
      }
    }

    const [entries, totalCount] = await Promise.all([
      prisma.moodEntry.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: queryParams.limit || 50,
        skip: queryParams.offset || 0,
      }),
      prisma.moodEntry.count({ where: whereClause }),
    ]);

    const formattedEntries = entries.map(entry => ({
      id: entry.id,
      moodLevel: entry.moodLevel,
      notes: entry.notes,
      factors: entry.factors ? JSON.parse(entry.factors) : null,
      timestamp: entry.timestamp,
    }));

    return NextResponse.json({
      entries: formattedEntries,
      pagination: {
        total: totalCount,
        limit: queryParams.limit || 50,
        offset: queryParams.offset || 0,
        hasMore: (queryParams.offset || 0) + (queryParams.limit || 50) < totalCount,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error fetching mood entries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}