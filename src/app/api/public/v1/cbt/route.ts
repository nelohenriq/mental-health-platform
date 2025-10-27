import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const getCBTExercisesSchema = z.object({
  category: z.string().optional(),
  difficulty: z.string().optional(),
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional(),
});

const submitCBTSessionSchema = z.object({
  userId: z.string(),
  exerciseId: z.string(),
  progress: z.record(z.any()),
  completed: z.boolean().optional(),
  score: z.number().optional(),
});

// GET /api/public/v1/cbt - Get available CBT exercises
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
    const queryParams = getCBTExercisesSchema.parse({
      category: searchParams.get('category'),
      difficulty: searchParams.get('difficulty'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    const whereClause: any = { isActive: true };
    if (queryParams.category) {
      whereClause.category = queryParams.category;
    }
    if (queryParams.difficulty) {
      whereClause.difficulty = queryParams.difficulty;
    }

    const [exercises, totalCount] = await Promise.all([
      prisma.cBTExercise.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          difficulty: true,
          content: true,
          mediaUrls: true,
          version: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: queryParams.limit || 20,
        skip: queryParams.offset || 0,
      }),
      prisma.cBTExercise.count({ where: whereClause }),
    ]);

    const formattedExercises = exercises.map(exercise => ({
      id: exercise.id,
      title: exercise.title,
      description: exercise.description,
      category: exercise.category,
      difficulty: exercise.difficulty,
      content: exercise.content ? JSON.parse(exercise.content) : null,
      mediaUrls: exercise.mediaUrls ? JSON.parse(exercise.mediaUrls) : null,
      version: exercise.version,
      createdAt: exercise.createdAt,
      updatedAt: exercise.updatedAt,
    }));

    return NextResponse.json({
      exercises: formattedExercises,
      pagination: {
        total: totalCount,
        limit: queryParams.limit || 20,
        offset: queryParams.offset || 0,
        hasMore: (queryParams.offset || 0) + (queryParams.limit || 20) < totalCount,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error fetching CBT exercises:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/public/v1/cbt - Submit CBT session progress
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
    const validatedData = submitCBTSessionSchema.parse(body);

    // Check if exercise exists and is active
    const exercise = await prisma.cBTExercise.findUnique({
      where: { id: validatedData.exerciseId },
    });

    if (!exercise || !exercise.isActive) {
      return NextResponse.json(
        { error: 'Exercise not found or not available' },
        { status: 404 }
      );
    }

    // Create or update CBT session
    const session = await prisma.cBTSession.upsert({
      where: {
        userId_exerciseId: {
          userId: validatedData.userId,
          exerciseId: validatedData.exerciseId,
        },
      },
      update: {
        progress: JSON.stringify(validatedData.progress),
        isCompleted: validatedData.completed || false,
        completedAt: validatedData.completed ? new Date() : null,
        score: validatedData.score,
      },
      create: {
        userId: validatedData.userId,
        exerciseId: validatedData.exerciseId,
        progress: JSON.stringify(validatedData.progress),
        isCompleted: validatedData.completed || false,
        completedAt: validatedData.completed ? new Date() : null,
        score: validatedData.score,
      },
    });

    // Generate personalized recommendations based on progress
    const recommendations = await generateCBTRecommendations(
      validatedData.userId,
      validatedData.exerciseId,
      validatedData.progress
    );

    return NextResponse.json({
      sessionId: session.id,
      progress: JSON.parse(session.progress),
      completed: session.isCompleted,
      score: session.score,
      recommendations,
      timestamp: new Date(),
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error submitting CBT session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate CBT recommendations
async function generateCBTRecommendations(
  userId: string,
  exerciseId: string,
  progress: any
): Promise<string[]> {
  const recommendations = [];

  // Get user's CBT history
  const userSessions = await prisma.cBTSession.findMany({
    where: { userId },
    include: { exercise: true },
    orderBy: { startedAt: 'desc' },
    take: 10,
  });

  // Analyze progress patterns
  const completedSessions = userSessions.filter(s => s.isCompleted);
  const avgScore = completedSessions.length > 0
    ? completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length
    : 0;

  // Generate recommendations based on patterns
  if (completedSessions.length === 0) {
    recommendations.push('Great start! Continue practicing CBT exercises regularly for best results.');
  } else if (avgScore < 60) {
    recommendations.push('Consider reviewing the core concepts before moving to advanced exercises.');
    recommendations.push('Try breaking down exercises into smaller, manageable steps.');
  } else if (avgScore > 80) {
    recommendations.push('Excellent progress! You might be ready for more challenging exercises.');
  }

  // Category-specific recommendations
  const currentExercise = await prisma.cBTExercise.findUnique({
    where: { id: exerciseId },
  });

  if (currentExercise?.category === 'THOUGHT_CHALLENGING') {
    recommendations.push('Remember to practice thought challenging daily, not just during exercises.');
  } else if (currentExercise?.category === 'BEHAVIOR_ACTIVATION') {
    recommendations.push('Try to incorporate one behavioral activation technique into your daily routine.');
  } else if (currentExercise?.category === 'MINDFULNESS') {
    recommendations.push('Consider setting aside 5-10 minutes daily for mindfulness practice.');
  }

  return recommendations;
}