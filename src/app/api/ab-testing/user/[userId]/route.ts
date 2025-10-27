import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ABTestingService } from '@/lib/ab-testing/ab-testing';

const abTestingService = new ABTestingService();

// GET /api/ab-testing/user/[userId] - Get user's active test variants
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Users can only see their own test assignments, admins can see anyone's
    if (session.user.id !== params.userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeTests = await abTestingService.getActiveTestsForUser(params.userId);

    return NextResponse.json({ activeTests });
  } catch (error) {
    console.error('Error fetching user test assignments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}