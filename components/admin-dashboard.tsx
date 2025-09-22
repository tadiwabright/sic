"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import ThemeToggle from "@/components/theme-toggle"
import { Trophy, Users, Calendar, Timer, Medal, Activity, LogOut, UserIcon, Home, Bell, Settings, Search, Globe } from "lucide-react"
import { DashboardOverview } from "@/components/dashboard-overview"
import { EventManagement } from "@/components/event-management"
import { ResultsEntry } from "@/components/results-entry"
import { LiveScoreboard } from "@/components/live-scoreboard"
import { SwimmerManagement } from "@/components/swimmer-management"
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-40">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-7 w-7 text-primary" />
              <div>
                <h1 className="text-lg md:text-xl font-bold text-foreground">Swimming Competition</h1>
                <p className="hidden md:block text-xs text-muted-foreground">Interhouse Championship 2024</p>
              </div>
            </div>
          </div>
          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search…" className="pl-9" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-accent text-accent-foreground hidden md:inline-flex">
              <Activity className="mr-1 h-3 w-3" />
              Live
            </Badge>
            <Button variant="ghost" size="icon" aria-label="Change language">
              <Globe className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-muted rounded-md">
              <UserIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{user.name}</span>
              <Badge variant="outline" className="text-xs">
                {user.role}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-sidebar-border bg-sidebar/90 backdrop-blur hidden md:block">
          {/* Brand block */}
          <div className="h-16 px-3 border-b border-sidebar-border flex items-center gap-3">
            <Image src="/placeholder-logo.svg" alt="SICS Logo" width={28} height={28} className="rounded-sm" />
            <div className="leading-tight">
              <div className="text-sm font-bold text-foreground">SICS Admin</div>
              <div className="text-[11px] text-muted-foreground">Control Center</div>
            </div>
          </div>
          <nav className="p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground px-2 pb-2">Manage</div>
            <div className="space-y-1">
              <Button
                variant={activeTab === "overview" ? "default" : "ghost"}
                className="w-full justify-start gap-2 rounded-md transition-colors hover:bg-muted/60"
                onClick={() => setActiveTab("overview")}
              >
                <Trophy className="h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant={activeTab === "houses" ? "default" : "ghost"}
                className="w-full justify-start gap-2 rounded-md transition-colors hover:bg-muted/60"
                onClick={() => setActiveTab("houses")}
                disabled={user.role === "viewer"}
              >
                <Home className="h-4 w-4" />
                Houses
              </Button>
              <Button
                variant={activeTab === "events" ? "default" : "ghost"}
                className="w-full justify-start gap-2 rounded-md transition-colors hover:bg-muted/60"
                onClick={() => setActiveTab("events")}
                disabled={user.role === "viewer"}
              >
                <Calendar className="h-4 w-4" />
                Events
              </Button>
              <Button
                variant={activeTab === "results" ? "default" : "ghost"}
                className="w-full justify-start gap-2 rounded-md transition-colors hover:bg-muted/60"
                onClick={() => setActiveTab("results")}
                disabled={user.role === "viewer"}
              >
                <Timer className="h-4 w-4" />
                Results Entry
              </Button>
              <Button
                variant={activeTab === "scoreboard" ? "default" : "ghost"}
                className="w-full justify-start gap-2 rounded-md transition-colors hover:bg-muted/60"
                onClick={() => setActiveTab("scoreboard")}
              >
                <Medal className="h-4 w-4" />
                Live Scoreboard
              </Button>
              <Button
                variant={activeTab === "swimmers" ? "default" : "ghost"}
                className="w-full justify-start gap-2 rounded-md transition-colors hover:bg-muted/60"
                onClick={() => setActiveTab("swimmers")}
                disabled={user.role === "viewer"}
              >
                <Users className="h-4 w-4" />
                Swimmers
              </Button>
            </div>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6">
          {activeTab === "overview" && <DashboardOverview />}
          {activeTab === "houses" && user.role !== "viewer" && <HouseManagement />}
          {activeTab === "events" && user.role !== "viewer" && <EventManagement />}
          {activeTab === "results" && user.role !== "viewer" && <ResultsEntry />}
          {activeTab === "scoreboard" && <LiveScoreboard />}
          {activeTab === "swimmers" && user.role !== "viewer" && <SwimmerManagement />}
        </main>
      </div>
    </div>
  )
}
