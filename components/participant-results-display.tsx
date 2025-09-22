"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Trophy, Medal, Award, Download, Printer, Search, Filter } from "lucide-react"

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
        return <Trophy className="h-4 w-4 text-yellow-500" />
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />
      default:
        return null
    }
  }

  const getPositionBadge = (position: number) => {
    const suffix = position === 1 ? "st" : position === 2 ? "nd" : position === 3 ? "rd" : "th"
    const variant = position <= 3 ? "default" : "secondary"

    return (
      <Badge
        variant={variant}
        className={`
        ${position === 1 ? "bg-yellow-500 text-white" : ""}
        ${position === 2 ? "bg-gray-400 text-white" : ""}
        ${position === 3 ? "bg-amber-600 text-white" : ""}
        flex items-center gap-1
      `}
      >
        {getPositionIcon(position)}
        {position}
        {suffix}
      </Badge>
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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Participant Results & Rankings</span>
            <div className="flex gap-2">
              <Button onClick={() => exportResults("pdf")} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button onClick={() => exportResults("excel")} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={printResults} variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search participants, events, or houses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.name}>
                    {event.name} - {event.distance}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedHouse} onValueChange={setSelectedHouse}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by house" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Houses</SelectItem>
                {houses.map((house) => (
                  <SelectItem key={house.id} value={house.name}>
                    {house.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>House</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No results found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResults.map((result) => (
                    <TableRow key={result.id} className="hover:bg-gray-50">
                      <TableCell>{getPositionBadge(result.position)}</TableCell>
                      <TableCell className="font-medium">{result.swimmer_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: result.house_color }} />
                          {result.house_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{result.event_name}</div>
                          <div className="text-sm text-gray-500">
                            {result.event_distance} • {result.event_category}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{formatTime(result.time_seconds)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold">
                          {result.points} pts
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={result.status === "completed" ? "default" : "secondary"}
                          className={
                            result.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : result.status === "disqualified"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {result.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(result.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{filteredResults.length}</div>
            <div className="text-sm text-gray-600">Total Results</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {new Set(filteredResults.map((r) => r.event_name)).size}
            </div>
            <div className="text-sm text-gray-600">Events</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(filteredResults.map((r) => r.swimmer_name)).size}
            </div>
            <div className="text-sm text-gray-600">Participants</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {filteredResults.reduce((sum, r) => sum + r.points, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Points</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
