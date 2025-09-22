"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { Download, Trophy, Medal, Award, TrendingUp, Users, Calendar } from "lucide-react"

interface AnalyticsData {
  housePerformance: Array<{
    house_name: string
    house_color: string
    total_points: number
    event_wins: number
    swimmer_count: number
    avg_points_per_swimmer: number
  }>
  topSwimmers: Array<{
    swimmer_name: string
    house_name: string
    house_color: string
    total_points: number
    event_count: number
    best_position: number
  }>
  eventStats: Array<{
    event_name: string
    participant_count: number
    completed: boolean
    avg_time: string
  }>
  performanceTrends: Array<{
    event_date: string
    house_name: string
    cumulative_points: number
  }>
}

export default function AnalyticsReports() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedHouse, setSelectedHouse] = useState<string>("all")
  const [reportType, setReportType] = useState<string>("overview")

  useEffect(() => {
    fetchAnalytics()
  }, [selectedHouse])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?house=${selectedHouse}`)
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: "pdf" | "excel") => {
    try {
      const response = await fetch(`/api/reports/export?format=${format}&house=${selectedHouse}&type=${reportType}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `swimming-competition-report.${format === "pdf" ? "pdf" : "xlsx"}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error exporting report:", error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading analytics...</div>
  }

  if (!data) {
    return <div className="flex items-center justify-center p-8">No data available</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Reports</h2>
          <p className="text-muted-foreground">Comprehensive competition performance analysis</p>
        </div>

        <div className="flex gap-3">
          <Select value={selectedHouse} onValueChange={setSelectedHouse}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by house" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Houses</SelectItem>
              {data.housePerformance.map((house) => (
                <SelectItem key={house.house_name} value={house.house_name}>
                  {house.house_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => exportReport("pdf")} className="button-lift">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>

          <Button variant="outline" onClick={() => exportReport("excel")} className="button-lift">
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="swimmers">Top Swimmers</TabsTrigger>
          <TabsTrigger value="events">Event Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* House Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.housePerformance.map((house) => (
              <Card key={house.house_name} className="card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: house.house_color }} />
                    <CardTitle className="text-lg">{house.house_name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Points</span>
                    <Badge
                      className="font-mono font-bold"
                      style={{ backgroundColor: house.house_color, color: "white" }}
                    >
                      {house.total_points}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Event Wins</span>
                    <Badge variant="secondary">{house.event_wins}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Swimmers</span>
                    <Badge variant="outline">{house.swimmer_count}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg/Swimmer</span>
                    <Badge variant="outline" className="font-mono">
                      {house.avg_points_per_swimmer.toFixed(1)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Points Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="w-5 h-5" />
                House Points Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.housePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="house_name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total_points" fill={(entry) => entry.house_color} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="event_date" />
                  <YAxis />
                  <Tooltip />
                  {data.housePerformance.map((house) => (
                    <Line
                      key={house.house_name}
                      type="monotone"
                      dataKey="cumulative_points"
                      stroke={house.house_color}
                      strokeWidth={2}
                      name={house.house_name}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Swimmer Participation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Swimmer Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.housePerformance}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ house_name, swimmer_count }) => `${house_name}: ${swimmer_count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="swimmer_count"
                  >
                    {data.housePerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.house_color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="swimmers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Top Performing Swimmers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topSwimmers.map((swimmer, index) => (
                  <div
                    key={swimmer.swimmer_name}
                    className="flex items-center justify-between p-4 rounded-lg border card-hover"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Trophy className="w-5 h-5 text-yellow-500 bounce-trophy" />}
                        {index === 1 && <Medal className="w-5 h-5 text-gray-400" />}
                        {index === 2 && <Award className="w-5 h-5 text-amber-600" />}
                        {index > 2 && (
                          <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">{swimmer.swimmer_name}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: swimmer.house_color }} />
                          {swimmer.house_name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-lg">{swimmer.total_points} pts</div>
                      <div className="text-sm text-muted-foreground">
                        {swimmer.event_count} events • Best:{" "}
                        {swimmer.best_position === 1
                          ? "1st"
                          : swimmer.best_position === 2
                            ? "2nd"
                            : swimmer.best_position === 3
                              ? "3rd"
                              : `${swimmer.best_position}th`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.eventStats.map((event) => (
              <Card key={event.event_name} className="card-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {event.event_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Participants</span>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {event.participant_count}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={event.completed ? "default" : "outline"}>
                      {event.completed ? "Completed" : "Pending"}
                    </Badge>
                  </div>
                  {event.avg_time && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Avg Time</span>
                      <Badge variant="outline" className="font-mono">
                        {event.avg_time}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
