"use client"

import { useState, useEffect } from "react"

// Local types to avoid importing server-only code
interface Event {
  id: number
  name: string
  category: string
  distance: string
  gender: "male" | "female" | "mixed"
  age_group: string
  max_participants_per_house: number
  is_active: boolean
  event_order: number
}

interface Result {
  id: number
  event_id: number
  swimmer_id: number
  time_seconds: number | null
  status: "completed" | "disqualified" | "did_not_start" | "did_not_finish"
  position: number | null
  points: number
}

interface HouseScore {
  house_id: number
  house_name: string
  house_color: string
  total_points: number
}

export function LiveScoreboard() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("overall")
  const [eventResults, setEventResults] = useState<Result[]>([])
  const [houseScores, setHouseScores] = useState<HouseScore[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const loadData = async () => {
    try {
      const [eventsRes, housesRes] = await Promise.all([fetch("/api/events"), fetch("/api/houses")])
      const [eventsJson, housesJson] = await Promise.all([
        eventsRes.ok ? eventsRes.json() : Promise.resolve([]),
        housesRes.ok ? housesRes.json() : Promise.resolve([]),
      ])
      const eventsData: Event[] = Array.isArray(eventsJson) ? eventsJson : []
      const housesData: any[] = Array.isArray(housesJson) ? housesJson : []
      setEvents(eventsData)
      // Map houses to HouseScore
      setHouseScores(
        housesData.map((h) => ({
          house_id: h.id,
          house_name: h.name,
          house_color: h.color,
          total_points: Number(h.total_points || 0),
        }))
      )

      if (selectedEventId !== "overall" && selectedEventId) {
        const res = await fetch(`/api/results?event_id=${Number.parseInt(selectedEventId)}`)
        const results: Result[] = res.ok ? await res.json() : []
        setEventResults(Array.isArray(results) ? results : [])
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error("Failed to load scoreboard data:", error)
    }
  }

  useEffect(() => {
    loadData().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedEventId === "overall") {
      setEventResults([])
      return
    }

    if (selectedEventId) {
      fetch(`/api/results?event_id=${Number.parseInt(selectedEventId)}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setEventResults(Array.isArray(data) ? data : []))
        .catch(console.error)
    }
  }, [selectedEventId])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData()
    }, 30000)

    return () => clearInterval(interval)
  }, [selectedEventId])

  const refreshData = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const formatTime = (timeSeconds: number | null) => {
    if (!timeSeconds) return "N/A"
    const minutes = Math.floor(timeSeconds / 60)
    const seconds = (timeSeconds % 60).toFixed(2)
    return minutes > 0 ? `${minutes}:${seconds.padStart(5, "0")}` : `${seconds}s`
  }

  const getPositionBadge = (position: number | null) => {
    if (!position) return <span className="badge text-bg-secondary">DQ</span>
    if (position === 1) return <span className="badge text-bg-warning">1st</span>
    if (position === 2) return <span className="badge text-bg-secondary">2nd</span>
    if (position === 3) return <span className="badge text-bg-warning">3rd</span>
    return <span className="badge text-bg-light">{position}th</span>
  }

  const getHousePositionIcon = (index: number) => {
    if (index === 0) return <i className="bi bi-trophy text-warning"></i>
    if (index === 1) return <i className="bi bi-award text-secondary"></i>
    if (index === 2) return <i className="bi bi-award text-warning"></i>
    return <span className="fw-bold text-primary">#{index + 1}</span>
  }

  if (loading) {
    return (
      <div className="d-grid gap-3">
        <h2 className="h4 m-0">Live Scoreboard</h2>
        <div className="card">
          <div className="card-body d-flex align-items-center justify-content-center">
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Loading scoreboard...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="d-grid gap-3">
      <div className="d-flex align-items-center justify-content-between">
        <h2 className="h4 m-0">Live Scoreboard</h2>
        <div className="d-flex align-items-center gap-2">
          <span className="badge text-bg-secondary d-inline-flex align-items-center gap-1">
            <i className="bi bi-eye"></i> Live
          </span>
          <button className="btn btn-outline-secondary btn-sm" onClick={refreshData} disabled={refreshing}>
            <i className={`bi bi-arrow-clockwise me-2 ${refreshing ? 'spinner-border spinner-border-sm' : ''}`}></i>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* View Selection */}
      <div className="card">
        <div className="card-header">
          <div className="fw-semibold">Scoreboard View</div>
          <div className="small text-body-secondary">Last updated: {lastUpdated.toLocaleTimeString()}</div>
        </div>
        <div className="card-body">
          <select className="form-select" value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
            <option value="overall">Overall House Standings</option>
            {events.map((event) => (
              <option key={event.id} value={event.id.toString()}>{event.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedEventId === "overall" ? (
        <div className="card">
          <div className="card-header d-flex align-items-center gap-2">
            <i className="bi bi-trophy"></i>
            <span className="fw-semibold">Overall House Standings</span>
            <span className="ms-auto small text-body-secondary">Total points across all completed events</span>
          </div>
          <div className="card-body d-grid gap-3">
            {houseScores.map((house, index) => (
              <div key={house.house_id} className={`d-flex align-items-center justify-content-between p-3 border rounded-2 ${index === 0 ? 'border-warning bg-warning-subtle' : ''}`}>
                <div className="d-flex align-items-center gap-3">
                  {getHousePositionIcon(index)}
                  <div className="rounded-circle border border-white" style={{ width: 24, height: 24, backgroundColor: house.house_color }} />
                  <div>
                    <div className={`fw-bold ${index === 0 ? '' : ''}`}>{house.house_name}</div>
                    <div className={`small ${index === 0 ? '' : 'text-primary'}`}>
                      {index === 0 ? 'Leading House' : `${index + 1}${index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'} Place`}
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <div className={`fw-bold fs-4 ${index === 0 ? '' : 'text-primary'}`}>{house.total_points}</div>
                  <div className={`small ${index === 0 ? '' : 'text-primary'}`}>points</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header d-flex align-items-center gap-2">
            <i className="bi bi-stopwatch"></i>
            <span className="fw-semibold">{events.find((e) => e.id.toString() === selectedEventId)?.name}</span>
            <span className="ms-auto small text-body-secondary">{eventResults.length > 0 ? 'Event completed' : 'No results yet'}</span>
          </div>
          <div className="card-body">
            {eventResults.length > 0 ? (
              <div className="d-grid gap-2">
                {eventResults.map((result) => (
                  <div key={result.id} className={`d-flex align-items-center justify-content-between p-3 border rounded-2 ${result.position === 1 ? 'border-warning bg-warning-subtle' : ''}`}>
                    <div className="d-flex align-items-center gap-3">
                      {getPositionBadge(result.position)}
                      <div className="rounded-circle" style={{ width: 12, height: 12, backgroundColor: (result as any).house_color }} />
                      <div>
                        <div className="fw-semibold">{(result as any).swimmer_name}</div>
                        <div className="small text-primary">{(result as any).house_name}</div>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="font-monospace fw-bold fs-5">{formatTime(result.time_seconds)}</div>
                      <div className="small text-primary">{result.points} points • {result.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 text-primary">
                <i className="bi bi-stopwatch fs-1 opacity-50"></i>
                <p className="m-0">No results available for this event yet.</p>
                <p className="small m-0">Results will appear here once they are entered.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="row g-3">
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between py-2">
              <span className="small fw-medium">Total Events</span>
            </div>
            <div className="card-body">
              <div className="fw-bold fs-4">{events.length}</div>
              <div className="small text-primary">Competition events</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between py-2">
              <span className="small fw-medium">Leading House</span>
              <i className="bi bi-trophy text-primary"></i>
            </div>
            <div className="card-body">
              <div className="fw-bold fs-4">{houseScores[0]?.house_name || 'TBD'}</div>
              <div className="small text-primary">{houseScores[0]?.total_points || 0} points</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between py-2">
              <span className="small fw-medium">Point Difference</span>
              <i className="bi bi-award text-primary"></i>
            </div>
            <div className="card-body">
              <div className="fw-bold fs-4">{houseScores.length >= 2 ? houseScores[0].total_points - houseScores[1].total_points : 0}</div>
              <div className="small text-primary">1st to 2nd place</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
