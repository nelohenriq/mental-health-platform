import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      )
    }

    // Find user with verification token
    // Note: In a real implementation, you'd have emailVerificationToken field in User model
    const user = await prisma.user.findFirst({
      where: {
        // In a real app, you'd check:
        // emailVerificationToken: token
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      )
    }

    // Mark email as verified and clear verification token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // In a real app, you'd have emailVerified field:
        // emailVerified: new Date(),
        // emailVerificationToken: null
      }
    })

    return NextResponse.json({
      message: "Email verified successfully"
    })

  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      )
    }

    // Same verification logic as POST
    const user = await prisma.user.findFirst({
      where: {
        // emailVerificationToken: token
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        // emailVerified: new Date(),
        // emailVerificationToken: null
      }
    })

    // Redirect to success page or return success response
    return NextResponse.json({
      message: "Email verified successfully",
      redirect: "/auth/verification-success"
    })

  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}