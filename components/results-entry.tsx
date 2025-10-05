"use client"

import { useState, useEffect } from "react"
import { calculatePositionsAndPoints } from "@/lib/scoring"

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

interface Swimmer {
  id: number
  name: string
  house_id: number
  age_group: string
  gender: string
  house_name?: string
  house_color?: string
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

interface ResultEntry {
  swimmer_id: number
  swimmer_name: string
  house_name: string
  house_color: string
  time_minutes: string
  time_seconds: string
  status: "completed" | "disqualified" | "did_not_start" | "did_not_finish"
}

interface HouseRow {
  id: number
  name: string
  color?: string
}

export function ResultsEntry() {
  const [events, setEvents] = useState<Event[]>([])
  const [swimmers, setSwimmers] = useState<Swimmer[]>([])
  const [houses, setHouses] = useState<HouseRow[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [results, setResults] = useState<ResultEntry[]>([])
  const [existingResults, setExistingResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lanes, setLanes] = useState<Record<number, number | "">>({}) // swimmerId -> lane
  const [lanesSaving, setLanesSaving] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [eventsRes, swimmersRes, housesRes] = await Promise.all([fetch("/api/events"), fetch("/api/swimmers"), fetch("/api/houses")])
        const [eventsJson, swimmersJson, housesJson] = await Promise.all([
          eventsRes.ok ? eventsRes.json() : Promise.resolve([]),
          swimmersRes.ok ? swimmersRes.json() : Promise.resolve([]),
          housesRes.ok ? housesRes.json() : Promise.resolve([]),
        ])
        setEvents(Array.isArray(eventsJson) ? eventsJson : [])
        setSwimmers(Array.isArray(swimmersJson) ? swimmersJson : [])
        const normalizedHouses = (Array.isArray(housesJson) ? housesJson : []).map((h: any) => ({ id: Number(h.id ?? h.house_id ?? 0), name: h.house_name ?? h.name ?? "House", color: h.house_color ?? h.color }))
        setHouses(normalizedHouses)
      } catch (error) {
        console.error("Failed to load data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    async function loadEventResults() {
      if (!selectedEventId) {
        setResults([])
        setExistingResults([])
        setLanes({})
        return
      }

      try {
        const res = await fetch(`/api/results?event_id=${Number.parseInt(selectedEventId)}`)
        const eventResults: Result[] = res.ok ? await res.json() : []
        setExistingResults(Array.isArray(eventResults) ? eventResults : [])

        // Load lane assignments for this event
        const lanesRes = await fetch(`/api/lanes?eventId=${Number.parseInt(selectedEventId)}`)
        const lanesJson = lanesRes.ok ? await lanesRes.json() : []
        const lanesMap: Record<number, number | ""> = {}
        for (const row of (Array.isArray(lanesJson) ? lanesJson : [])) {
          lanesMap[Number((row as any).swimmer_id)] = Number((row as any).lane)
        }
        setLanes(lanesMap)

        // Convert existing results to form format
        const formResults: ResultEntry[] = eventResults.map((result) => {
          const totalSeconds = result.time_seconds || 0
          const minutes = Math.floor(totalSeconds / 60)
          const seconds = totalSeconds % 60

          return {
            swimmer_id: result.swimmer_id,
            swimmer_name: (result as any).swimmer_name,
            house_name: (result as any).house_name,
            house_color: (result as any).house_color,
            time_minutes: minutes > 0 ? minutes.toString() : "",
            time_seconds: seconds.toFixed(2),
            status: result.status,
          }
        })
        setResults(formResults)
      } catch (error) {
        console.error("Failed to load event results:", error)
      }
    }

    loadEventResults()
  }, [selectedEventId, houses])

  const addSwimmerResult = () => {
    setResults([
      ...results,
      {
        swimmer_id: 0,
        swimmer_name: "",
        house_name: "",
        house_color: "",
        time_minutes: "",
        time_seconds: "",
        status: "completed",
      },
    ])
  }

  const removeResult = (index: number) => {
    setResults(results.filter((_, i) => i !== index))
  }

  const updateResult = (index: number, field: keyof ResultEntry, value: string) => {
    const newResults = [...results]

    if (field === "swimmer_id") {
      const swimmerId = Number.parseInt(value)
      const swimmer = swimmers.find((s) => s.id === swimmerId)
      if (swimmer) {
        newResults[index] = {
          ...newResults[index],
          swimmer_id: swimmerId,
          swimmer_name: swimmer.name,
          house_name: (swimmer as any).house_name,
          house_color: (swimmer as any).house_color,
        }
      }
    } else {
      newResults[index] = { ...newResults[index], [field]: value }
    }

    setResults(newResults)
  }

