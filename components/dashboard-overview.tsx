"use client"

import { useEffect, useState } from "react"
// Converted icons to Bootstrap Icons
// Types mirrored locally to avoid importing server-only code
interface House {
  id: number
  name: string
  color: string
  created_at?: string
  // enriched
  swimmer_count?: number
  total_points?: number
}

interface EventItem {
  id: number
  name: string
  category: string
  distance: string
  gender: "male" | "female" | "mixed"
  age_group: string
  max_participants_per_house: number
  is_active: boolean
  event_order: number
  created_at?: string
}

interface Swimmer {
  id: number
  name: string
  house_id: number
  age?: number
  gender: "male" | "female"
  created_at?: string
}

interface HouseScore {
  house_id: number
  house_name: string
  house_color: string
  total_points: number
}

export function DashboardOverview() {
  const [houses, setHouses] = useState<House[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [swimmers, setSwimmers] = useState<Swimmer[]>([])
  const [houseScores, setHouseScores] = useState<HouseScore[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [housesRes, eventsRes, swimmersRes] = await Promise.all([
          fetch("/api/houses"),
          fetch("/api/events"),
          fetch("/api/swimmers"),
        ])

        const [housesJson, eventsJson, swimmersJson] = await Promise.all([
          housesRes.ok ? housesRes.json() : Promise.resolve([]),
          eventsRes.ok ? eventsRes.json() : Promise.resolve([]),
          swimmersRes.ok ? swimmersRes.json() : Promise.resolve([]),
        ])

        const housesData: House[] = Array.isArray(housesJson) ? housesJson : []
        const eventsData: EventItem[] = Array.isArray(eventsJson) ? eventsJson : []
        const swimmersData: Swimmer[] = Array.isArray(swimmersJson) ? swimmersJson : []

        setHouses(housesData)
        setEvents(eventsData)
        setSwimmers(swimmersData)

        // Derive houseScores from houses endpoint (already includes total_points)
        const scoresData: HouseScore[] = housesData.map((h) => ({
          house_id: h.id,
          house_name: h.name,
          house_color: h.color,
          total_points: Number(h.total_points || 0),
        }))
        setHouseScores(scoresData)
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="d-grid gap-3">
        <h2 className="h4 m-0">Dashboard Overview</h2>
        <div className="row g-3">
          {[...Array(4)].map((_, i) => (
            <div className="col-12 col-md-6 col-lg-3" key={i}>
              <div className="card h-100">
                <div className="card-header py-2 d-flex align-items-center justify-content-between">
                  <span className="small fw-medium">Loading...</span>
                </div>
                <div className="card-body">
                  <div className="fw-bold fs-4">--</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const activeEvents = events.filter((event) => event.is_active).length
  const totalSwimmers = swimmers.length

  return (
    <div className="d-grid gap-3">
      <div className="d-flex align-items-center justify-content-between">
        <h2 className="h4 m-0">Dashboard Overview</h2>
        <span className="badge text-bg-secondary">Competition Active</span>
      </div>

      {/* Stats Cards */}
      <div className="row g-3">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card h-100">
            <div className="card-header py-2 d-flex align-items-center justify-content-between">
              <span className="small fw-medium">Total Houses</span>
              <i className="bi bi-trophy text-secondary"></i>
            </div>
            <div className="card-body">
              <div className="fw-bold fs-4">{houses.length}</div>
              <div className="small text-primary">Competing houses</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card h-100">
            <div className="card-header py-2 d-flex align-items-center justify-content-between">
              <span className="small fw-medium">Active Events</span>
              <i className="bi bi-calendar3 text-secondary"></i>
            </div>
            <div className="card-body">
              <div className="fw-bold fs-4">{activeEvents}</div>
              <div className="small text-primary">of {events.length} total events</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card h-100">
            <div className="card-header py-2 d-flex align-items-center justify-content-between">
              <span className="small fw-medium">Total Swimmers</span>
              <i className="bi bi-people text-secondary"></i>
            </div>
            <div className="card-body">
              <div className="fw-bold fs-4">{totalSwimmers}</div>
              <div className="small text-primary">Registered participants</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card h-100">
            <div className="card-header py-2 d-flex align-items-center justify-content-between">
              <span className="small fw-medium">Leading House</span>
              <i className="bi bi-stopwatch text-secondary"></i>
            </div>
            <div className="card-body">
              <div className="fw-bold fs-4">{houseScores[0]?.house_name || 'TBD'}</div>
              <div className="small text-secondary">{houseScores[0]?.total_points || 0} points</div>
            </div>
          </div>
        </div>
      </div>

      {/* House Standings */}
      <div className="card">
        <div className="card-header">
          <span className="fw-semibold">Current House Standings</span>
          <div className="small text-body-secondary">Live points tally across all events</div>
        </div>
        <div className="card-body d-grid gap-2">
          {houseScores.map((house, index) => (
            <div key={house.house_id} className="d-flex align-items-center justify-content-between p-3 border rounded-2">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold text-secondary">#{index + 1}</span>
                <div className="rounded-circle" style={{ width: 12, height: 12, backgroundColor: house.house_color }} />
                <span className="fw-semibold">{house.house_name}</span>
              </div>
              <div className="text-end">
                <div className="fw-bold fs-5">{house.total_points}</div>
                <div className="small text-primary">points</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="card">
        <div className="card-header">
          <span className="fw-semibold">Upcoming Events</span>
          <div className="small text-body-secondary">Next events in the competition schedule</div>
        </div>
        <div className="card-body d-grid gap-2">
          {events.slice(0, 5).map((event) => (
            <div key={event.id} className="d-flex align-items-center justify-content-between p-3 border rounded-2">
              <div>
                <div className="fw-medium">{event.name}</div>
                <div className="small text-primary">{event.category} • {event.distance} • {event.age_group}</div>
              </div>
              <span className={`badge ${event.is_active ? 'text-bg-primary' : 'text-bg-secondary'}`}>
                {event.is_active ? 'Active' : 'Scheduled'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
