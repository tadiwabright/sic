import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
    const maxRetries = 3
    let attempt = 0
    let lastError: unknown

    while (attempt < maxRetries) {
      try {
        const results = await sql`
          SELECT 
            r.id,
            s.name as swimmer_name,
            h.name as house_name,
            h.color as house_color,
            e.name as event_name,
            e.distance as event_distance,
            e.category as event_category,
            r.position,
            r.time_seconds,
            r.points,
            r.status
          FROM results r
          JOIN swimmers s ON r.swimmer_id = s.id
          JOIN houses h ON s.house_id = h.id
          JOIN events e ON r.event_id = e.id
          ORDER BY e.event_order ASC, r.position ASC, r.id DESC
        `
        return NextResponse.json(results)
      } catch (err) {
        lastError = err
        attempt += 1
        if (attempt >= maxRetries) break
        const delay = 500 * Math.pow(2, attempt - 1)
        console.warn(`participant-results query failed (attempt ${attempt}) – retrying in ${delay}ms`, err)
        await sleep(delay)
      }
    }

    throw lastError
  } catch (error) {
    console.error("Error fetching participant results:", error)
    return NextResponse.json({ error: "Failed to fetch participant results" }, { status: 500 })
  }
}
