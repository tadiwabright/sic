import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

export const sql = neon(process.env.DATABASE_URL)

// Database types
export interface House {
  id: number
  name: string
  color: string
  created_at: string
}

export interface Event {
  id: number
  name: string
  category: string
  distance: string
  gender: "male" | "female" | "mixed"
  age_group: string
  max_participants_per_house: number
  is_active: boolean
  event_order: number
  created_at: string
}

export interface Swimmer {
  id: number
  name: string
  house_id: number
  age: number
  gender: "male" | "female"
  created_at: string
  house?: House
}

export interface Result {
  id: number
  event_id: number
  swimmer_id: number
  time_seconds: number | null
  status: "completed" | "disqualified" | "did_not_start" | "did_not_finish"
  position: number | null
  points: number
  created_at: string
  updated_at: string
  swimmer?: Swimmer
  event?: Event
}

// Database functions
export async function getHouses(): Promise<House[]> {
  return await sql`SELECT * FROM houses ORDER BY name`
}

export async function getEvents(): Promise<Event[]> {
  return await sql`SELECT * FROM events ORDER BY event_order`
}

export async function getSwimmers(): Promise<Swimmer[]> {
  return await sql`
    SELECT s.*, h.name as house_name, h.color as house_color 
    FROM swimmers s 
    JOIN houses h ON s.house_id = h.id 
    ORDER BY s.name
  `
}

export async function getEventResults(eventId: number): Promise<Result[]> {
  return await sql`
    SELECT r.*, s.name as swimmer_name, h.name as house_name, h.color as house_color
    FROM results r
    JOIN swimmers s ON r.swimmer_id = s.id
    JOIN houses h ON s.house_id = h.id
    WHERE r.event_id = ${eventId}
    ORDER BY r.position ASC NULLS LAST, r.time_seconds ASC NULLS LAST
  `
}

export async function getHouseScores(): Promise<
  { house_id: number; house_name: string; house_color: string; total_points: number }[]
> {
  return await sql`
    SELECT 
      h.id as house_id,
      h.name as house_name,
      h.color as house_color,
      COALESCE(SUM(r.points), 0) as total_points
    FROM houses h
    LEFT JOIN swimmers s ON h.id = s.house_id
    LEFT JOIN results r ON s.id = r.swimmer_id
    GROUP BY h.id, h.name, h.color
    ORDER BY total_points DESC
  `
}

// Utility functions
export function calculatePoints(position: number | null, status: string): number {
  // Point system from documentation: 1st=4pts, 2nd=3pts, 3rd=2pts, 4th=1pt, 5th+=0pts, DQ=0pts
  if (status === "disqualified" || status === "did_not_start" || status === "did_not_finish" || position === null) {
    return 0
  }

  switch (position) {
    case 1:
      return 4
    case 2:
      return 3
    case 3:
      return 2
    case 4:
      return 1
    default:
      return 0 // 5th place and below get 0 points
  }
}

export function calculatePositionsWithTies(results: { time_seconds: number | null; status: string }[]): number[] {
  const positions: number[] = []
  let currentPosition = 1

  // Sort results by time (null times go to end)
  const sortedResults = results
    .map((result, index) => ({ ...result, originalIndex: index }))
    .sort((a, b) => {
      // DQ, DNS, DNF go to end
      if (a.status !== "completed" && b.status !== "completed") return 0
      if (a.status !== "completed") return 1
      if (b.status !== "completed") return -1

      // Compare times
      if (a.time_seconds === null && b.time_seconds === null) return 0
      if (a.time_seconds === null) return 1
      if (b.time_seconds === null) return -1

      return a.time_seconds - b.time_seconds
    })

  // Assign positions with tie handling
  for (let i = 0; i < sortedResults.length; i++) {
    const result = sortedResults[i]

    if (result.status !== "completed" || result.time_seconds === null) {
      positions[result.originalIndex] = null as any
      continue
    }

    if (i > 0) {
      const prevResult = sortedResults[i - 1]
      if (prevResult.time_seconds === result.time_seconds && prevResult.status === "completed") {
        // Tie - same position as previous
        positions[result.originalIndex] = positions[prevResult.originalIndex]
      } else {
        // No tie - position is current index + 1
        currentPosition = i + 1
        positions[result.originalIndex] = currentPosition
      }
    } else {
      // First place
      positions[result.originalIndex] = 1
    }
  }

  return positions
}
