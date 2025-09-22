"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Save, Clock } from "lucide-react"
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

export function ResultsEntry() {
  const [events, setEvents] = useState<Event[]>([])
  const [swimmers, setSwimmers] = useState<Swimmer[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [results, setResults] = useState<ResultEntry[]>([])
  const [existingResults, setExistingResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [eventsRes, swimmersRes] = await Promise.all([fetch("/api/events"), fetch("/api/swimmers")])
        const [eventsJson, swimmersJson] = await Promise.all([
          eventsRes.ok ? eventsRes.json() : Promise.resolve([]),
          swimmersRes.ok ? swimmersRes.json() : Promise.resolve([]),
        ])
        setEvents(Array.isArray(eventsJson) ? eventsJson : [])
        setSwimmers(Array.isArray(swimmersJson) ? swimmersJson : [])
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
        return
      }

      try {
        const res = await fetch(`/api/results?event_id=${Number.parseInt(selectedEventId)}`)
        const eventResults: Result[] = res.ok ? await res.json() : []
        setExistingResults(Array.isArray(eventResults) ? eventResults : [])

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
  }, [selectedEventId])

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

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Results Entry</h2>
        <Card>
          <CardContent className="p-6">
            <div>Loading...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Results Entry</h2>
        <Badge variant="secondary">
          <Clock className="mr-1 h-3 w-3" />
          Live Entry
        </Badge>
      </div>

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Event</CardTitle>
          <CardDescription>Choose an event to enter or update results</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an event..." />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id.toString()}>
                  {event.name} ({event.category} - {event.distance})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedEventId && (
        <>
          {/* Existing Results Display */}
          {existingResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Current Results</CardTitle>
                <CardDescription>Saved results for this event</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {existingResults.map((result, index) => (
                    <div key={result.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${getPositionColor(result.position)}`}
                        >
                          {result.position || "DQ"}
                        </div>
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: (result as any).house_color }}
                        />
                        <div>
                          <div className="font-medium">{(result as any).swimmer_name}</div>
                          <div className="text-sm text-muted-foreground">{(result as any).house_name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-lg">{formatTime(result.time_seconds)}</div>
                        <div className="text-sm text-muted-foreground">
                          {result.points} points • {result.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Entry Form */}
          <Card>
            <CardHeader>
              <CardTitle>Enter Results</CardTitle>
              <CardDescription>Add or update swimmer times and statuses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="flex items-end gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label>Swimmer</Label>
                    <Select
                      value={result.swimmer_id.toString()}
                      onValueChange={(value) => updateResult(index, "swimmer_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select swimmer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {swimmers.map((swimmer) => (
                          <SelectItem key={swimmer.id} value={swimmer.id.toString()}>
                            {swimmer.name} ({(swimmer as any).house_name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-20">
                    <Label>Minutes</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={result.time_minutes}
                      onChange={(e) => updateResult(index, "time_minutes", e.target.value)}
                      disabled={result.status !== "completed"}
                    />
                  </div>

                  <div className="w-24">
                    <Label>Seconds</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={result.time_seconds}
                      onChange={(e) => updateResult(index, "time_seconds", e.target.value)}
                      disabled={result.status !== "completed"}
                    />
                  </div>

                  <div className="w-32">
                    <Label>Status</Label>
                    <Select value={result.status} onValueChange={(value) => updateResult(index, "status", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="disqualified">Disqualified</SelectItem>
                        <SelectItem value="did_not_start">Did Not Start</SelectItem>
                        <SelectItem value="did_not_finish">Did Not Finish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button variant="outline" size="icon" onClick={() => removeResult(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <div className="flex gap-2">
                <Button variant="outline" onClick={addSwimmerResult}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Swimmer
                </Button>
                <Button onClick={saveResults} disabled={saving || results.length === 0}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Results"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
