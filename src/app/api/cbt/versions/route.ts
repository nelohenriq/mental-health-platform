import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/cbt/versions - Get version history for exercises
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get('exerciseId');

    if (!exerciseId) {
      return NextResponse.json({ error: 'exerciseId parameter required' }, { status: 400 });
    }

    const versions = await (prisma as any).cBTExerciseVersion.findMany({
      where: { exerciseId },
      orderBy: { version: 'desc' },
      include: {
        exercise: {
          select: {
            title: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error('Error fetching CBT exercise versions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}