"use client"

import { useState, useEffect } from "react"
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
// Replaced lucide-react icons with Bootstrap Icons

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

function normalizeAnalyticsData(raw: any): AnalyticsData {
  return {
    housePerformance: Array.isArray(raw?.housePerformance) ? raw.housePerformance : [],
    topSwimmers: Array.isArray(raw?.topSwimmers) ? raw.topSwimmers : [],
    eventStats: Array.isArray(raw?.eventStats) ? raw.eventStats : [],
    performanceTrends: Array.isArray(raw?.performanceTrends) ? raw.performanceTrends : [],
  }
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
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics?house=${selectedHouse}`)
      const analyticsData = await response.json()
      setData(normalizeAnalyticsData(analyticsData))
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
    return <div className="d-flex align-items-center justify-content-center p-4">Loading analytics...</div>
  }

  if (!data) {
    return <div className="d-flex align-items-center justify-content-center p-4">No data available</div>
  }

  return (
    <div className="d-grid gap-3">
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h2 className="h4 m-0">Analytics & Reports</h2>
          <p className="text-primary m-0 small">Comprehensive competition performance analysis</p>
        </div>

        <div className="d-flex gap-2">
          <select className="form-select" style={{ width: 200 }} value={selectedHouse} onChange={(e) => setSelectedHouse(e.target.value)}>
            <option value="all">All Houses</option>
            {data.housePerformance.map((house) => (
              <option key={house.house_name} value={house.house_name}>{house.house_name}</option>
            ))}
          </select>

          <button className="btn btn-outline-secondary" onClick={() => exportReport('pdf')}>
            <i className="bi bi-download me-2"></i> Export PDF
          </button>
          <button className="btn btn-outline-secondary" onClick={() => exportReport('excel')}>
            <i className="bi bi-download me-2"></i> Export Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button className={`nav-link ${reportType === 'overview' ? 'active' : ''}`} onClick={() => setReportType('overview')}>Overview</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${reportType === 'performance' ? 'active' : ''}`} onClick={() => setReportType('performance')}>Performance</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${reportType === 'swimmers' ? 'active' : ''}`} onClick={() => setReportType('swimmers')}>Top Swimmers</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${reportType === 'events' ? 'active' : ''}`} onClick={() => setReportType('events')}>Event Stats</button>
        </li>
      </ul>

      {reportType === 'overview' && (
        <div className="d-grid gap-3">
          <div className="row g-3">
            {data.housePerformance.map((house) => (
              <div key={house.house_name} className="col-12 col-md-6 col-lg-3">
                <div className="card h-100">
                  <div className="card-header py-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-circle" style={{ width: 12, height: 12, backgroundColor: house.house_color }} />
                      <span className="fw-semibold">{house.house_name}</span>
                    </div>
                  </div>
                  <div className="card-body d-grid gap-2">
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="small text-primary">Total Points</span>
                      <span className="badge" style={{ backgroundColor: house.house_color, color: 'var(--bs-body-bg)' }}>
                        {house.total_points}
                      </span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="small text-primary">Event Wins</span>
                      <span className="badge text-bg-secondary">{house.event_wins}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="small text-primary">Swimmers</span>
                      <span className="badge text-bg-light">{house.swimmer_count}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="small text-primary">Avg/Swimmer</span>
                      <span className="badge text-bg-light font-monospace">{house.avg_points_per_swimmer.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center gap-2">
              <span className="fw-semibold d-flex align-items-center gap-2"><span className="bi"></span>House Points Distribution</span>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.housePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="house_name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total_points">
                    {data.housePerformance.map((entry, index) => (
                      <Cell key={`bar-cell-${index}`} fill={entry.house_color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {reportType === 'performance' && (
        <div className="d-grid gap-3">
          <div className="card">
            <div className="card-header d-flex align-items-center gap-2">
              <i className="bi bi-graph-up"></i>
              <span className="fw-semibold">Performance Trends</span>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="event_date" />
                  <YAxis />
                  <Tooltip />
                  {data.housePerformance.map((house) => (
                    <Line key={house.house_name} type="monotone" dataKey="cumulative_points" stroke={house.house_color} strokeWidth={2} name={house.house_name} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center gap-2">
              <i className="bi bi-pie-chart"></i>
              <span className="fw-semibold">Swimmer Distribution</span>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={data.housePerformance} cx="50%" cy="50%" labelLine={false} label={({ house_name, swimmer_count }) => `${house_name}: ${swimmer_count}`} outerRadius={80} fill="#8884d8" dataKey="swimmer_count">
                    {data.housePerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.house_color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {reportType === 'swimmers' && (
        <div className="card">
          <div className="card-header d-flex align-items-center gap-2">
            <i className="bi bi-trophy"></i>
            <span className="fw-semibold">Top Performing Swimmers</span>
          </div>
          <div className="card-body d-grid gap-2">
            {data.topSwimmers.map((swimmer, index) => (
              <div key={swimmer.swimmer_name} className="d-flex align-items-center justify-content-between p-3 border rounded-2">
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center gap-2">
                    {index === 0 && <i className="bi bi-trophy text-warning"></i>}
                    {index === 1 && <i className="bi bi-award text-secondary"></i>}
                    {index === 2 && <i className="bi bi-award text-warning"></i>}
                    {index > 2 && (
                      <span className="d-inline-flex align-items-center justify-content-center fw-bold" style={{ width: 20 }}>{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <div className="fw-semibold">{swimmer.swimmer_name}</div>
                    <div className="d-flex align-items-center gap-2 small text-secondary">
                      <div className="rounded-circle" style={{ width: 10, height: 10, backgroundColor: swimmer.house_color }} />
                      {swimmer.house_name}
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <div className="font-monospace fw-bold">{swimmer.total_points} pts</div>
                  <div className="small text-secondary">
                    {swimmer.event_count} events • Best: {swimmer.best_position === 1 ? '1st' : swimmer.best_position === 2 ? '2nd' : swimmer.best_position === 3 ? '3rd' : `${swimmer.best_position}th`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reportType === 'events' && (
        <div className="row g-3">
          {data.eventStats.map((event) => (
            <div key={event.event_name} className="col-12 col-md-6 col-lg-4">
              <div className="card h-100">
                <div className="card-header py-2 d-flex align-items-center gap-2">
                  <i className="bi bi-calendar3"></i>
                  <span className="fw-semibold">{event.event_name}</span>
                </div>
                <div className="card-body d-grid gap-2">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="small text-primary">Participants</span>
                    <span className="badge text-bg-secondary d-inline-flex align-items-center gap-1"><i className="bi bi-people"></i> {event.participant_count}</span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="small text-primary">Status</span>
                    <span className={`badge ${event.completed ? 'text-bg-primary' : 'text-bg-light'}`}>{event.completed ? 'Completed' : 'Pending'}</span>
                  </div>
                  {event.avg_time && (
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="small text-primary">Avg Time</span>
                      <span className="badge text-bg-light font-monospace">{event.avg_time}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
