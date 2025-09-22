import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser, createSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    const authResult = await authenticateUser(email, password)

    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
    }

    const token = await createSession(authResult.user)

    const res = NextResponse.json({
      success: true,
      user: authResult.user,
    })

    res.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    })

    return res
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
