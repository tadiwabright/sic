import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, color } = await request.json()
    const houseId = Number.parseInt(params.id)

    if (!name || !color) {
      return NextResponse.json({ error: "Name and color are required" }, { status: 400 })
    }

    const result = await sql`
      UPDATE houses 
      SET name = ${name}, color = ${color}
      WHERE id = ${houseId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "House not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating house:", error)
    return NextResponse.json({ error: "Failed to update house" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const houseId = Number.parseInt(params.id)

    // Delete associated swimmers and results first
    await sql`DELETE FROM results WHERE swimmer_id IN (SELECT id FROM swimmers WHERE house_id = ${houseId})`
    await sql`DELETE FROM swimmers WHERE house_id = ${houseId}`
    await sql`DELETE FROM houses WHERE id = ${houseId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting house:", error)
    return NextResponse.json({ error: "Failed to delete house" }, { status: 500 })
  }
}
