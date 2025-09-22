import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Fetch all results with swimmer names, house info, and event details
    const results = await sql`
      SELECT 
        r.position,
        r.points,
        r.time_seconds,
        r.status,
        r.created_at,
        s.name as swimmer_name,
        h.name as house_name,
        h.color as house_color,
        e.name as event_name,
        e.distance as event_distance,
        e.category as event_category,
        e.gender as event_gender,
        e.age_group as event_age_group
      FROM results r
      JOIN swimmers s ON r.swimmer_id = s.id
      JOIN houses h ON s.house_id = h.id
      JOIN events e ON r.event_id = e.id
      ORDER BY e.event_order, r.position ASC NULLS LAST
    `

    // Generate CSV content
    const headers = [
      "Position",
      "Swimmer Name", 
      "House",
      "Event",
      "Distance",
      "Category",
      "Gender",
      "Age Group",
      "Time",
      "Points",
      "Status",
      "Date"
    ]
    
    const csvContent = [
      headers.join(","),
      ...results.map((result) =>
        [
          result.position ? `${result.position}${getPositionSuffix(result.position)}` : 'N/A',
          `"${result.swimmer_name}"`,
          `"${result.house_name}"`,
          `"${result.event_name}"`,
          `"${result.event_distance}"`,
          `"${result.event_category}"`,
          `"${result.event_gender}"`,
          `"${result.event_age_group}"`,
          formatTime(result.time_seconds),
          result.points,
          result.status,
          new Date(result.created_at).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n")

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="swimming-results-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting results:", error)
    return NextResponse.json({ error: "Failed to export results" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { results } = await request.json()
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format")

    if (format === "pdf") {
      // Generate PDF
      const pdfContent = generatePDF(results)
      return new NextResponse(pdfContent, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="participant-results.pdf"',
        },
      })
    } else if (format === "excel") {
      // Generate Excel
      const excelContent = generateExcel(results)
      return new NextResponse(excelContent, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="participant-results.xlsx"',
        },
      })
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 })
  } catch (error) {
    console.error("Error exporting results:", error)
    return NextResponse.json({ error: "Failed to export results" }, { status: 500 })
  }
}

function generatePDF(results: any[]) {
  // Simple CSV format for now - in production, use a proper PDF library
  const headers = ["Position", "Participant", "House", "Event", "Time", "Points", "Status", "Date"]
  const csvContent = [
    headers.join(","),
    ...results.map((result) =>
      [
        `${result.position}${getPositionSuffix(result.position)}`,
        result.swimmer_name,
        result.house_name,
        `${result.event_name} - ${result.event_distance}`,
        formatTime(result.time_seconds),
        `${result.points} pts`,
        result.status,
        new Date(result.created_at).toLocaleDateString(),
      ].join(","),
    ),
  ].join("\n")

  return Buffer.from(csvContent, "utf-8")
}

function generateExcel(results: any[]) {
  // Simple CSV format for now - in production, use a proper Excel library like xlsx
  const headers = [
    "Position",
    "Participant",
    "House",
    "Event",
    "Distance",
    "Category",
    "Time",
    "Points",
    "Status",
    "Date",
  ]
  const csvContent = [
    headers.join(","),
    ...results.map((result) =>
      [
        `${result.position}${getPositionSuffix(result.position)}`,
        result.swimmer_name,
        result.house_name,
        result.event_name,
        result.event_distance,
        result.event_category,
        formatTime(result.time_seconds),
        result.points,
        result.status,
        new Date(result.created_at).toLocaleDateString(),
      ].join(","),
    ),
  ].join("\n")

  return Buffer.from(csvContent, "utf-8")
}

function getPositionSuffix(position: number) {
  return position === 1 ? "st" : position === 2 ? "nd" : position === 3 ? "rd" : "th"
}

function formatTime(seconds: number) {
  if (!seconds) return "N/A"
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = (seconds % 60).toFixed(2)
  return minutes > 0 ? `${minutes}:${remainingSeconds.padStart(5, "0")}` : `${remainingSeconds}s`
}
