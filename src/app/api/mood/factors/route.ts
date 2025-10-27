import { NextRequest, NextResponse } from "next/server"
// @ts-ignore
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Predefined mood factor categories for consistency
const MOOD_FACTOR_CATEGORIES = {
  POSITIVE: [
    'exercise', 'social_time', 'good_sleep', 'healthy_meal', 'achievement',
    'relaxation', 'hobby', 'nature', 'music', 'meditation', 'gratitude'
  ],
  NEGATIVE: [
    'stress', 'work_pressure', 'conflict', 'fatigue', 'illness', 'weather',
    'financial_worry', 'loneliness', 'anxiety', 'depression', 'anger'
  ],
  NEUTRAL: [
    'routine', 'commute', 'meeting', 'housework', 'shopping', 'waiting',
    'travel', 'learning', 'planning', 'organizing', 'reflection'
  ]
}

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
    const category = searchParams.get('category') // positive, negative, neutral, or all
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    // Get user's recent mood factors for suggestions
    const recentEntries = await prisma.moodEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { timestamp: 'desc' },
      take: 100, // Analyze last 100 entries
      select: { factors: true }
    })

    // Count factor frequency
    const factorCounts = recentEntries.reduce((acc, entry) => {
      if (entry.factors && Array.isArray(entry.factors)) {
        entry.factors.forEach((factor: string) => {
          acc[factor] = (acc[factor] || 0) + 1
        })
      }
      return acc
    }, {} as Record<string, number>)

    // Categorize factors
    const categorizedFactors = Object.entries(factorCounts).map(([factor, count]) => {
      let category = 'custom'
      let type = 'neutral'

      // Check predefined categories
      for (const [catType, factors] of Object.entries(MOOD_FACTOR_CATEGORIES)) {
        if (factors.includes(factor)) {
          category = catType.toLowerCase()
          type = catType.toLowerCase()
          break
        }
      }

      return {
        factor,
        count,
        category,
        type,
        isPredefined: category !== 'custom'
      }
    })

    // Filter by category if specified
    let filteredFactors = categorizedFactors
    if (category && category !== 'all') {
      filteredFactors = categorizedFactors.filter(f => f.category === category)
    }

    // Sort by frequency and return top factors
    const topFactors = filteredFactors
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    // Get category suggestions
    const suggestions = getCategorySuggestions(category)

    return NextResponse.json({
      factors: topFactors,
      categories: MOOD_FACTOR_CATEGORIES,
      suggestions,
      total: topFactors.length
    })

  } catch (error) {
    console.error("Get mood factors error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { factors } = await request.json()

    if (!Array.isArray(factors)) {
      return NextResponse.json(
        { error: "Factors must be an array" },
        { status: 400 }
      )
    }

    // Validate and categorize factors
    const validatedFactors = factors.map((factor: string) => {
      if (typeof factor !== 'string' || factor.trim().length === 0) {
        throw new Error("All factors must be non-empty strings")
      }

      let category = 'custom'
      let type = 'neutral'

      // Check predefined categories
      for (const [catType, catFactors] of Object.entries(MOOD_FACTOR_CATEGORIES)) {
        if (catFactors.includes(factor.trim())) {
          category = catType.toLowerCase()
          type = catType.toLowerCase()
          break
        }
      }

      return {
        factor: factor.trim(),
        category,
        type,
        isPredefined: category !== 'custom'
      }
    })

    return NextResponse.json({
      factors: validatedFactors,
      message: "Factors validated and categorized successfully"
    })

  } catch (error) {
    console.error("Validate mood factors error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

function getCategorySuggestions(category?: string | null) {
  const suggestions = {
    positive: [
      "Spent time with loved ones",
      "Completed a personal goal",
      "Enjoyed a healthy meal",
      "Got good sleep last night",
      "Practiced mindfulness or meditation",
      "Went for a walk in nature",
      "Listened to favorite music",
      "Received good news",
      "Helped someone else",
      "Learned something new"
    ],
    negative: [
      "Work or school stress",
      "Conflict with someone",
      "Feeling physically unwell",
      "Lack of sleep",
      "Financial concerns",
      "Weather affecting mood",
      "Feeling overwhelmed",
      "Missing someone",
      "Recent disappointment",
      "Too much screen time"
    ],
    neutral: [
      "Daily routine activities",
      "Commuting or travel",
      "Household chores",
      "Attending meetings",
      "Running errands",
      "Waiting or downtime",
      "Learning or studying",
      "Planning and organizing",
      "Social obligations",
      "Rest or relaxation time"
    ]
  }

  if (category && category !== 'all' && suggestions[category as keyof typeof suggestions]) {
    return suggestions[category as keyof typeof suggestions]
  }

  // Return mixed suggestions if no category specified
  return [
    ...suggestions.positive.slice(0, 3),
    ...suggestions.negative.slice(0, 3),
    ...suggestions.neutral.slice(0, 3)
  ]
}