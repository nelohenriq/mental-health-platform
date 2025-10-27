import { NextRequest, NextResponse } from "next/server"
// @ts-ignore
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const entry = await prisma.moodEntry.findFirst({
      where: {
        id: params.id,
        userId: session.user.id // Ensure user can only access their own entries
      }
    })

    if (!entry) {
      return NextResponse.json(
        { error: "Mood entry not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ entry })

  } catch (error) {
    console.error("Get mood entry error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (moodLevel !== undefined && (moodLevel < 1 || moodLevel > 10)) {
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

    const updatedEntry = await prisma.moodEntry.updateMany({
      where: {
        id: params.id,
        userId: session.user.id // Ensure user can only update their own entries
      },
      data: {
        ...(moodLevel !== undefined && { moodLevel: parseInt(moodLevel) }),
        ...(notes !== undefined && { notes }),
        ...(factors !== undefined && { factors }),
        ...(timestamp && { timestamp: new Date(timestamp) })
      }
    })

    if (updatedEntry.count === 0) {
      return NextResponse.json(
        { error: "Mood entry not found or unauthorized" },
        { status: 404 }
      )
    }

    // Get the updated entry
    const entry = await prisma.moodEntry.findUnique({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: "Mood entry updated successfully",
      entry
    })

  } catch (error) {
    console.error("Update mood entry error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const deletedEntry = await prisma.moodEntry.deleteMany({
      where: {
        id: params.id,
        userId: session.user.id // Ensure user can only delete their own entries
      }
    })

    if (deletedEntry.count === 0) {
      return NextResponse.json(
        { error: "Mood entry not found or unauthorized" },
        { status: 404 }
      )
    }

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