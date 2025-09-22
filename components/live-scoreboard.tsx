"use client"

import { Calendar } from "@/components/ui/calendar"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Medal, Clock, RefreshCw, Eye } from "lucide-react"

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
    if (!position) return <Badge variant="secondary">DQ</Badge>
    if (position === 1) return <Badge className="bg-yellow-500 text-white">1st</Badge>
    if (position === 2) return <Badge className="bg-gray-400 text-white">2nd</Badge>
    if (position === 3) return <Badge className="bg-amber-600 text-white">3rd</Badge>
    return <Badge variant="outline">{position}th</Badge>
  }

  const getHousePositionIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />
    if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />
    if (index === 2) return <Medal className="h-6 w-6 text-amber-600" />
    return (
      <div className="h-6 w-6 flex items-center justify-center text-lg font-bold text-muted-foreground">
        #{index + 1}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Live Scoreboard</h2>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading scoreboard...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Live Scoreboard</h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            <Eye className="mr-1 h-3 w-3" />
            Live
          </Badge>
          <Button variant="outline" size="sm" onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* View Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Scoreboard View</CardTitle>
          <CardDescription>Last updated: {lastUpdated.toLocaleTimeString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall">Overall House Standings</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id.toString()}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedEventId === "overall" ? (
        /* Overall House Standings */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Overall House Standings
            </CardTitle>
            <CardDescription>Total points across all completed events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {houseScores.map((house, index) => (
                <div
                  key={house.house_id}
                  className={`flex items-center justify-between p-6 rounded-lg border-2 transition-all ${
                    index === 0 ? "border-yellow-500 bg-yellow-50" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {getHousePositionIcon(index)}
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                      style={{ backgroundColor: house.house_color }}
                    />
                    <div>
                      <div className="text-xl font-bold">{house.house_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {index === 0
                          ? "Leading House"
                          : `${index + 1}${index === 1 ? "nd" : index === 2 ? "rd" : "th"} Place`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">{house.total_points}</div>
                    <div className="text-sm text-muted-foreground">points</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Individual Event Results */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {events.find((e) => e.id.toString() === selectedEventId)?.name}
            </CardTitle>
            <CardDescription>{eventResults.length > 0 ? "Event completed" : "No results yet"}</CardDescription>
          </CardHeader>
          <CardContent>
            {eventResults.length > 0 ? (
              <div className="space-y-3">
                {eventResults.map((result, index) => (
                  <div
                    key={result.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                      result.position === 1 ? "border-yellow-500 bg-yellow-50" : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {getPositionBadge(result.position)}
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: (result as any).house_color }} />
                      <div>
                        <div className="font-semibold text-lg">{(result as any).swimmer_name}</div>
                        <div className="text-sm text-muted-foreground">{(result as any).house_name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xl font-bold">{formatTime(result.time_seconds)}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.points} points • {result.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No results available for this event yet.</p>
                <p className="text-sm">Results will appear here once they are entered.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">Competition events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leading House</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{houseScores[0]?.house_name || "TBD"}</div>
            <p className="text-xs text-muted-foreground">{houseScores[0]?.total_points || 0} points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Point Difference</CardTitle>
            <Medal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {houseScores.length >= 2 ? houseScores[0].total_points - houseScores[1].total_points : 0}
            </div>
            <p className="text-xs text-muted-foreground">1st to 2nd place</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
