"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Medal, Download, RefreshCw, Table, Grid } from "lucide-react"
import ThemeToggle from "@/components/theme-toggle"
import GradientText from "@/components/GradientText"
import LiquidChrome from "@/components/LiquidChrome"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SwimmerResult {
  swimmer_name: string
  house_name: string
  house_color: string
  event_name: string
  position: number | null
  points: number
  time_seconds: number | null
  status: string
}

interface EventItem {
  id: number
  name: string
  category: string
  distance: string
  gender: string
  age_group: string
}

// Fallback palette used when a house has no color from the API
const HOUSE_PALETTE = ['#E53935', '#1E88E5', '#43A047', '#FDD835']

// Map house names to brand colors to ensure consistent visuals
function resolveHouseColor(houseName: string | undefined, fallback?: string): string {
  const name = (houseName || '').trim().toLowerCase()
  if (name.includes('red')) return '#E53935' // Red
  if (name.includes('green')) return '#43A047' // Green
  if (name.includes('yellow')) return '#FDD835' // Yellow
  if (name.includes('blue')) return '#1E88E5' // Blue
  return fallback || '#6c757d'
}

interface HouseTotal {
  house_name: string
  house_color: string
  total_points: number
  rank: number
}

// Compute readable text color (black/white) based on background color for contrast
function getReadableTextColor(bgColor: string | undefined): string {
  if (!bgColor) return '#000';
  // Normalize to hex
  let c = bgColor.trim();
  // Support rgb(a) strings
  if (c.startsWith('rgb')) {
    const nums = c.match(/\d+\.?\d*/g)?.map(Number) || [255, 255, 255]
    const [r, g, b] = nums
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.58 ? '#000' : '#fff'
  }
  if (c.startsWith('#')) {
    if (c.length === 4) {
      c = `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`
    }
    const r = parseInt(c.slice(1, 3), 16)
    const g = parseInt(c.slice(3, 5), 16)
    const b = parseInt(c.slice(5, 7), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.58 ? '#000' : '#fff'
  }
  // Fallback to black text
  return '#000'
}

export function EnhancedScoreboard() {
  const [results, setResults] = useState<SwimmerResult[]>([])
  const [houseTotals, setHouseTotals] = useState<HouseTotal[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [showDetailed, setShowDetailed] = useState<boolean>(true)
  const [events, setEvents] = useState<EventItem[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("all")
  // Derive filtered results by event selection; results contain event_name
  const filtered = selectedEventId === 'all'
    ? results
    : results.filter(r => (r.event_name || '').toString() === selectedEventId)

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch detailed results with swimmer names
      const resultsResponse = await fetch('/api/participant-results')
      if (!resultsResponse.ok) {
        throw new Error(`Failed to fetch results: ${resultsResponse.status} ${resultsResponse.statusText}`)
      }
      let resultsData: unknown
      try {
        resultsData = await resultsResponse.json()
      } catch (e) {
        console.error('Failed to parse results JSON', e)
        resultsData = []
      }
      
      // Fetch house totals
      const housesResponse = await fetch('/api/houses')
      if (!housesResponse.ok) {
        throw new Error(`Failed to fetch houses: ${housesResponse.status} ${housesResponse.statusText}`)
      }
      let housesData: unknown
      try {
        housesData = await housesResponse.json()
      } catch (e) {
        console.error('Failed to parse houses JSON', e)
        housesData = []
      }
      
      const normalizedResults = Array.isArray(resultsData) ? resultsData : []
      const normalizedHouses = Array.isArray(housesData) ? housesData : []

      setResults(normalizedResults as SwimmerResult[])
      // Normalize houses to the shape the UI expects so names/colors are correct
      const normalizedHouseTotals: HouseTotal[] = (normalizedHouses as any[]).map((h, index) => ({
        house_name: h.house_name ?? h.name ?? "House",
        house_color: h.house_color ?? h.color ?? "#6c757d",
        total_points: Number(h.total_points ?? 0),
        rank: index + 1,
      }))
      setHouseTotals(normalizedHouseTotals)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching scoreboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Load events for filtering
    fetch('/api/events')
      .then(r => r.ok ? r.json() : [])
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setEvents(list as EventItem[])
      })
      .catch(() => setEvents([]))
    
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = (seconds % 60).toFixed(2)
    return minutes > 0 ? `${minutes}:${remainingSeconds.padStart(5, '0')}` : `${remainingSeconds}s`
  }

  const getPositionDisplay = (position: number | null, status: string) => {
    if (status === 'disqualified') return 'DQ'
    if (status === 'did_not_start') return 'DNS'
    if (status === 'did_not_finish') return 'DNF'
    if (!position) return '-'
    
    const suffix = position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'
    return `${position}${suffix}`
  }

  const exportResults = async () => {
    try {
      const response = await fetch('/api/export-results')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `swimming-results-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting results:', error)
    }
  }

  return (
    <div className="relative min-h-screen scoreboard-swim-bg p-6">
     
      
      {/* content container with readable overlay */}
      <div className="relative z-10 max-w-7xl mx-auto rounded-xl bg-white/80 dark:bg-black/50 backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10">
        {/* Header */}
        <div className="text-center mb-8 p-6 animate-fade-in">
          <div className="flex items-center justify-between max-w-4xl mx-auto mb-2">
            <div />
            <ThemeToggle />
            {/* Scoped styles for water-flow animated select */}
      <style jsx>{`
        .water-trigger {
          position: relative;
          border: 2px solid transparent;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.75), rgba(255,255,255,0.55)) padding-box,
            linear-gradient(120deg, #40ffaa, #4079ff, #40ffaa) border-box;
          box-shadow:
            0 2px 12px rgba(64,121,255,0.25),
            inset 0 0 20px rgba(64,121,255,0.1);
          transition: box-shadow 300ms ease, transform 300ms ease;
          overflow: hidden;
          z-index: 0; /* allow overlay pseudo-element as background layer */
        }
        /* ensure trigger content sits above the animated overlay */
        .water-trigger > * { position: relative; z-index: 1; }
        :global(.dark) .water-trigger {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.06)) padding-box,
            linear-gradient(120deg, #40ffaa, #4079ff, #40ffaa) border-box;
          box-shadow:
            0 2px 14px rgba(64,255,170,0.15),
            inset 0 0 24px rgba(64,121,255,0.12);
        }
        .water-trigger::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: repeating-linear-gradient(
            135deg,
            rgba(64,121,255,0.18) 0 14px,
            rgba(64,255,170,0.18) 14px 28px
          );
          mix-blend-mode: overlay;
          opacity: 0.7;
          animation: waterFlow 6s linear infinite;
          pointer-events: none;
          z-index: 0; /* keep behind text */
        }
        .water-trigger:hover {
          transform: translateY(-1px);
          box-shadow:
            0 6px 18px rgba(64,121,255,0.35),
            inset 0 0 28px rgba(64,121,255,0.14);
        }
        @keyframes waterFlow {
          from { background-position: 0 0; }
          to { background-position: 240px 0; }
        }

        /* Dropdown content styling */
        .water-content {
          border: 2px solid transparent;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.9)) padding-box,
            linear-gradient(120deg, #40ffaa, #4079ff, #40ffaa) border-box;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
        }
        :global(.dark) .water-content {
          background:
            linear-gradient(180deg, rgba(9,12,20,0.92), rgba(9,12,20,0.88)) padding-box,
            linear-gradient(120deg, #40ffaa, #4079ff, #40ffaa) border-box;
          box-shadow: 0 10px 36px rgba(64,121,255,0.18);
        }
      `}</style>
    </div>
          <h1 className="text-4xl font-bold mb-2 transition-colors duration-300 cursor-default animate-bounce-subtle tracking-wide flex items-center justify-center gap-2">
            <img
              src="/logo.png"
              alt="Scoreboard Logo"
              className="h-16 w-16 md:h-20 md:w-20 object-contain drop-shadow-lg rounded-md bg-white/80 dark:bg-white/10 p-1"
            />
            <GradientText
              colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
              animationSpeed={3}
              showBorder={false}
              as="span"
            >
              <span style={{ color: 'transparent' }}>Swimming Competition Scoreboard</span>
            </GradientText>
          </h1>
          <GradientText
            colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
            animationSpeed={3}
            showBorder={false}
            className="custom-class"
          >
            <p className="transition-colors duration-200" style={{ color: 'transparent' }}>Live Results & House Rankings</p>
          </GradientText>
          <div className="flex justify-center items-center gap-3 mt-4 flex-wrap">
            <Button
              onClick={fetchData}
              disabled={loading}
              variant="outline"
              size="sm"
              className="rounded-full px-4 py-2 border border-blue-300 bg-white/70 text-blue-700 hover:bg-blue-50 hover:border-blue-400 dark:bg-white/5 dark:text-blue-300 dark:hover:bg-white/10 dark:border-blue-500/40 shadow-sm hover:shadow transition-colors"
              aria-label="Refresh scoreboard"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              onClick={exportResults}
              variant="outline"
              size="sm"
              className="rounded-full px-4 py-2 border border-emerald-300 bg-white/70 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 dark:bg-white/5 dark:text-emerald-300 dark:hover:bg-white/10 dark:border-emerald-500/40 shadow-sm hover:shadow transition-colors"
              aria-label="Export results"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>

            <div className="flex gap-2">
              <Button
                onClick={() => setViewMode('table')}
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                className={`rounded-[75px] px-4 py-2 shadow-sm hover:shadow transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600' : 'border border-gray-300 bg-white/70 text-gray-700 hover:bg-gray-50 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10 dark:border-gray-600/60'}`}
                aria-pressed={viewMode === 'table'}
                aria-label="Show table view"
              >
                <Table className="h-4 w-4 mr-2" />
                Table
              </Button>
              <Button
                onClick={() => setViewMode('cards')}
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                className={`rounded-[75px] px-4 py-2 shadow-sm hover:shadow transition-colors ${viewMode === 'cards' ? 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600' : 'border border-gray-300 bg-white/70 text-gray-700 hover:bg-gray-50 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10 dark:border-gray-600/60'}`}
                aria-pressed={viewMode === 'cards'}
                aria-label="Show cards view"
              >
                <Grid className="h-4 w-4 mr-2" />
                Cards
              </Button>
            </div>

            {/* Event Filter */}
            <div className="w-full md:w-auto md:ml-2">
              <label className="sr-only">Filter by event</label>
              <Select value={selectedEventId} onValueChange={(v) => setSelectedEventId(v)}>
                <SelectTrigger className="water-trigger mt-2 md:mt-0 rounded-full px-4 py-2 text-sm text-gray-900 dark:text-gray-100 data-[placeholder]:text-gray-700 dark:data-[placeholder]:text-gray-200">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent className="water-content rounded-xl">
                  <SelectItem value="all">All Events</SelectItem>
                  {events
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((ev) => (
                      <SelectItem key={ev.id} value={ev.name}>{ev.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>



            <p className="text-sm text-gray-600 dark:text-gray-300">
              Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
            </p>
          </div>
        </div>

        {/* House Rankings */}
        <div className="mb-8 animate-slide-up">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold transition-colors duration-300 cursor-default inline-flex items-center gap-2">
              <span className="text-white drop-shadow-md dark:text-white">🏆</span>
              <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3} as="span">
                <span style={{ color: 'transparent' }}>House Rankings</span>
              </GradientText>
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {houseTotals.map((house, index) => (
              <Card key={`house-${index}-${house.house_name}`} className={`text-center transform hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer hover:rotate-1 ${house.rank === 1 ? 'ring-2 ring-yellow-400 animate-pulse-gold' : 'hover:ring-2 hover:ring-blue-300'} ${house.rank === 1 ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/20' : 'hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:bg-gray-900/60 dark:ring-1 dark:ring-white/10 dark:hover:bg-transparent dark:hover:from-transparent dark:hover:to-transparent'}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-center mb-2">
                    {house.rank === 1 && <Trophy className="h-8 w-8 text-yellow-500 animate-bounce hover:animate-pulse" />}
                    {house.rank === 2 && <Medal className="h-8 w-8 text-gray-400 hover:animate-pulse" />}
                    {house.rank === 3 && <Medal className="h-8 w-8 text-amber-600 hover:animate-pulse" />}
                    {house.rank > 3 && <div className="h-8 w-8" />}
                  </div>
                  <CardTitle className="text-xl font-bold hover:scale-110 transition-transform duration-200">
                    {(() => {
                      const name = (house.house_name && house.house_name.trim()) || (house as any).name || `House ${index + 1}`
                      const bg = ((house as any).house_color && (house as any).house_color.trim()) || HOUSE_PALETTE[index % HOUSE_PALETTE.length]
                      const fg = getReadableTextColor(bg)
                      return (
                        <Badge
                          className="text-sm font-semibold px-3 py-1 rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                          style={{ backgroundColor: bg as string, color: fg }}
                        >
                          {name}
                        </Badge>
                      )
                    })()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-1 cursor-default font-sans">
                    <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                      <span className="text-5xl font-extrabold leading-none" style={{ color: 'transparent' }}>
                        {house.total_points}
                      </span>
                    </GradientText>
                  </div>
                  <div className="text-sm">
                    <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                      <span style={{ color: 'transparent' }}>points</span>
                    </GradientText>
                  </div>
                  <Badge 
                    className="mt-2 hover:scale-110 hover:shadow-lg transition-all duration-200" 
                    style={{ backgroundColor: house.house_color, color: 'var(--primary)' }}
                  >
                    <span className="inline-flex items-center gap-1">
                      <span className="filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">#</span>
                      <span className="font-extrabold filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">{house.rank}</span>
                    </span>
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Detailed Results */}
        <div className="animate-slide-up-delayed">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold transition-colors duration-300 cursor-default inline-flex items-center gap-2">
              <span className="text-white drop-shadow-md dark:text-white">📊</span>
              <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3} as="span">
                <span style={{ color: 'transparent' }}>Detailed Results</span>
              </GradientText>
            </h2>
          </div>
        
          {viewMode === 'table' ? (
            <Card className="hover:shadow-xl transition-shadow duration-300 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-gray-900/60">
              <CardContent className="p-0 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                          <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                            <span style={{ color: 'transparent' }}>Position</span>
                          </GradientText>
                        </th>
                        <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                          <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                            <span style={{ color: 'transparent' }}>Swimmer Name</span>
                          </GradientText>
                        </th>
                        <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                          <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                            <span style={{ color: 'transparent' }}>House</span>
                          </GradientText>
                        </th>
                        <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                          <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                            <span style={{ color: 'transparent' }}>Event</span>
                          </GradientText>
                        </th>
                        <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                          <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                            <span style={{ color: 'transparent' }}>Points</span>
                          </GradientText>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/90 dark:bg-gray-900/40 divide-y divide-gray-100 dark:divide-gray-800">
                      {filtered.map((result, index) => (
                        <tr key={`table-result-${index}-${result.swimmer_name}-${result.event_name}`} className="transition-colors duration-200 hover:bg-blue-50/60 dark:hover:bg-gray-800/60">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-full min-w-[3rem] ring-1 ring-black/5 dark:ring-white/10 ${
                              result.position === 1 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200' :
                              result.position === 2 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800/60 dark:text-gray-200' :
                              result.position === 3 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' :
                              result.position === 4 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' :
                              result.status === 'disqualified' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' :
                              'bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:text-gray-300'
                            }`}>
                              {getPositionDisplay(result.position, result.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                              <div className="font-bold text-lg transition-colors duration-200" style={{ color: 'transparent' }}>{result.swimmer_name}</div>
                            </GradientText>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(() => {
                              const bg = resolveHouseColor(result.house_name, result.house_color)
                              const fg = getReadableTextColor(bg)
                              return (
                                <Badge 
                                  className="text-xs font-semibold px-3 py-1 rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                  style={{ backgroundColor: bg, color: fg }}
                                >
                                  {result.house_name}
                                </Badge>
                              )
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                              <span style={{ color: 'transparent' }}>{result.event_name}</span>
                            </GradientText>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                              <div className="inline-block font-sans font-extrabold text-base" style={{ color: 'transparent' }}>
                                {result.points}
                              </div>
                            </GradientText>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((result, index) => (
                <Card key={`card-result-${index}-${result.swimmer_name}-${result.event_name}`} className="hover:shadow-xl hover:scale-105 transition-all duration-300 hover:-translate-y-2 hover:rotate-1 cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center justify-center px-3 py-1 text-sm font-bold rounded-full min-w-[3rem] ${
                        result.position === 1 ? 'bg-yellow-100 text-yellow-800' :
                        result.position === 2 ? 'bg-gray-100 text-gray-800' :
                        result.position === 3 ? 'bg-amber-100 text-amber-800' :
                        result.position === 4 ? 'bg-blue-100 text-blue-800' :
                        result.status === 'disqualified' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {getPositionDisplay(result.position, result.status)}
                      </span>
                      <span className="inline-flex items-center gap-2 font-sans font-extrabold">
                        <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                          <span className="text-2xl" style={{ color: 'transparent' }}>
                            {result.points}
                          </span>
                        </GradientText>
                        <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                          <span className="font-sans font-bold" style={{ color: 'transparent' }}>pts</span>
                        </GradientText>
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                        <div className="font-bold text-lg transition-colors duration-200" style={{ color: 'transparent' }}>{result.swimmer_name}</div>
                      </GradientText>
                      
                      {(() => {
                        const bg = resolveHouseColor(result.house_name, result.house_color)
                        const fg = getReadableTextColor(bg)
                        return (
                          <Badge 
                            className="text-sm font-semibold px-3 py-1 rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                            style={{ backgroundColor: bg, color: fg }}
                          >
                            {result.house_name}
                          </Badge>
                        )
                      })()}
                      
                      <div className="text-sm font-medium">
                        <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                          <span style={{ color: 'transparent' }}>{result.event_name}</span>
                        </GradientText>
                      </div>
                      
                      {result.time_seconds && (
                        <div className="text-sm">
                          <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                            <span style={{ color: 'transparent' }}>Time: {formatTime(result.time_seconds)}</span>
                          </GradientText>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
