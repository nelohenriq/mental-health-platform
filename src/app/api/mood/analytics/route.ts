import { NextRequest, NextResponse } from "next/server"
// @ts-ignore
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cache } from "@/lib/redis"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, 1y
    const userId = session.user.id
    const cacheKey = `analytics:${userId}:${period}`

    // Try to get cached analytics first
    try {
      const cachedData = await cache.getMoodAnalytics(userId, period)
      if (cachedData) {
        return NextResponse.json({ analytics: cachedData })
      }
    } catch (cacheError) {
      // Continue without cache if Redis is unavailable
      console.warn("Cache unavailable, proceeding without caching:", cacheError)
    }

    const endDate = new Date()
    const startDate = new Date()

    // Calculate start date based on period
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    // Get mood entries for the period
    const entries = await prisma.moodEntry.findMany({
      where: {
        userId: session.user.id,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { timestamp: 'asc' },
      select: {
        moodLevel: true,
        timestamp: true,
        factors: true
      }
    })

    // Calculate analytics
    const analytics = calculateMoodAnalytics(entries, period)

    // Cache the results (30 minutes TTL)
    try {
      await cache.setMoodAnalytics(userId, period, analytics, 1800)
    } catch (cacheError) {
      // Continue without caching if Redis fails
      console.warn("Failed to cache analytics:", cacheError)
    }

    return NextResponse.json({ analytics })

  } catch (error) {
    console.error("Mood analytics error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function calculateMoodAnalytics(entries: any[], period: string) {
  if (entries.length === 0) {
    return {
      period,
      totalEntries: 0,
      averageMood: 0,
      moodDistribution: {},
      trends: {
        direction: 'stable',
        changePercent: 0
      },
      insights: [],
      chartData: []
    }
  }

  // Basic statistics
  const moodLevels = entries.map(e => e.moodLevel)
  const averageMood = moodLevels.reduce((a, b) => a + b, 0) / moodLevels.length

  // Mood distribution
  const moodDistribution = moodLevels.reduce((acc, mood) => {
    acc[mood] = (acc[mood] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  // Trend analysis
  const firstHalf = moodLevels.slice(0, Math.floor(moodLevels.length / 2))
  const secondHalf = moodLevels.slice(Math.floor(moodLevels.length / 2))

  const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

  const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
  let direction = 'stable'
  if (changePercent > 5) direction = 'improving'
  else if (changePercent < -5) direction = 'declining'

  // Factor analysis
  const factorCounts = entries.reduce((acc, entry) => {
    entry.factors.forEach((factor: string) => {
      acc[factor] = (acc[factor] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  const topFactors = Object.entries(factorCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([factor, count]) => ({ factor, count }))

  // Generate insights
  const insights = generateInsights(averageMood, direction, changePercent, topFactors)

  // Chart data (daily averages)
  const chartData = generateChartData(entries, period)

  return {
    period,
    totalEntries: entries.length,
    averageMood: Math.round(averageMood * 10) / 10,
    moodDistribution,
    trends: {
      direction,
      changePercent: Math.round(changePercent * 10) / 10
    },
    topFactors,
    insights,
    chartData
  }
}

function generateInsights(averageMood: number, direction: string, changePercent: number, topFactors: any[]) {
  const insights = []

  // Mood level insight
  if (averageMood >= 8) {
    insights.push("Your average mood has been quite positive. Keep up the good work!")
  } else if (averageMood >= 6) {
    insights.push("Your mood has been generally stable. Consider what factors contribute to your well-being.")
  } else if (averageMood >= 4) {
    insights.push("Your mood levels suggest some challenges. Consider exploring coping strategies.")
  } else {
    insights.push("Your mood levels indicate significant difficulties. Consider reaching out for professional support.")
  }

  // Trend insight
  if (direction === 'improving') {
    insights.push(`Your mood has improved by ${Math.abs(changePercent)}% over this period.`)
  } else if (direction === 'declining') {
    insights.push(`Your mood has declined by ${Math.abs(changePercent)}% over this period. Consider what might be contributing to this change.`)
  }

  // Factor insights
  if (topFactors.length > 0) {
    const topFactor = topFactors[0]
    insights.push(`"${topFactor.factor}" has been your most frequently reported mood factor.`)
  }

  return insights
}

function generateChartData(entries: any[], period: string) {
  // Group by day/week depending on period
  const grouped = entries.reduce((acc, entry) => {
    const date = new Date(entry.timestamp)
    let key: string

    if (period === '7d' || period === '30d') {
      // Daily grouping
      key = date.toISOString().split('T')[0]
    } else {
      // Weekly grouping for longer periods
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      key = weekStart.toISOString().split('T')[0]
    }

    if (!acc[key]) {
      acc[key] = { sum: 0, count: 0, date: key }
    }
    acc[key].sum += entry.moodLevel
    acc[key].count += 1

    return acc
  }, {} as Record<string, { sum: number, count: number, date: string }>)

  return Object.values(grouped)
    .map((group: any) => ({
      date: group.date,
      averageMood: Math.round((group.sum / group.count) * 10) / 10,
      entries: group.count
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}