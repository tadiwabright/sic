"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Users, Calendar, Timer } from "lucide-react"
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
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const activeEvents = events.filter((event) => event.is_active).length
  const totalSwimmers = swimmers.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <Badge variant="secondary" className="bg-accent text-accent-foreground">
          Competition Active
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Houses</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{houses.length}</div>
            <p className="text-xs text-muted-foreground">Competing houses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEvents}</div>
            <p className="text-xs text-muted-foreground">of {events.length} total events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Swimmers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSwimmers}</div>
            <p className="text-xs text-muted-foreground">Registered participants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leading House</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{houseScores[0]?.house_name || "TBD"}</div>
            <p className="text-xs text-muted-foreground">{houseScores[0]?.total_points || 0} points</p>
          </CardContent>
        </Card>
      </div>

      {/* House Standings */}
      <Card>
        <CardHeader>
          <CardTitle>Current House Standings</CardTitle>
          <CardDescription>Live points tally across all events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {houseScores.map((house, index) => (
              <div key={house.house_id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: house.house_color }} />
                    <span className="font-semibold">{house.house_name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{house.total_points}</div>
                  <div className="text-sm text-muted-foreground">points</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Next events in the competition schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium">{event.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {event.category} • {event.distance} • {event.age_group}
                  </div>
                </div>
                <Badge variant={event.is_active ? "default" : "secondary"}>
                  {event.is_active ? "Active" : "Scheduled"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
