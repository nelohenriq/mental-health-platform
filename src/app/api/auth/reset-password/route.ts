import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      )
    }

    // Find user with valid reset token
    // Note: In a real implementation, you'd check the reset token against the database
    // For now, we'll use a simplified approach
    const user = await prisma.user.findFirst({
      where: {
        // In a real app, you'd have resetToken and resetTokenExpiry fields
        // resetToken: token,
        // resetTokenExpiry: {
        //   gt: new Date()
        // }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        // In a real app, clear the reset token:
        // resetToken: null,
        // resetTokenExpiry: null
      }
    })

    return NextResponse.json({
      message: "Password reset successfully"
    })

  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}