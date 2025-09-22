import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "pdf"
    const house = searchParams.get("house") || "all"
    const type = searchParams.get("type") || "overview"

    // Fetch the same data as analytics
    const housePerformance = await sql`
      SELECT 
        h.name as house_name,
        h.color as house_color,
        COALESCE(SUM(r.points), 0) as total_points,
        COUNT(DISTINCT CASE WHEN r.position = 1 THEN r.event_id END) as event_wins,
        COUNT(DISTINCT s.id) as swimmer_count
      FROM houses h
      LEFT JOIN swimmers s ON h.id = s.house_id
      LEFT JOIN results r ON s.id = r.swimmer_id
      GROUP BY h.id, h.name, h.color
      ORDER BY total_points DESC
    `

    const topSwimmers = await sql`
      SELECT 
        s.name as swimmer_name,
        h.name as house_name,
        COALESCE(SUM(r.points), 0) as total_points,
        COUNT(r.id) as event_count,
        MIN(r.position) as best_position
      FROM swimmers s
      JOIN houses h ON s.house_id = h.id
      LEFT JOIN results r ON s.id = r.swimmer_id
      GROUP BY s.id, s.name, h.name
      HAVING COUNT(r.id) > 0
      ORDER BY total_points DESC
      LIMIT 10
    `

    // Generate report content
    let reportContent = ""

    if (format === "pdf") {
      // Simple HTML for PDF generation (would need a PDF library in production)
      reportContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Swimming Competition Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Swimming Competition Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <h2>House Performance</h2>
          <table>
            <tr>
              <th>House</th>
              <th>Total Points</th>
              <th>Event Wins</th>
              <th>Swimmers</th>
            </tr>
            ${housePerformance
              .map(
                (house) => `
              <tr>
                <td>${house.house_name}</td>
                <td>${house.total_points}</td>
                <td>${house.event_wins}</td>
                <td>${house.swimmer_count}</td>
              </tr>
            `,
              )
              .join("")}
          </table>
          
          <h2>Top Swimmers</h2>
          <table>
            <tr>
              <th>Swimmer</th>
              <th>House</th>
              <th>Total Points</th>
              <th>Events</th>
              <th>Best Position</th>
            </tr>
            ${topSwimmers
              .map(
                (swimmer) => `
              <tr>
                <td>${swimmer.swimmer_name}</td>
                <td>${swimmer.house_name}</td>
                <td>${swimmer.total_points}</td>
                <td>${swimmer.event_count}</td>
                <td>${swimmer.best_position}</td>
              </tr>
            `,
              )
              .join("")}
          </table>
        </body>
        </html>
      `

      return new NextResponse(reportContent, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": "attachment; filename=swimming-report.html",
        },
      })
    } else {
      // Excel format (CSV for simplicity)
      let csvContent = "Swimming Competition Report\n\n"
      csvContent += "House Performance\n"
      csvContent += "House,Total Points,Event Wins,Swimmers\n"

      for (const house of housePerformance) {
        csvContent += `${house.house_name},${house.total_points},${house.event_wins},${house.swimmer_count}\n`
      }

      csvContent += "\nTop Swimmers\n"
      csvContent += "Swimmer,House,Total Points,Events,Best Position\n"

      for (const swimmer of topSwimmers) {
        csvContent += `${swimmer.swimmer_name},${swimmer.house_name},${swimmer.total_points},${swimmer.event_count},${swimmer.best_position}\n`
      }

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=swimming-report.csv",
        },
      })
    }
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
