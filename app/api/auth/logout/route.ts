import { NextResponse } from "next/server"
import { logout } from "@/lib/auth"

export async function POST() {
  try {
    await logout()

    const res = NextResponse.json({ success: true })
    // Clear the cookie on the response so the browser updates it
    res.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })
    res.cookies.set("admin-key", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    return res
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ success: false, error: "Logout failed" }, { status: 500 })
  }
}
