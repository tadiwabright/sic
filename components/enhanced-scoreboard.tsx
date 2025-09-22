"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Medal, Download, RefreshCw, Table, Grid } from "lucide-react"
import ThemeToggle from "@/components/theme-toggle"
import GradientText from "@/components/GradientText"
import LiquidChrome from "@/components/LiquidChrome"

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

interface HouseTotal {
  house_name: string
  house_color: string
  total_points: number
  rank: number
}

export function EnhancedScoreboard() {
  const [results, setResults] = useState<SwimmerResult[]>([])
  const [houseTotals, setHouseTotals] = useState<HouseTotal[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

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
      setHouseTotals(
        normalizedHouses.map((house: any, index: number) => ({
          ...house,
          rank: index + 1
        })) as HouseTotal[]
      )
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching scoreboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
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
          </div>
          <h1 className="text-4xl font-bold mb-2 transition-colors duration-300 cursor-default animate-bounce-subtle tracking-wide flex items-center justify-center gap-2">
            <span className="text-white drop-shadow-md dark:text-white">🏊‍♂️</span>
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
          <div className="flex justify-center items-center gap-4 mt-4">
            <Button onClick={fetchData} disabled={loading} variant="outline" size="sm" className="hover:scale-105 hover:shadow-lg transition-all duration-200 hover:bg-blue-50">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={exportResults} variant="outline" size="sm" className="hover:scale-105 hover:shadow-lg transition-all duration-200 hover:bg-green-50">
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>
            <div className="flex gap-2">
              <Button 
                onClick={() => setViewMode('table')} 
                variant={viewMode === 'table' ? 'default' : 'outline'} 
                size="sm"
                className="hover:scale-105 transition-all duration-200 hover:shadow-md"
              >
                <Table className="h-4 w-4 mr-2" />
                Table
              </Button>
              <Button 
                onClick={() => setViewMode('cards')} 
                variant={viewMode === 'cards' ? 'default' : 'outline'} 
                size="sm"
                className="hover:scale-105 transition-all duration-200 hover:shadow-md"
              >
                <Grid className="h-4 w-4 mr-2" />
                Cards
              </Button>
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
                    <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                      <span style={{ color: 'transparent' }}>{house.house_name}</span>
                    </GradientText>
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
                    style={{ backgroundColor: house.house_color, color: 'white' }}
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
            <Card className="hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                            <span style={{ color: 'transparent' }}>Position</span>
                          </GradientText>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                            <span style={{ color: 'transparent' }}>Swimmer Name</span>
                          </GradientText>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                            <span style={{ color: 'transparent' }}>House</span>
                          </GradientText>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                            <span style={{ color: 'transparent' }}>Event</span>
                          </GradientText>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                            <span style={{ color: 'transparent' }}>Points</span>
                          </GradientText>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {results.map((result, index) => (
                        <tr key={`table-result-${index}-${result.swimmer_name}-${result.event_name}`} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-800 dark:hover:to-gray-800 transition-all duration-200 hover:scale-[1.01] hover:shadow-sm">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center justify-center px-3 py-1 text-sm font-bold rounded-full hover:scale-110 hover:shadow-lg transition-all duration-200 group-hover:animate-pulse min-w-[3rem] ${
                              result.position === 1 ? 'bg-yellow-100 text-yellow-800' :
                              result.position === 2 ? 'bg-gray-100 text-gray-800' :
                              result.position === 3 ? 'bg-amber-100 text-amber-800' :
                              result.position === 4 ? 'bg-blue-100 text-blue-800' :
                              result.status === 'disqualified' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-600'
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
                            <Badge 
                              className="text-sm font-semibold px-3 py-1 hover:scale-110 hover:shadow-lg transition-all duration-200"
                              style={{ backgroundColor: result.house_color, color: 'white' }}
                            >
                              {result.house_name}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                              <span style={{ color: 'transparent' }}>{result.event_name}</span>
                            </GradientText>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} animationSpeed={3}>
                              <div className="inline-block font-sans font-extrabold text-lg" style={{ color: 'transparent' }}>
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
              {results.map((result, index) => (
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
                      
                      <Badge 
                        className="text-sm font-semibold px-3 py-1 hover:scale-110 hover:shadow-lg transition-all duration-200"
                        style={{ backgroundColor: result.house_color, color: 'white' }}
                      >
                        {result.house_name}
                      </Badge>
                      
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
