import { type NextRequest, NextResponse } from "next/server"
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
        const houses = await sql`
          SELECT 
            h.id,
            h.name,
            h.color,
            COUNT(s.id) AS swimmer_count,
            COALESCE(SUM(r.points), 0) AS total_points
          FROM houses h
          LEFT JOIN swimmers s ON h.id = s.house_id
          LEFT JOIN results r ON s.id = r.swimmer_id
          GROUP BY h.id, h.name, h.color
          ORDER BY total_points DESC, h.name
        `

        return NextResponse.json(houses)
      } catch (err) {
        lastError = err
        attempt += 1
        if (attempt >= maxRetries) break
        const delay = 500 * Math.pow(2, attempt - 1)
        console.warn(`houses query failed (attempt ${attempt}) – retrying in ${delay}ms`, err)
        await sleep(delay)
      }
    }

    throw lastError
  } catch (error) {
    console.error("Error fetching houses:", error)
    return NextResponse.json({ error: "Failed to fetch houses" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, color } = await request.json()

    if (!name || !color) {
      return NextResponse.json({ error: "Name and color are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO houses (name, color)
      VALUES (${name}, ${color})
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating house:", error)
    return NextResponse.json({ error: "Failed to create house" }, { status: 500 })
  }
}
