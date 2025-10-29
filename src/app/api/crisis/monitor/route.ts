import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const monitoringSchema = z.object({
  userId: z.string().optional(), // Admin can monitor any user
  timeRange: z.enum(['1h', '6h', '24h', '7d', '30d']).default('24h'),
  includeResolved: z.boolean().default(false),
});

// GET /api/crisis/monitor - Monitor crisis events and patterns
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') as '1h' | '6h' | '24h' | '7d' | '30d' || '24h';
    const includeResolved = searchParams.get('includeResolved') === 'true';

    // Calculate time range
    const now = new Date();
    const timeRanges = {
      '1h': 1 * 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    const since = new Date(now.getTime() - timeRanges[timeRange]);

    // Build where clause based on user role
    const whereClause: any = {
      detectedAt: { gte: since },
    };

    if (session.user.role !== 'ADMIN') {
      whereClause.userId = session.user.id;
    } else {
      // Admin can filter by specific user
      const userId = searchParams.get('userId');
      if (userId) {
        whereClause.userId = userId;
      }
    }

    if (!includeResolved) {
      whereClause.escalationStatus = { not: 'RESOLVED' };
    }

    // Get crisis events
    const crisisEvents = await (prisma as any).crisisEvent.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { detectedAt: 'desc' },
    });

    // Calculate statistics
    const stats = {
      total: crisisEvents.length,
      byLevel: {
        CRITICAL: crisisEvents.filter((e: any) => e.flagLevel === 'CRITICAL').length,
        HIGH: crisisEvents.filter((e: any) => e.flagLevel === 'HIGH').length,
        MEDIUM: crisisEvents.filter((e: any) => e.flagLevel === 'MEDIUM').length,
        LOW: crisisEvents.filter((e: any) => e.flagLevel === 'LOW').length,
      },
      byStatus: {
        PENDING: crisisEvents.filter((e: any) => e.escalationStatus === 'PENDING').length,
        ESCALATED: crisisEvents.filter((e: any) => e.escalationStatus === 'ESCALATED').length,
        RESOLVED: crisisEvents.filter((e: any) => e.escalationStatus === 'RESOLVED').length,
        DISMISSED: crisisEvents.filter((e: any) => e.escalationStatus === 'DISMISSED').length,
      },
      recentTrend: calculateTrend(crisisEvents),
      activeCrises: crisisEvents.filter((e: any) =>
        ['PENDING', 'ESCALATED'].includes(e.escalationStatus)
      ).length,
    };

    return NextResponse.json({
      events: crisisEvents.map((event: any) => ({
        id: event.id,
        user: event.user,
        source: event.source,
        flagLevel: event.flagLevel,
        escalationStatus: event.escalationStatus,
        detectedAt: event.detectedAt,
        notes: event.notes ? JSON.parse(event.notes) : null,
      })),
      stats,
      timeRange,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error monitoring crisis events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateTrend(events: any[]): 'increasing' | 'decreasing' | 'stable' {
  if (events.length < 2) return 'stable';

  // Group by hour for trend analysis
  const hourlyCounts: { [key: string]: number } = {};
  events.forEach(event => {
    const hour = new Date(event.detectedAt).getHours();
    hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
  });

  const hours = Object.keys(hourlyCounts).sort();
  if (hours.length < 2) return 'stable';

  const recent = hours.slice(-3); // Last 3 hours
  const earlier = hours.slice(-6, -3); // Previous 3 hours

  const recentAvg = recent.reduce((sum, hour) => sum + hourlyCounts[hour], 0) / recent.length;
  const earlierAvg = earlier.length > 0 ?
    earlier.reduce((sum, hour) => sum + hourlyCounts[hour], 0) / earlier.length : 0;

  if (recentAvg > earlierAvg * 1.2) return 'increasing';
  if (recentAvg < earlierAvg * 0.8) return 'decreasing';
  return 'stable';
}