import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function ensureCompetitionSchema() {
  // Houses
  await sql`
    CREATE TABLE IF NOT EXISTS houses (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Events
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      distance TEXT NOT NULL,
      gender TEXT NOT NULL,
      age_group TEXT NOT NULL,
      max_participants_per_house INTEGER NOT NULL DEFAULT 2,
      is_active BOOLEAN NOT NULL DEFAULT true,
      event_order INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Swimmers
  await sql`
    CREATE TABLE IF NOT EXISTS swimmers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      house_id INTEGER NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`ALTER TABLE swimmers ADD COLUMN IF NOT EXISTS age_group TEXT`
  await sql`ALTER TABLE swimmers ADD COLUMN IF NOT EXISTS gender TEXT`

  // Normalize existing gender values to lowercase and enforce a simple check constraint
  await sql`UPDATE swimmers SET gender = LOWER(gender) WHERE gender IS NOT NULL`
  await sql`ALTER TABLE swimmers DROP CONSTRAINT IF EXISTS swimmers_gender_check`
  await sql`ALTER TABLE swimmers ADD CONSTRAINT swimmers_gender_check CHECK (gender IN ('male','female'))`

  // Results
  await sql`
    CREATE TABLE IF NOT EXISTS results (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      swimmer_id INTEGER NOT NULL REFERENCES swimmers(id) ON DELETE CASCADE,
      time_seconds NUMERIC,
      status TEXT NOT NULL DEFAULT 'completed',
      position INTEGER,
      points INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Helpful indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_results_event ON results(event_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_results_swimmer ON results(swimmer_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_events_order ON events(event_order)`
}

export async function GET() {
  try {
    await ensureCompetitionSchema()
    return NextResponse.json({ success: true, message: "Competition schema ensured" })
  } catch (error) {
    console.error("bootstrap-competition error (GET):", error)
    return NextResponse.json({ success: false, error: "Bootstrap failed" }, { status: 500 })
  }
}

export async function POST() {
  try {
    await ensureCompetitionSchema()
    return NextResponse.json({ success: true, message: "Competition schema ensured" })
  } catch (error) {
    console.error("bootstrap-competition error (POST):", error)
    return NextResponse.json({ success: false, error: "Bootstrap failed" }, { status: 500 })
  }
}
