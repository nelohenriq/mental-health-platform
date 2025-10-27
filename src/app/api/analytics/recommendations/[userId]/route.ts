import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SegmentationService } from '@/lib/analytics/segmentation';

const segmentationService = new SegmentationService();

// GET /api/analytics/recommendations/[userId] - Get segment recommendations for user
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'THERAPIST'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recommendations = await segmentationService.getSegmentRecommendations(params.userId);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Error fetching segment recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}