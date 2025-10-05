import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import ExcelJS from "exceljs"

export const runtime = "nodejs"

const sql = neon(process.env.DATABASE_URL!)

// Ensure lanes schema exists (swimmer-level to allow multiple per house)
async function ensureLanesSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS event_swimmer_lanes (
      event_id INT NOT NULL,
      swimmer_id INT NOT NULL,
      lane INT NOT NULL CHECK (lane BETWEEN 1 AND 10),
      PRIMARY KEY (event_id, swimmer_id),
      UNIQUE (event_id, lane)
    )
  `
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawFormat = searchParams.get("format")
    const format: "excel" | "pdf" =
      rawFormat === "excel" || rawFormat === "pdf" ? (rawFormat as "excel" | "pdf") : "pdf"
    const house = searchParams.get("house") || "all"
    const type = searchParams.get("type") || "overview"

    // If Excel is requested, build a fresh workbook from live system data (no outdated template)
    if (format === "excel") {
      const workbook = new ExcelJS.Workbook()

      // 1) Get houses ordered by current standings (total_points desc)
      const houses = await sql`
        SELECT 
          h.id,
          h.name as house_name,
          h.color as house_color,
          COALESCE(SUM(r.points), 0) AS total_points
        FROM houses h
        LEFT JOIN swimmers s ON h.id = s.house_id
        LEFT JOIN results r ON s.id = r.swimmer_id
        GROUP BY h.id, h.name, h.color
        ORDER BY total_points DESC, h.name
      `
      // Normalize and cap to 4 houses for header mapping
      const topHouses = (Array.isArray(houses) ? houses : []).slice(0, 4).map((h: any) => ({
        id: Number(h.id),
        name: h.house_name ?? h.name ?? "House",
        color: (h.house_color ?? h.color ?? "#6c757d") as string,
      }))

      // Fallback if fewer than 4
      const FALLBACK = [
        { id: -1, name: "House 1", color: "#E53935" },
        { id: -2, name: "House 2", color: "#1E88E5" },
        { id: -3, name: "House 3", color: "#43A047" },
        { id: -4, name: "House 4", color: "#FDD835" },
      ]
      while (topHouses.length < 4) topHouses.push(FALLBACK[topHouses.length])

      // Helper: compute readable font color
      const textColorForBg = (bg: string) => {
        try {
          let c = bg.trim()
          if (!c.startsWith('#')) return '#000'
          if (c.length === 4) c = `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`
          const r = parseInt(c.slice(1, 3), 16)
          const g = parseInt(c.slice(3, 5), 16)
          const b = parseInt(c.slice(5, 7), 16)
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
          return luminance > 0.58 ? '#000000' : '#FFFFFF'
        } catch {
          return '#000000'
        }
      }
      // 2) Create a clean worksheet for 2025 report
      const year = new Date().getFullYear()
      const ws = workbook.addWorksheet(`Interhouse ${year}`)

      // Understandable initials for houses, plus colored headers
      const initials = (name: string) => name
        .split(/\s+/)
        .filter(Boolean)
        .map(w => w[0]!.toUpperCase())
        .join('')
        .slice(0, 3) || 'H'

      // Define headers: [#, Event, H1, H2, H3, H4]
      const headers = ["#", "Event", ...topHouses.map(h => initials(h.name))]
      ws.addRow(headers)
      // Style header row
      const headerRow = ws.getRow(1)
      headerRow.font = { bold: true }
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
      // Color house header cells
      topHouses.forEach((h, idx) => {
        const colIdx = 3 + idx // C..F
        const fg = textColorForBg(h.color)
        const cell = ws.getCell(1, colIdx)
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: h.color.replace('#','').toUpperCase() } }
        cell.font = { bold: true, color: { argb: fg.replace('#','').toUpperCase() } }
      })

      // Column widths for readability
      ws.getColumn(1).width = 6
      ws.getColumn(2).width = 50
      ws.getColumn(3).width = 12
      ws.getColumn(4).width = 12
      ws.getColumn(5).width = 12
      ws.getColumn(6).width = 12

      // 3) Populate event rows with system data
      const dataStartRow = 2

        // Fetch events and per-house points for each event
        const eventHouseRows = await sql`
          SELECT 
            e.id as event_id,
            e.name as event_name,
            e.distance as event_distance,
            e.category as event_category,
            e.gender as event_gender,
            e.age_group as event_age_group,
            e.event_order,
            h.id as house_id,
            h.name as house_name,
            h.color as house_color,
            COALESCE(SUM(r.points), 0) as house_points,
            MIN(CASE WHEN r.status = 'completed' THEN r.time_seconds END) as fastest_time,
            MIN(r.position) as best_position
          FROM events e
          CROSS JOIN houses h
          LEFT JOIN swimmers s ON s.house_id = h.id
          LEFT JOIN results r ON r.swimmer_id = s.id AND r.event_id = e.id
          GROUP BY e.id, e.name, e.distance, e.category, e.gender, e.age_group, e.event_order, h.id, h.name, h.color
          ORDER BY e.event_order ASC, h.name ASC
        `

        // Group by event_id
        const eventsMap = new Map<number, {
          meta: { name: string; distance: string; category: string; gender: string; age_group: string; order: number; fastest_time: number | null },
          perHouse: Record<number, { name: string; color: string; points: number; position: number | null }>
        }>()

        for (const row of eventHouseRows as any[]) {
          const eid = Number(row.event_id)
          if (!eventsMap.has(eid)) {
            eventsMap.set(eid, {
              meta: {
                name: row.event_name,
                distance: row.event_distance,
                category: row.event_category,
                gender: row.event_gender,
                age_group: row.event_age_group,
                order: Number(row.event_order ?? 0),
                fastest_time: row.fastest_time !== null ? Number(row.fastest_time) : null,
              },
              perHouse: {},
            })
          }
          const entry = eventsMap.get(eid)!
          entry.perHouse[Number(row.house_id)] = {
            name: row.house_name,
            color: row.house_color,
            points: Number(row.house_points ?? 0),
            position: row.best_position !== undefined && row.best_position !== null ? Number(row.best_position) : null,
          }
          // track min fastest_time across rows
          if (row.fastest_time !== null) {
            const t = Number(row.fastest_time)
            if (entry.meta.fastest_time === null || t < entry.meta.fastest_time) entry.meta.fastest_time = t
          }

        }
        // Sort events by order
        const eventsSorted = Array.from(eventsMap.entries()).sort((a, b) => a[1].meta.order - b[1].meta.order)

        // Map house ids in Standings order (topHouses implied order)
      const topHouseIds = topHouses.map(h => h.id)
      // Build a map of house -> total points from the standings query above
      const houseTotalsById = new Map<number, number>(
        (Array.isArray(houses) ? houses : []).map((h: any) => [Number(h.id), Number(h.total_points ?? 0)])
      )

      // Iterate events and write minimal rows: A (index), B (label), C–F (per-house points)
      eventsSorted.forEach(([eventId, eData], i) => {
        const metaBits = [eData.meta.distance, eData.meta.category, eData.meta.gender, eData.meta.age_group].filter(Boolean)
        const label = metaBits.length ? `${eData.meta.name} (${metaBits.join(' • ')})` : eData.meta.name
        ws.addRow([
          i + 1,
          label,
          ...topHouseIds.map(hid => eData.perHouse[hid]?.points ?? 0),
        ])
      })
      // Totals row per house (from live standings)
      ws.addRow([])
      const totalsRow = ws.addRow([
        '',
        'TOTAL POINTS',
        ...topHouseIds.map(hid => houseTotalsById.get(hid) ?? 0),
      ])
      totalsRow.font = { bold: true }
      totalsRow.alignment = { vertical: 'middle', horizontal: 'center' }
      
      // Build event -> house -> lane map
      await ensureLanesSchema()
      const laneRows = await sql`
        SELECT l.event_id, l.lane, s.house_id as house_id, h.name as house_name
        FROM event_swimmer_lanes l
        JOIN swimmers s ON s.id = l.swimmer_id
        JOIN houses h ON h.id = s.house_id
      `
      const lanesByEvent = new Map<number, Map<number, { lanes: number[]; house_name: string }>>()
      for (const r of laneRows as any[]) {
        const eid = Number(r.event_id)
        const hid = Number(r.house_id)
        if (!lanesByEvent.has(eid)) lanesByEvent.set(eid, new Map())
        const m = lanesByEvent.get(eid)!
        if (!m.has(hid)) m.set(hid, { lanes: [], house_name: r.house_name })
        m.get(hid)!.lanes.push(Number(r.lane))
      }

      // SUMMARY SHEET (per-event details WITHOUT per-event cumulative totals)
      const wsSummary = workbook.addWorksheet('Summary')
      // Keep gridlines visible and freeze the two header rows
      ;(wsSummary as any).views = [{ state: 'frozen', ySplit: 2, showGridLines: true }]
      // Columns: A Event | B-E Lanes | F-I Points | J-M Position
      wsSummary.getColumn(1).width = 40
      for (let c = 2; c <= 13; c++) wsSummary.getColumn(c).width = 12

      // Row 1: Section titles with merges
      wsSummary.addRow(['Event'])
      const r1 = wsSummary.getRow(1)
      r1.font = { bold: true }
      r1.alignment = { vertical: 'middle', horizontal: 'center' }
      wsSummary.mergeCells(1, 1, 2, 1) // Event header spans two rows
      wsSummary.mergeCells(1, 2, 1, 5) // House Lanes (B-E)
      wsSummary.mergeCells(1, 6, 1, 9) // Points per House (F-I)
      wsSummary.mergeCells(1, 10, 1, 13) // Position per House (J-M)
      wsSummary.getCell(1, 2).value = 'House Lanes'
      wsSummary.getCell(1, 6).value = 'Points per House'
      wsSummary.getCell(1, 10).value = 'Position per House'

      // Row 2: Per-house initials subheaders, colored by house color
      wsSummary.addRow([''])
      const r2 = wsSummary.getRow(2)
      r2.font = { bold: true }
      r2.alignment = { vertical: 'middle', horizontal: 'center' }

      const sectionStarts = { lanes: 2, points: 6, position: 10 }
      topHouses.forEach((h, idx) => {
        const init = initials(h.name)
        const fg = textColorForBg(h.color)
        const argbBg = h.color.replace('#','').toUpperCase()
        const argbFg = fg.replace('#','').toUpperCase()
        // For each section, set header cell value and color
        const offsets = [sectionStarts.lanes, sectionStarts.points, sectionStarts.position]
        offsets.forEach(startCol => {
          const col = startCol + idx
          const cell = wsSummary.getCell(2, col)
          cell.value = init
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argbBg } }
          cell.font = { bold: true, color: { argb: argbFg } }
          cell.border = {
            top: { style: 'thin', color: { argb: '000000' } },
            left: { style: 'thin', color: { argb: '000000' } },
            bottom: { style: 'thin', color: { argb: '000000' } },
            right: { style: 'thin', color: { argb: '000000' } },
          }
        })
      })
      // Add borders to row 1 (section titles) and Event column header
      for (let c = 1; c <= 13; c++) {
        const cell1 = wsSummary.getCell(1, c)
        cell1.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        }
      }

      // Body rows by event
      let currentRow = 3
      for (const [eventId, eData] of eventsSorted) {
        const metaBits = [eData.meta.distance, eData.meta.category, eData.meta.gender, eData.meta.age_group].filter(Boolean)
        const label = metaBits.length ? `${eData.meta.name} (${metaBits.join(' • ')})` : eData.meta.name
        const row = wsSummary.getRow(currentRow)
        const cellEvent = row.getCell(1)
        cellEvent.value = label
        row.alignment = { vertical: 'middle', horizontal: 'center' }
        cellEvent.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        }

        const lanesMap = lanesByEvent.get(eventId) || new Map()

        // Populate Lanes (B-E) with colored cells per house
        topHouses.forEach((h, idx) => {
          const col = sectionStarts.lanes + idx
          const cell = row.getCell(col)
          const houseLanes = lanesMap.get(h.id)?.lanes || []
          const laneStr = houseLanes.length ? houseLanes.sort((a: number, b: number) => a - b).join(',') : ''
          cell.value = laneStr
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: h.color.replace('#','').toUpperCase() } }
          cell.font = { bold: true, color: { argb: textColorForBg(h.color).replace('#','').toUpperCase() } }
          cell.border = {
            top: { style: 'thin', color: { argb: '000000' } },
            left: { style: 'thin', color: { argb: '000000' } },
            bottom: { style: 'thin', color: { argb: '000000' } },
            right: { style: 'thin', color: { argb: '000000' } },
          }
        })

        // Points per House (F-I)
        topHouses.forEach((h, idx) => {
          const col = sectionStarts.points + idx
          const cell = row.getCell(col)
          const pts = eData.perHouse[h.id]?.points ?? 0
          cell.value = pts
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
          // color and border
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: h.color.replace('#','').toUpperCase() } }
          cell.font = { bold: true, color: { argb: textColorForBg(h.color).replace('#','').toUpperCase() } }
          cell.border = {
            top: { style: 'thin', color: { argb: '000000' } },
            left: { style: 'thin', color: { argb: '000000' } },
            bottom: { style: 'thin', color: { argb: '000000' } },
            right: { style: 'thin', color: { argb: '000000' } },
          }
        })

        // Position per House (J-M)
        topHouses.forEach((h, idx) => {
          const col = sectionStarts.position + idx
          const cell = row.getCell(col)
          const pos = eData.perHouse[h.id]?.position ?? ''
          cell.value = pos
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: h.color.replace('#','').toUpperCase() } }
          cell.font = { bold: true, color: { argb: textColorForBg(h.color).replace('#','').toUpperCase() } }
          cell.border = {
            top: { style: 'thin', color: { argb: '000000' } },
            left: { style: 'thin', color: { argb: '000000' } },
            bottom: { style: 'thin', color: { argb: '000000' } },
            right: { style: 'thin', color: { argb: '000000' } },
          }
        })

        // Leave after-coloring
        currentRow++
      }

      // HOUSE TOTALS SHEET (single list of houses and total points)
      const wsTotals = workbook.addWorksheet('House Totals')
      wsTotals.addRow(['House', 'Total Points'])
      const htHead = wsTotals.getRow(1)
      htHead.font = { bold: true }
      htHead.alignment = { vertical: 'middle', horizontal: 'center' }
      wsTotals.getColumn(1).width = 30
      wsTotals.getColumn(2).width = 16
      for (const h of (Array.isArray(houses) ? (houses as any[]) : [])) {
        const name = h.house_name ?? h.name ?? 'House'
        const total = Number(h.total_points ?? 0)
        wsTotals.addRow([name, total])
      }

      // SWIMMERS SHEET
      const swimmersRows = await sql`
        SELECT 
          s.name as swimmer_name,
          h.name as house_name,
          s.gender,
          s.age_group,
          COALESCE(SUM(r.points), 0) as total_points,
          COUNT(r.id) as event_count,
          MIN(r.position) as best_position
        FROM swimmers s
        JOIN houses h ON s.house_id = h.id
        LEFT JOIN results r ON s.id = r.swimmer_id
        GROUP BY s.id, s.name, h.name, s.gender, s.age_group
        ORDER BY total_points DESC, swimmer_name ASC
      `
      const wsSwimmers = workbook.addWorksheet('Swimmers')
      wsSwimmers.addRow(['Swimmer', 'House', 'Gender', 'Age Group', 'Total Points', 'Event Count', 'Best Position'])
      const swHead = wsSwimmers.getRow(1)
      swHead.font = { bold: true }
      swHead.alignment = { vertical: 'middle', horizontal: 'center' }
      wsSwimmers.getColumn(1).width = 30
      wsSwimmers.getColumn(2).width = 20
      wsSwimmers.getColumn(3).width = 12
      wsSwimmers.getColumn(4).width = 16
      wsSwimmers.getColumn(5).width = 14
      wsSwimmers.getColumn(6).width = 14
      wsSwimmers.getColumn(7).width = 16
      for (const r of swimmersRows as any[]) {
        wsSwimmers.addRow([
          r.swimmer_name,
          r.house_name,
          r.gender,
          r.age_group,
          Number(r.total_points ?? 0),
          Number(r.event_count ?? 0),
          r.best_position !== null ? Number(r.best_position) : ''
        ])
      }

      // RESULTS BY EVENT SHEET
      const wsByEvent = workbook.addWorksheet('Results by Event')
      wsByEvent.addRow(['Event', 'House', 'Lane', 'Points', 'Best Position'])
      const beHead = wsByEvent.getRow(1)
      beHead.font = { bold: true }
      beHead.alignment = { vertical: 'middle', horizontal: 'center' }
      wsByEvent.getColumn(1).width = 40
      wsByEvent.getColumn(2).width = 20
      wsByEvent.getColumn(3).width = 10
      wsByEvent.getColumn(4).width = 12
      wsByEvent.getColumn(5).width = 14
      for (const [eventId, eData] of eventsSorted) {
        const metaBits = [eData.meta.distance, eData.meta.category, eData.meta.gender, eData.meta.age_group].filter(Boolean)
        const label = metaBits.length ? `${eData.meta.name} (${metaBits.join(' • ')})` : eData.meta.name
        const lanesMap = lanesByEvent.get(eventId) || new Map()
        for (const hid of topHouseIds) {
          const houseData = eData.perHouse[hid]
          if (!houseData) continue
          const houseLanes = lanesMap.get(hid)?.lanes || []
          const laneStr = houseLanes.length ? houseLanes.sort((a: number, b: number) => a - b).join(',') : ''
          wsByEvent.addRow([
            label,
            houseData.name,
            laneStr,
            houseData.points ?? 0,
            houseData.position ?? ''
          ])
        }
        wsByEvent.addRow([]) // spacer between events
      }
      // 4) Return updated workbook
      // Neutralize formulas (especially shared formulas) to avoid ExcelJS serialization issues
      if (ws) {
        ws.eachRow({ includeEmpty: false }, (row: ExcelJS.Row) => {
          row.eachCell((cell: ExcelJS.Cell) => {
            const v: any = cell.value
            if (v && typeof v === 'object' && (("sharedFormula" in v) || ("formula" in v))) {
              // Preserve last computed value if present; otherwise clear
              cell.value = (v as any).result ?? null
            }
          })
        })
      }
      // Hint Excel to recalc on open if needed
      ;(workbook as any).calcProperties = { fullCalcOnLoad: true }
      const outBuffer = await workbook.xlsx.writeBuffer()
      const nodeBuffer = Buffer.from(outBuffer as ArrayBuffer)
      return new NextResponse(nodeBuffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=Interhouse-Report-${new Date().toISOString().split("T")[0]}.xlsx`,
        },
      })
    }

    // House performance summary used by PDF/CSV sections
    const housePerformance = await sql`
      SELECT 
        h.name as house_name,
        COALESCE(SUM(r.points), 0) as total_points,
        COUNT(DISTINCT CASE WHEN r.position = 1 THEN r.id END) as event_wins,
        COUNT(DISTINCT s.id) as swimmer_count
      FROM houses h
      LEFT JOIN swimmers s ON s.house_id = h.id
      LEFT JOIN results r ON r.swimmer_id = s.id
      GROUP BY h.id, h.name
      ORDER BY total_points DESC
    `

    // Top swimmers list for the summary
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
      // CSV export for non-PDF, non-Excel requests (Excel handled above)
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
