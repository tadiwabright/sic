import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventData = await request.json()
    const eventId = Number.parseInt(params.id)

    await sql`
      UPDATE events 
      SET name = ${eventData.name}, 
          category = ${eventData.category}, 
          distance = ${eventData.distance}, 
          gender = ${eventData.gender}, 
          age_group = ${eventData.age_group}, 
          max_participants_per_house = ${eventData.max_participants_per_house}, 
          is_active = ${eventData.is_active}, 
          event_order = ${eventData.event_order}
      WHERE id = ${eventId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = Number.parseInt(params.id)

    await sql`DELETE FROM events WHERE id = ${eventId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
