import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
// @ts-ignore
import { getServerSession } from "next-auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        crisisFlag: true,
        privacyMode: true,
        onboardingCompleted: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            moodEntries: true,
            conversations: true,
            cbtSessions: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })

  } catch (error) {
    console.error("Profile fetch error:", error)
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

    const { name, privacyMode, onboardingCompleted } = await request.json()

    // Validate privacy mode
    const validPrivacyModes = ["STANDARD", "MAX_SECURE"]
    if (privacyMode && !validPrivacyModes.includes(privacyMode)) {
      return NextResponse.json(
        { error: "Invalid privacy mode" },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(privacyMode && { privacyMode }),
        ...(onboardingCompleted !== undefined && { onboardingCompleted })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        crisisFlag: true,
        privacyMode: true,
        onboardingCompleted: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser
    })

  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}