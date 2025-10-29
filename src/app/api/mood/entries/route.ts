import { NextRequest, NextResponse } from "next/server"
// @ts-ignore
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {
      userId: session.user.id
    }

    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) where.timestamp.gte = new Date(startDate)
      if (endDate) where.timestamp.lte = new Date(endDate)
    }

    const [entries, total] = await Promise.all([
      prisma.moodEntry.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.moodEntry.count({ where })
    ])

    return NextResponse.json({
      entries,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error("Get mood entries error:", error)
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

    const { moodLevel, notes, factors, timestamp } = await request.json()

    // Validate mood level (1-10 scale)
    if (!moodLevel || moodLevel < 1 || moodLevel > 10) {
      return NextResponse.json(
        { error: "Mood level must be between 1 and 10" },
        { status: 400 }
      )
    }

    // Validate factors array
    if (factors && !Array.isArray(factors)) {
      return NextResponse.json(
        { error: "Factors must be an array of strings" },
        { status: 400 }
      )
    }

    const moodEntry = await prisma.moodEntry.create({
      data: {
        userId: session.user.id,
        moodLevel: parseInt(moodLevel),
        notes: notes || null,
        factors: factors || [],
        timestamp: timestamp ? new Date(timestamp) : new Date()
      }
    })

    return NextResponse.json({
      message: "Mood entry created successfully",
      entry: moodEntry
    }, { status: 201 })

  } catch (error) {
    console.error("Create mood entry error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id, moodLevel, notes, factors } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "Entry ID is required" },
        { status: 400 }
      )
    }

    // Check if entry exists and belongs to user
    const existingEntry = await prisma.moodEntry.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Mood entry not found" },
        { status: 404 }
      )
    }

    // Validate mood level if provided
    if (moodLevel !== undefined && (moodLevel < 1 || moodLevel > 10)) {
      return NextResponse.json(
        { error: "Mood level must be between 1 and 10" },
        { status: 400 }
      )
    }

    // Validate factors array if provided
    if (factors !== undefined && !Array.isArray(factors)) {
      return NextResponse.json(
        { error: "Factors must be an array of strings" },
        { status: 400 }
      )
    }

    const updatedEntry = await prisma.moodEntry.update({
      where: { id },
      data: {
        ...(moodLevel !== undefined && { moodLevel: parseInt(moodLevel) }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(factors !== undefined && { factors: factors || [] }),
      }
    })

    return NextResponse.json({
      message: "Mood entry updated successfully",
      entry: updatedEntry
    })

  } catch (error) {
    console.error("Update mood entry error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Entry ID is required" },
        { status: 400 }
      )
    }

    // Check if entry exists and belongs to user
    const existingEntry = await prisma.moodEntry.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Mood entry not found" },
        { status: 404 }
      )
    }

    await prisma.moodEntry.delete({
      where: { id }
    })

    return NextResponse.json({
      message: "Mood entry deleted successfully"
    })

  } catch (error) {
    console.error("Delete mood entry error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}