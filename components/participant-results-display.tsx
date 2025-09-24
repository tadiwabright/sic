"use client"

import { useState, useEffect } from "react"

interface ParticipantResult {
  id: number
  swimmer_name: string
  house_name: string
  house_color: string
  event_name: string
  event_distance: string
  event_category: string
  position: number
  time_seconds: number
  points: number
  status: string
  created_at: string
}

interface TieGroup {
  position: number
  participants: ParticipantResult[]
}

export default function ParticipantResultsDisplay() {
  const [results, setResults] = useState<ParticipantResult[]>([])
  const [filteredResults, setFilteredResults] = useState<ParticipantResult[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<string>("all")
  const [selectedHouse, setSelectedHouse] = useState<string>("all")
  const [events, setEvents] = useState<any[]>([])
  const [houses, setHouses] = useState<any[]>([])

  useEffect(() => {
    fetchResults()
    fetchEvents()
    fetchHouses()
  }, [])

  useEffect(() => {
    filterResults()
  }, [results, searchTerm, selectedEvent, selectedHouse])

  const fetchResults = async () => {
    try {
      const response = await fetch("/api/participant-results")
      if (response.ok) {
        const data = await response.json()
        setResults(data)
      }
    } catch (error) {
      console.error("Error fetching results:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events")
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error("Error fetching events:", error)
    }
  }

  const fetchHouses = async () => {
    try {
      const response = await fetch("/api/houses")
      if (response.ok) {
        const data = await response.json()
        setHouses(data)
      }
    } catch (error) {
      console.error("Error fetching houses:", error)
    }
  }

  const filterResults = () => {
    let filtered = results

    if (searchTerm) {
      filtered = filtered.filter(
        (result) =>
          result.swimmer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.house_name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedEvent !== "all") {
      filtered = filtered.filter((result) => result.event_name === selectedEvent)
    }

    if (selectedHouse !== "all") {
      filtered = filtered.filter((result) => result.house_name === selectedHouse)
    }

    setFilteredResults(filtered)
  }

  const formatTime = (seconds: number) => {
    if (!seconds) return "N/A"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = (seconds % 60).toFixed(2)
    return minutes > 0 ? `${minutes}:${remainingSeconds.padStart(5, "0")}` : `${remainingSeconds}s`
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <i className="bi bi-trophy text-warning"></i>
      case 2:
        return <i className="bi bi-award text-secondary"></i>
      case 3:
        return <i className="bi bi-award text-warning"></i>
      default:
        return null
    }
  }

  const getPositionBadge = (position: number) => {
    const suffix = position === 1 ? "st" : position === 2 ? "nd" : position === 3 ? "rd" : "th"
    let cls = "badge text-bg-light d-inline-flex align-items-center gap-1"
    if (position === 1) cls = "badge text-bg-warning d-inline-flex align-items-center gap-1"
    if (position === 2) cls = "badge text-bg-secondary d-inline-flex align-items-center gap-1"
    if (position === 3) cls = "badge text-bg-warning d-inline-flex align-items-center gap-1"
    return (
      <span className={cls}>
        {getPositionIcon(position)} {position}
        {suffix}
      </span>
    )
  }

  // Group results by event and position to handle ties
  const groupResultsByEventAndPosition = (eventResults: ParticipantResult[]) => {
    const grouped: { [key: string]: TieGroup[] } = {}

    eventResults.forEach((result) => {
      const eventKey = `${result.event_name}-${result.event_distance}`
      if (!grouped[eventKey]) {
        grouped[eventKey] = []
      }

      let tieGroup = grouped[eventKey].find((group) => group.position === result.position)
      if (!tieGroup) {
        tieGroup = { position: result.position, participants: [] }
        grouped[eventKey].push(tieGroup)
      }

      tieGroup.participants.push(result)
    })

    // Sort tie groups by position
    Object.keys(grouped).forEach((eventKey) => {
      grouped[eventKey].sort((a, b) => a.position - b.position)
    })

    return grouped
  }

  const exportResults = async (format: "pdf" | "excel") => {
    try {
      const response = await fetch(`/api/export-results?format=${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: filteredResults }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `participant-results.${format === "pdf" ? "pdf" : "xlsx"}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting results:", error)
    }
  }

  const printResults = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center p-4">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    )
  }

  return (
    <div className="d-grid gap-3">
      {/* Header and Controls */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <span className="fw-semibold">Participant Results & Rankings</span>
          <div className="d-flex gap-2">
            <button onClick={() => exportResults('pdf')} className="btn btn-outline-secondary btn-sm"><i className="bi bi-download me-1"></i>Export PDF</button>
            <button onClick={() => exportResults('excel')} className="btn btn-outline-secondary btn-sm"><i className="bi bi-download me-1"></i>Export Excel</button>
            <button onClick={printResults} className="btn btn-outline-secondary btn-sm"><i className="bi bi-printer me-1"></i>Print</button>
          </div>
        </div>
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md">
              <div className="position-relative">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                <input className="form-control ps-5" placeholder="Search participants, events, or houses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="col-6 col-md-auto">
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-funnel"></i></span>
                <select className="form-select" style={{ minWidth: 200 }} value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
                  <option value="all">All Events</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.name}>{event.name} - {event.distance}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-6 col-md-auto">
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-funnel"></i></span>
                <select className="form-select" style={{ minWidth: 200 }} value={selectedHouse} onChange={(e) => setSelectedHouse(e.target.value)}>
                  <option value="all">All Houses</option>
                  {houses.map((house) => (
                    <option key={house.id} value={house.name}>{house.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col">Position</th>
                  <th scope="col">Participant</th>
                  <th scope="col">House</th>
                  <th scope="col">Event</th>
                  <th scope="col">Time</th>
                  <th scope="col">Points</th>
                  <th scope="col">Status</th>
                  <th scope="col">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-secondary">No results found matching your criteria</td>
                  </tr>
                ) : (
                  filteredResults.map((result) => (
                    <tr key={result.id}>
                      <td>{getPositionBadge(result.position)}</td>
                      <td className="fw-semibold">{result.swimmer_name}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="rounded-circle" style={{ width: 10, height: 10, backgroundColor: result.house_color, display: 'inline-block' }} />
                          {result.house_name}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="fw-medium">{result.event_name}</div>
                          <div className="small text-secondary">{result.event_distance} • {result.event_category}</div>
                        </div>
                      </td>
                      <td className="font-monospace">{formatTime(result.time_seconds)}</td>
                      <td><span className="badge text-bg-light fw-bold">{result.points} pts</span></td>
                      <td>
                        <span className={`badge ${result.status === 'completed' ? 'text-bg-success' : result.status === 'disqualified' ? 'text-bg-danger' : 'text-bg-warning'}`}>
                          {result.status}
                        </span>
                      </td>
                      <td className="small text-secondary">{new Date(result.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="row g-3">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="fw-bold fs-4 text-primary">{filteredResults.length}</div>
              <div className="small text-secondary">Total Results</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="fw-bold fs-4 text-success">{new Set(filteredResults.map((r) => r.event_name)).size}</div>
              <div className="small text-secondary">Events</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="fw-bold fs-4 text-warning">{new Set(filteredResults.map((r) => r.swimmer_name)).size}</div>
              <div className="small text-secondary">Participants</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="fw-bold fs-4 text-info">{filteredResults.reduce((sum, r) => sum + r.points, 0)}</div>
              <div className="small text-secondary">Total Points</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
