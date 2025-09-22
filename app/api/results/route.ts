import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventIdParam = searchParams.get("event_id")

    if (!eventIdParam) {
      return NextResponse.json({ error: "event_id is required" }, { status: 400 })
    }

    const event_id = Number.parseInt(eventIdParam)

    const results = await sql`
      SELECT r.*, s.name as swimmer_name, h.name as house_name, h.color as house_color
      FROM results r
      JOIN swimmers s ON r.swimmer_id = s.id
      JOIN houses h ON s.house_id = h.id
      WHERE r.event_id = ${event_id}
      ORDER BY r.position ASC NULLS LAST, r.time_seconds ASC NULLS LAST
    `

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error fetching results:", error)
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { event_id, results } = await request.json()

    if (!event_id || !results || !Array.isArray(results)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Delete existing results for this event
    await sql`DELETE FROM results WHERE event_id = ${event_id}`

    // Insert new results
    for (const result of results) {
      await sql`
        INSERT INTO results (event_id, swimmer_id, time_seconds, status, position, points)
        VALUES (${event_id}, ${result.swimmer_id}, ${result.time_seconds}, ${result.status}, ${result.position}, ${result.points})
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving results:", error)
    return NextResponse.json({ error: "Failed to save results" }, { status: 500 })
  }
}
