import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ABTestingService } from '@/lib/ab-testing/ab-testing';
import { prisma } from '@/lib/prisma';

const abTestingService = new ABTestingService();

// GET /api/ab-testing/tests/[id] - Get test details and results
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'THERAPIST'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await abTestingService.getTestResults(params.id);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error fetching A/B test results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/ab-testing/tests/[id] - Update test (start/end)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'start') {
      await abTestingService.startTest(params.id);
      return NextResponse.json({ message: 'Test started successfully' });
    } else if (action === 'end') {
      const results = await abTestingService.endTest(params.id);
      return NextResponse.json({ message: 'Test ended successfully', results });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating A/B test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/ab-testing/tests/[id] - Delete test
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if test is active
    const test = await prisma.aBTest.findUnique({
      where: { id: params.id },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    if (test.status === 'ACTIVE') {
      return NextResponse.json({ error: 'Cannot delete active test' }, { status: 409 });
    }

    await prisma.aBTest.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Error deleting A/B test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}