  const saveResults = async () => {
    if (!selectedEventId || results.length === 0) return

    setSaving(true)
    try {
      // Calculate total time in seconds for each result
      const processedResults = results
        .map((result) => {
          const minutes = Number.parseFloat(result.time_minutes) || 0
          const seconds = Number.parseFloat(result.time_seconds) || 0
          const totalSeconds = minutes * 60 + seconds

          return {
            swimmer_id: result.swimmer_id,
            time_seconds: result.status === "completed" ? totalSeconds : null,
            status: result.status,
          }
        })
        .filter((result) => result.swimmer_id > 0)

      // Calculate positions and points using the scoring logic
      const resultsWithScoring = calculatePositionsAndPoints(processedResults)

      // Save to database
      await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: Number.parseInt(selectedEventId),
          results: resultsWithScoring,
        }),
      })

      // Reload results to show updated data
      const res = await fetch(`/api/results?event_id=${Number.parseInt(selectedEventId)}`)
      const refreshed: Result[] = res.ok ? await res.json() : []
      setExistingResults(Array.isArray(refreshed) ? refreshed : [])

      alert("Results saved successfully!")
    } catch (error) {
      console.error("Failed to save results:", error)
      alert("Failed to save results. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const formatTime = (timeSeconds: number | null) => {
    if (!timeSeconds) return "N/A"
    const minutes = Math.floor(timeSeconds / 60)
    const seconds = (timeSeconds % 60).toFixed(2)
    return minutes > 0 ? `${minutes}:${seconds.padStart(5, "0")}` : `${seconds}s`
  }

  const getPositionColor = (position: number | null) => {
    if (!position) return "bg-muted"
    if (position === 1) return "bg-yellow-500"
    if (position === 2) return "bg-gray-400"
    if (position === 3) return "bg-amber-600"
    return "bg-muted"
  }

  // Update a single swimmer's lane locally, ensuring uniqueness per event
  const updateLane = (swimmerId: number, value: string) => {
    setLanes((prev) => {
      const next: Record<number, number | ""> = { ...prev }
      if (value === "") {
        next[swimmerId] = ""
        return next
      }
      const lane = Number.parseInt(value)
      if (!Number.isFinite(lane) || lane < 1 || lane > 10) {
        return next
      }
      // Clear this lane from any other house to keep lanes unique client-side
      for (const [hid, l] of Object.entries(next)) {
        if (Number(hid) !== swimmerId && l === lane) {
          next[Number(hid)] = ""
        }
      }
      next[swimmerId] = lane
      return next
    })
  }

  // Persist lane assignments for the selected event
  const saveLanes = async () => {
    if (!selectedEventId) return
    setLanesSaving(true)
    try {
      const assignments = Object.entries(lanes)
        .filter(([, l]) => typeof l === "number" && (l as number) >= 1 && (l as number) <= 10)
        .map(([sid, l]) => ({ swimmerId: Number(sid), lane: l as number }))

      // Validate uniqueness before sending
      const seen = new Set<number>()
      for (const a of assignments) {
        if (seen.has(a.lane)) {
          alert("Duplicate lane assignments found. Each lane must be unique.")
          setLanesSaving(false)
          return
        }
        seen.add(a.lane)
      }

      const res = await fetch("/api/lanes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: Number.parseInt(selectedEventId),
          assignments,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err.error || `Failed to save lanes (${res.status})`)
      }

      alert("Lanes saved successfully!")
    } catch (error) {
      console.error("Failed to save lanes:", error)
      alert((error as Error).message || "Failed to save lanes. Please try again.")
    } finally {
      setLanesSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="d-grid gap-3">
        <h2 className="h4 m-0">Results Entry</h2>
        <div className="card">
          <div className="card-body">
            <div>Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="d-grid gap-3">
      <div className="d-flex align-items-center justify-content-between">
        <h2 className="h4 m-0">Results Entry</h2>
        <span className="badge text-bg-secondary d-inline-flex align-items-center gap-1">
          <i className="bi bi-clock"></i>
          Live Entry
        </span>
      </div>

      {/* Event Selection */}
      <div className="card">
        <div className="card-header">
          <div className="fw-semibold">Select Event</div>
          <div className="text-body-secondary small">Choose an event to enter or update results</div>
        </div>
        <div className="card-body">
          <select
            className="form-select"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            <option value="">Select an event...</option>
            {events.map((event) => (
              <option key={event.id} value={event.id.toString()}>
                {event.name} ({event.category} - {event.distance})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedEventId && (
        <>
          {/* Lanes Assignment (per swimmer) */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-semibold">Lanes Assignment</div>
                <div className="text-body-secondary small">Assign lanes (1–10) to swimmers for this event</div>
              </div>
              <button type="button" className="btn btn-sm btn-primary" onClick={saveLanes} disabled={lanesSaving}>
                <i className="bi bi-save me-1"></i>
                {lanesSaving ? 'Saving...' : 'Save Lanes'}
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Swimmer</th>
                      <th>House</th>
                      <th style={{width: 140}}>Lane (1–10)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      // Prefer current form entries; else fall back to existing results
                      (results.filter(r => r.swimmer_id > 0).length > 0
                        ? results.filter(r => r.swimmer_id > 0).map(r => ({
                            swimmer_id: r.swimmer_id,
                            swimmer_name: r.swimmer_name,
                            house_name: r.house_name,
                            house_color: r.house_color,
                          }))
                        : existingResults.map((res: any) => ({
                            swimmer_id: res.swimmer_id,
                            swimmer_name: res.swimmer_name,
                            house_name: res.house_name,
                            house_color: res.house_color,
                          }))
                      )
                    ).map((s) => (
                      <tr key={s.swimmer_id}>
                        <td className="fw-semibold">{s.swimmer_name}</td>
                        <td>
                          <span className="badge" style={{ backgroundColor: s.house_color || '#6c757d', color: 'var(--bs-body-bg)' }}>{s.house_name}</span>
                        </td>
                        <td>
                          <select className="form-select form-select-sm" value={(lanes[s.swimmer_id] ?? "").toString()} onChange={(e) => updateLane(s.swimmer_id, e.target.value)}>
                            <option value="">Unassigned</option>
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n.toString()}>{n}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* Existing Results Display */}
          {existingResults.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="fw-semibold">Current Results</div>
                <div className="text-body-secondary small">Saved results for this event</div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th scope="col">Pos</th>
                        <th scope="col">Swimmer</th>
                        <th scope="col">House</th>
                        <th scope="col">Time</th>
                        <th scope="col">Points</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {existingResults.map((result) => (
                        <tr key={result.id}>
                          <td>
                            <span className="badge text-bg-secondary">
                              {result.position || "DQ"}
                            </span>
                          </td>
                          <td className="fw-semibold">{(result as any).swimmer_name}</td>
                          <td>
                            <span className="badge" style={{ backgroundColor: (result as any).house_color, color: 'var(--bs-body-bg)' }}>
                              {(result as any).house_name}
                            </span>
                          </td>
                          <td className="font-monospace">{formatTime(result.time_seconds)}</td>
                          <td className="fw-bold">{result.points}</td>
                          <td>
                            <span className="text-primary small text-uppercase">{result.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Results Entry Form */}
          <div className="card">
            <div className="card-header">
              <div className="fw-semibold">Enter Results</div>
              <div className="text-body-secondary small">Add or update swimmer times and statuses</div>
            </div>
            <div className="card-body d-grid gap-3">
              {results.map((result, index) => (
                <div key={index} className="row g-3 align-items-end border rounded-2 p-3">
                  <div className="col-12 col-md">
                    <label className="form-label">Swimmer</label>
                    <select
                      className="form-select"
                      value={result.swimmer_id.toString()}
                      onChange={(e) => updateResult(index, "swimmer_id", e.target.value)}
                    >
                      <option value="0">Select swimmer...</option>
                      {swimmers.map((swimmer) => (
                        <option key={swimmer.id} value={swimmer.id.toString()}>
                          {swimmer.name} ({(swimmer as any).house_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-6 col-md-2">
                    <label className="form-label">Minutes</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0"
                      value={result.time_minutes}
                      onChange={(e) => updateResult(index, "time_minutes", e.target.value)}
                      disabled={result.status !== "completed"}
                    />
                  </div>

                  <div className="col-6 col-md-2">
                    <label className="form-label">Seconds</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="0.00"
                      value={result.time_seconds}
                      onChange={(e) => updateResult(index, "time_seconds", e.target.value)}
                      disabled={result.status !== "completed"}
                    />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={result.status}
                      onChange={(e) => updateResult(index, "status", e.target.value)}
                    >
                      <option value="completed">Completed</option>
                      <option value="disqualified">Disqualified</option>
                      <option value="did_not_start">Did Not Start</option>
                      <option value="did_not_finish">Did Not Finish</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-auto d-flex gap-2">
                    <button type="button" className="btn btn-outline-danger" onClick={() => removeResult(index)} title="Remove">
                      <i className="bi bi-trash me-1"></i> Remove
                    </button>
                  </div>
                </div>
              ))}

              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={addSwimmerResult}>
                  <i className="bi bi-plus-circle me-1"></i>
                  Add Swimmer
                </button>
                <button type="button" className="btn btn-primary" onClick={saveResults} disabled={saving || results.length === 0}>
                  <i className="bi bi-save me-1"></i>
                  {saving ? "Saving..." : "Save Results"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
