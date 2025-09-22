import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const houseFilter = searchParams.get("house")

    // House Performance Data (parameterized and composable)
    const houseCondition =
      houseFilter && houseFilter !== "all" ? sql`WHERE h.name = ${houseFilter}` : sql``

    const housePerformance = await sql`
      SELECT 
        h.name as house_name,
        h.color as house_color,
        COALESCE(SUM(r.points), 0) as total_points,
        COUNT(DISTINCT CASE WHEN r.position = 1 THEN r.event_id END) as event_wins,
        COUNT(DISTINCT s.id) as swimmer_count,
        CASE 
          WHEN COUNT(DISTINCT s.id) > 0 
          THEN COALESCE(SUM(r.points), 0)::float / COUNT(DISTINCT s.id)
          ELSE 0 
        END as avg_points_per_swimmer
      FROM houses h
      LEFT JOIN swimmers s ON h.id = s.house_id
      LEFT JOIN results r ON s.id = r.swimmer_id
      ${houseCondition}
      GROUP BY h.id, h.name, h.color
      ORDER BY total_points DESC
    `

    // Top Swimmers Data
    const swimmersHouseCondition =
      houseFilter && houseFilter !== "all" ? sql`WHERE h.name = ${houseFilter}` : sql``

    const topSwimmers = await sql`
      SELECT 
        s.name as swimmer_name,
        h.name as house_name,
        h.color as house_color,
        COALESCE(SUM(r.points), 0) as total_points,
        COUNT(r.id) as event_count,
        MIN(r.position) as best_position
      FROM swimmers s
      JOIN houses h ON s.house_id = h.id
      LEFT JOIN results r ON s.id = r.swimmer_id
      ${swimmersHouseCondition}
      GROUP BY s.id, s.name, h.name, h.color
      HAVING COUNT(r.id) > 0
      ORDER BY total_points DESC, best_position ASC
      LIMIT 10
    `

    // Event Statistics
    const eventStats = await sql`
      SELECT 
        e.name as event_name,
        COUNT(r.id) as participant_count,
        COUNT(r.id) > 0 as completed,
        CASE 
          WHEN COUNT(r.time) > 0 
          THEN CONCAT(
            FLOOR(AVG(EXTRACT(EPOCH FROM r.time)) / 60), ':',
            LPAD(FLOOR(AVG(EXTRACT(EPOCH FROM r.time)) % 60)::text, 2, '0')
          )
          ELSE NULL 
        END as avg_time
      FROM events e
      LEFT JOIN results r ON e.id = r.event_id
      GROUP BY e.id, e.name
      ORDER BY e.date DESC, e.name
    `

    // Performance Trends (simplified - showing cumulative points over time)
    const performanceTrends = await sql`
      SELECT 
        e.date::text as event_date,
        h.name as house_name,
        SUM(r.points) OVER (
          PARTITION BY h.id 
          ORDER BY e.date 
          ROWS UNBOUNDED PRECEDING
        ) as cumulative_points
      FROM events e
      JOIN results r ON e.id = r.event_id
      JOIN swimmers s ON r.swimmer_id = s.id
      JOIN houses h ON s.house_id = h.id
      WHERE r.points > 0
      ORDER BY e.date, h.name
    `

    return NextResponse.json({
      housePerformance,
      topSwimmers,
      eventStats,
      performanceTrends,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
