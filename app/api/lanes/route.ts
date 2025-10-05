import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
export const runtime = "edge"; // lane CRUD is lightweight

// Ensure swimmer-level lanes table exists (idempotent)
async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS event_swimmer_lanes (
      event_id INT NOT NULL,
      swimmer_id INT NOT NULL,
      lane INT NOT NULL CHECK (lane BETWEEN 1 AND 10),
      PRIMARY KEY (event_id, swimmer_id),
      UNIQUE (event_id, lane)
    )
  `;
}

export async function GET(request: NextRequest) {
  try {
    await ensureSchema();
    const { searchParams } = new URL(request.url);
    const eventId = Number(searchParams.get("eventId"));
    if (!eventId) return NextResponse.json({ error: "eventId is required" }, { status: 400 });

    const rows = await sql`
      SELECT 
        l.event_id, 
        l.lane, 
        s.id as swimmer_id,
        s.name as swimmer_name,
        h.id as house_id,
        h.name as house_name
      FROM event_swimmer_lanes l
      JOIN swimmers s ON s.id = l.swimmer_id
      JOIN houses h ON h.id = s.house_id
      WHERE l.event_id = ${eventId}
      ORDER BY l.lane ASC
    `;

    return NextResponse.json(rows);
  } catch (e) {
    console.error("GET /api/lanes error", e);
    return NextResponse.json({ error: "Failed to fetch lanes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();
    const body = await request.json();
    const eventId = Number(body.eventId);
    // New format: swimmer-level assignments
    const assignments: Array<{ swimmerId: number; lane: number }> = body.assignments || [];
    if (!eventId || !Array.isArray(assignments)) {
      return NextResponse.json({ error: "eventId and assignments[] required" }, { status: 400 });
    }

    // Validate lanes 1-10 and uniqueness
    const lanes = assignments.map(a => a.lane);
    const invalid = lanes.some(l => typeof l !== "number" || l < 1 || l > 10);
    if (invalid) return NextResponse.json({ error: "lanes must be 1..10" }, { status: 400 });
    const dup = new Set<number>();
    for (const l of lanes) {
      if (dup.has(l)) return NextResponse.json({ error: "duplicate lane in assignments" }, { status: 400 });
      dup.add(l);
    }

    // Upsert each assignment
    for (const { swimmerId, lane } of assignments) {
      await sql`
        INSERT INTO event_swimmer_lanes (event_id, swimmer_id, lane)
        VALUES (${eventId}, ${swimmerId}, ${lane})
        ON CONFLICT (event_id, swimmer_id)
        DO UPDATE SET lane = EXCLUDED.lane
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/lanes error", e);
    return NextResponse.json({ error: "Failed to save lanes" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureSchema();
    const body = await request.json();
    const eventId = Number(body.eventId);
    const swimmerId = Number(body.swimmerId);
    if (!eventId || !swimmerId) return NextResponse.json({ error: "eventId and swimmerId required" }, { status: 400 });

    await sql`DELETE FROM event_swimmer_lanes WHERE event_id = ${eventId} AND swimmer_id = ${swimmerId}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/lanes error", e);
    return NextResponse.json({ error: "Failed to delete lane" }, { status: 500 });
  }
}
