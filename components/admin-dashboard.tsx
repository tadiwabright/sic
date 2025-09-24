"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ThemeToggle from "@/components/theme-toggle"
import { DashboardOverview } from "@/components/dashboard-overview"
import { EventManagement } from "@/components/event-management"
import { ResultsEntry } from "@/components/results-entry"
import { LiveScoreboard } from "@/components/live-scoreboard"
import { SwimmerManagement } from "@/components/swimmer-management"
import  AnalyticsReports  from "@/components/analytics-reports"
import HouseManagement from "@/components/house-management"

interface AdminUser {
  id: number
  email: string
  name: string
  role: "admin" | "official" | "viewer"
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Keep Bootstrap's data-bs-theme in sync with our theme provider (dark/light)
  useEffect(() => {
    const setBsTheme = () => {
      const isDark = document.documentElement.classList.contains('dark')
      document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light')
    }
    setBsTheme()
    const obs = new MutationObserver(setBsTheme)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    // Get current user info
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user)
        } else {
          router.push("/login")
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false))
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-body">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" aria-hidden="true"></div>
          <div className="d-flex align-items-center justify-content-center gap-2">
            <i className="bi bi-trophy-fill text-primary"></i>
            <p className="m-0">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-vh-100 bg-body">
      {/* Header */}
      <header className="sticky top-0 z-40 border-bottom bg-body-tertiary">
        <div className="container-fluid d-flex align-items-center justify-content-between py-2 px-3">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-trophy-fill fs-4 text-primary" aria-hidden="true"></i>
            <div>
              <h1 className="m-0 fw-bold fs-5">Swimming Competition</h1>
              <small className="text-secondary d-none d-md-block">Interhouse Championship 2025</small>
            </div>
          </div>
          {/* Mobile sidebar toggle */}
          <div className="d-flex d-md-none align-items-center ms-auto me-2">
            <button
              className="btn btn-outline-secondary btn-sm"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#sidebarMenu"
              aria-controls="sidebarMenu"
              aria-label="Toggle navigation"
            >
              <i className="bi bi-list"></i>
            </button>
          </div>
          {/* Search */}
          <div className="d-none d-md-flex flex-grow-1 mx-3" style={{ maxWidth: 600 }}>
            <div className="position-relative w-100">
              <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
              <input placeholder="Search…" className="form-control ps-5 bg-transparent" />
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary d-none d-md-inline-flex align-items-center gap-1">
              <i className="bi bi-activity"></i>
              Live
            </span>
            <button aria-label="Change language" className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-globe2"></i>
            </button>
            <button aria-label="Notifications" className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-bell"></i>
            </button>
            <button aria-label="Settings" className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-gear"></i>
            </button>
            <ThemeToggle />
            <div className="d-none d-md-flex align-items-center gap-2 px-2 py-1 rounded bg-body-secondary">
              <i className="bi bi-person-circle"></i>
              <span className="small fw-medium">{user.name}</span>
              <span className="badge text-bg-secondary text-uppercase">{user.role}</span>
            </div>
            <button onClick={handleLogout} className="btn btn-outline-light btn-sm">
              <i className="bi bi-box-arrow-right me-2"></i>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="d-flex">
        {/* Sidebar - Bootstrap dashboard style */}
        <aside className="border-end" style={{ width: 260 }}>
          {/* Brand block (dark strip) visible on md+ */}
          <div className="px-3 py-2 bg-dark text-white fw-medium d-none d-md-block">Company name</div>
          <div className="offcanvas-md offcanvas-end bg-body-tertiary" tabIndex={-1} id="sidebarMenu" aria-labelledby="sidebarMenuLabel">
            <div className="offcanvas-header d-md-none">
              <h5 className="offcanvas-title" id="sidebarMenuLabel">Company name</h5>
              <button type="button" className="btn-close" data-bs-dismiss="offcanvas" data-bs-target="#sidebarMenu" aria-label="Close"></button>
            </div>
            <div className="offcanvas-body d-md-flex flex-column p-0 pt-lg-3 overflow-y-auto">
            <div>
              <ul className="nav flex-column p-2">
                <li className="nav-item">
                  <a
                    href="#"
                    className={`nav-link d-flex align-items-center gap-2 ${activeTab === 'overview' ? 'active' : 'text-primary'}`}
                    aria-current={activeTab === 'overview' ? 'page' : undefined}
                    onClick={(e) => { e.preventDefault(); setActiveTab('overview') }}
                  >
                    <i className="bi bi-house-fill"></i>
                    Dashboard
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    href="#"
                    className={`nav-link d-flex align-items-center gap-2 ${activeTab === 'houses' ? 'active' : 'text-primary'}`}
                    onClick={(e) => { e.preventDefault(); if (user.role !== 'viewer') setActiveTab('houses') }}
                  >
                    <i className="bi bi-house"></i>
                    Houses
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    href="#"
                    className={`nav-link d-flex align-items-center gap-2 ${activeTab === 'events' ? 'active' : 'text-primary'}`}
                    onClick={(e) => { e.preventDefault(); if (user.role !== 'viewer') setActiveTab('events') }}
                  >
                    <i className="bi bi-calendar3"></i>
                    Events
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    href="#"
                    className={`nav-link d-flex align-items-center gap-2 ${activeTab === 'results' ? 'active' : 'text-primary'}`}
                    onClick={(e) => { e.preventDefault(); if (user.role !== 'viewer') setActiveTab('results') }}
                  >
                    <i className="bi bi-stopwatch"></i>
                    Results Entry
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    href="#"
                    className={`nav-link d-flex align-items-center gap-2 ${activeTab === 'scoreboard' ? 'active' : 'text-primary'}`}
                    onClick={(e) => { e.preventDefault(); setActiveTab('scoreboard') }}
                  >
                    <i className="bi bi-trophy"></i>
                    Live Scoreboard
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    href="#"
                    className={`nav-link d-flex align-items-center gap-2 ${activeTab === 'swimmers' ? 'active' : 'text-primary'}`}
                    onClick={(e) => { e.preventDefault(); if (user.role !== 'viewer') setActiveTab('swimmers') }}
                  >
                    <i className="bi bi-people"></i>
                    Swimmers
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    href="#"
                    className={`nav-link d-flex align-items-center gap-2 ${activeTab === 'analytics' ? 'active' : 'text-primary'}`}
                    onClick={(e) => { e.preventDefault(); if (user.role !== 'viewer') setActiveTab('analytics') }}
                  >
                    <i className="bi bi-graph-up"></i>
                    Reports
                  </a>
                </li>
              </ul>

              <div className="px-3 mt-3 mb-1 text-body-secondary text-uppercase small d-flex align-items-center justify-content-between">
              
              </div>
              
            </div>

            <div className="mt-auto">
              <hr className="my-2" />
              
            </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 p-md-5 container-fluid">
          {activeTab === "overview" && <DashboardOverview />}
          {activeTab === "houses" && user.role !== "viewer" && <HouseManagement />}
          {activeTab === "events" && user.role !== "viewer" && <EventManagement />}
          {activeTab === "results" && user.role !== "viewer" && <ResultsEntry />}
          {activeTab === "scoreboard" && <LiveScoreboard />}
          {activeTab === "swimmers" && user.role !== "viewer" && <SwimmerManagement />}
          {activeTab ===  "analytics" && user.role !== "viewer" && < AnalyticsReports/>}
        </main>
      </div>
    </div>
  )
}
