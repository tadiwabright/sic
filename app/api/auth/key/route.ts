import { NextResponse } from "next/server"

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "swim-admin-2025"

export async function POST(request: Request) {
  try {
    const { key } = await request.json()

    if (!key) {
      return NextResponse.json({ success: false, error: "Secret key is required" }, { status: 400 })
    }

    if (key !== ADMIN_SECRET) {
      return NextResponse.json({ success: false, error: "Invalid secret key" }, { status: 401 })
    }

    const res = NextResponse.json({ success: true })
    res.cookies.set("admin-key", key, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    })
    return res
  } catch (error) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 })
  }
}
