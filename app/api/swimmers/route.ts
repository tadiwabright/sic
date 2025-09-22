import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    const maxRetries = 3
    let attempt = 0
    let lastError: unknown

    while (attempt < maxRetries) {
      try {
        const swimmers = await sql`
          SELECT s.*, h.name as house_name, h.color as house_color 
          FROM swimmers s 
          JOIN houses h ON s.house_id = h.id 
          ORDER BY s.name
        `
        return NextResponse.json(swimmers)
      } catch (err) {
        lastError = err
        attempt += 1
        if (attempt >= maxRetries) break
        const delay = 500 * Math.pow(2, attempt - 1)
        console.warn(`swimmers GET failed (attempt ${attempt}) – retrying in ${delay}ms`, err)
        await sleep(delay)
      }
    }
    throw lastError
  } catch (error) {
    console.error("Error fetching swimmers:", error)
    return NextResponse.json({ error: "Failed to fetch swimmers" }, { status: 500 })
  }
}

async function ensureSwimmersSchema() {
  // Ensure required parent table exists
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS houses (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
  } catch (e) {
    console.warn("[swimmers] ensure houses table warning:", e)
  }

  // Ensure swimmers table exists with minimum columns
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS swimmers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        house_id INTEGER NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
  } catch (e) {
    console.warn("[swimmers] ensure swimmers table warning:", e)
  }

  // Add columns if they do not exist to match UI expectations
  try {
    await sql`ALTER TABLE swimmers ADD COLUMN IF NOT EXISTS age_group TEXT` as any
  } catch (e) {
    console.warn("[swimmers] ensure age_group column warning:", e)
  }
  try {
    await sql`ALTER TABLE swimmers ADD COLUMN IF NOT EXISTS gender TEXT` as any
  } catch (e) {
    console.warn("[swimmers] ensure gender column warning:", e)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "official")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, house_id, age_group, gender } = await request.json()
    const normalizedGender = (gender ?? '').toString().trim().toLowerCase()
    if (!['male','female'].includes(normalizedGender)) {
      return NextResponse.json({ error: "Invalid gender. Use 'male' or 'female'." }, { status: 400 })
    }

    await ensureSwimmersSchema()

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    const maxRetries = 3
    let attempt = 0
    let lastError: unknown

    while (attempt < maxRetries) {
      try {
        const result = await sql`
          INSERT INTO swimmers (name, house_id, age_group, gender)
          VALUES (${name}, ${house_id}, ${age_group}, ${normalizedGender})
          RETURNING *
        `
        return NextResponse.json({ success: true, swimmer: result[0] })
      } catch (err) {
        lastError = err
        // If missing column error, try to repair schema and retry immediately once
        const code = (err as any)?.code
        if (code === '42703') {
          console.warn('[swimmers POST] Missing column, attempting schema repair and immediate retry')
          await ensureSwimmersSchema()
        } else {
          attempt += 1
        }
        if (attempt >= maxRetries) break
        const delay = 500 * Math.pow(2, attempt - 1)
        console.warn(`swimmers POST failed (attempt ${attempt}) – retrying in ${delay}ms`, err)
        await sleep(delay)
      }
    }
    throw lastError
  } catch (error) {
    console.error("Error creating swimmer:", error)
    return NextResponse.json({ error: "Failed to create swimmer" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "official")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, name, house_id, age_group, gender } = await request.json()
    const normalizedGender = (gender ?? '').toString().trim().toLowerCase()
    if (!['male','female'].includes(normalizedGender)) {
      return NextResponse.json({ error: "Invalid gender. Use 'male' or 'female'." }, { status: 400 })
    }

    await ensureSwimmersSchema()

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    const maxRetries = 3
    let attempt = 0
    let lastError: unknown

    while (attempt < maxRetries) {
      try {
        const result = await sql`
          UPDATE swimmers 
          SET name = ${name}, house_id = ${house_id}, age_group = ${age_group}, gender = ${normalizedGender}
          WHERE id = ${id}
          RETURNING *
        `
        return NextResponse.json({ success: true, swimmer: result[0] })
      } catch (err) {
        lastError = err
        const code = (err as any)?.code
        if (code === '42703') {
          console.warn('[swimmers PUT] Missing column, attempting schema repair and immediate retry')
          await ensureSwimmersSchema()
        } else {
          attempt += 1
        }
        if (attempt >= maxRetries) break
        const delay = 500 * Math.pow(2, attempt - 1)
        console.warn(`swimmers PUT failed (attempt ${attempt}) – retrying in ${delay}ms`, err)
        await sleep(delay)
      }
    }
    throw lastError
  } catch (error) {
    console.error("Error updating swimmer:", error)
    return NextResponse.json({ error: "Failed to update swimmer" }, { status: 500 })
  }
}
