import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    const maxRetries = 3
    let attempt = 0
    let lastError: unknown

    while (attempt < maxRetries) {
      try {
        const events = await sql`
          SELECT * FROM events ORDER BY event_order
        `
        return NextResponse.json(events)
      } catch (err) {
        lastError = err
        attempt += 1
        if (attempt >= maxRetries) break
        const delay = 500 * Math.pow(2, attempt - 1)
        console.warn(`events GET failed (attempt ${attempt}) – retrying in ${delay}ms`, err)
        await sleep(delay)
      }
    }
    throw lastError
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json()

    const result = await sql`
      INSERT INTO events (name, category, distance, gender, age_group, max_participants_per_house, is_active, event_order)
      VALUES (${eventData.name}, ${eventData.category}, ${eventData.distance}, ${eventData.gender}, ${eventData.age_group}, ${eventData.max_participants_per_house}, ${eventData.is_active}, ${eventData.event_order})
      RETURNING id
    `

    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}
