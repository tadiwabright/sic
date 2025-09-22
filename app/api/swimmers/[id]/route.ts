import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "official")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)

    await sql`DELETE FROM swimmers WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting swimmer:", error)
    return NextResponse.json({ error: "Failed to delete swimmer" }, { status: 500 })
  }
}
