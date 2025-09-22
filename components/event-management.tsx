"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Calendar, Users } from "lucide-react"
// Avoid importing server-only db code; define local type and fetch via API
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

export function EventManagement() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    distance: "",
    gender: "male" as "male" | "female" | "mixed",
    age_group: "",
    max_participants_per_house: 2,
    is_active: true,
    event_order: 1,
  })

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const res = await fetch("/api/events")
      if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`)
      const data = await res.json()
      const eventsData: Event[] = Array.isArray(data) ? data : []
      setEvents(eventsData)
    } catch (error) {
      console.error("Failed to load events:", error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      distance: "",
      gender: "male",
      age_group: "",
      max_participants_per_house: 2,
      is_active: true,
      event_order: events.length + 1,
    })
    setEditingEvent(null)
    setShowAddForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : "/api/events"
      const method = editingEvent ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await loadEvents()
        resetForm()
        alert(editingEvent ? "Event updated successfully!" : "Event created successfully!")
      } else {
        throw new Error("Failed to save event")
      }
    } catch (error) {
      console.error("Error saving event:", error)
      alert("Failed to save event. Please try again.")
    }
  }

  const handleEdit = (event: Event) => {
    setFormData({
      name: event.name,
      category: event.category,
      distance: event.distance,
      gender: event.gender,
      age_group: event.age_group,
      max_participants_per_house: event.max_participants_per_house,
      is_active: event.is_active,
      event_order: event.event_order,
    })
    setEditingEvent(event)
    setShowAddForm(true)
  }

  const handleDelete = async (eventId: number) => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await loadEvents()
        alert("Event deleted successfully!")
      } else {
        throw new Error("Failed to delete event")
      }
    } catch (error) {
      console.error("Error deleting event:", error)
      alert("Failed to delete event. Please try again.")
    }
  }

  const toggleEventStatus = async (event: Event) => {
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...event, is_active: !event.is_active }),
      })

      if (response.ok) {
        await loadEvents()
      } else {
        throw new Error("Failed to update event status")
      }
    } catch (error) {
      console.error("Error updating event status:", error)
      alert("Failed to update event status. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Event Management</h2>
        <Card>
          <CardContent className="p-6">
            <div>Loading events...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Event Management</h2>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>

      {/* Add/Edit Event Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingEvent ? "Edit Event" : "Add New Event"}</CardTitle>
            <CardDescription>{editingEvent ? "Update event details" : "Create a new swimming event"}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Event Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Boys Under-14 50m Freestyle"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freestyle">Freestyle</SelectItem>
                      <SelectItem value="backstroke">Backstroke</SelectItem>
                      <SelectItem value="breaststroke">Breaststroke</SelectItem>
                      <SelectItem value="butterfly">Butterfly</SelectItem>
                      <SelectItem value="individual_medley">Individual Medley</SelectItem>
                      <SelectItem value="relay">Relay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="distance">Distance</Label>
                  <Select
                    value={formData.distance}
                    onValueChange={(value) => setFormData({ ...formData, distance: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select distance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25m">25m</SelectItem>
                      <SelectItem value="50m">50m</SelectItem>
                      <SelectItem value="100m">100m</SelectItem>
                      <SelectItem value="200m">200m</SelectItem>
                      <SelectItem value="4x25m">4x25m</SelectItem>
                      <SelectItem value="4x50m">4x50m</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value: "male" | "female" | "mixed") => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="age_group">Age Group</Label>
                  <Select
                    value={formData.age_group}
                    onValueChange={(value) => setFormData({ ...formData, age_group: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select age group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-12">Under 12</SelectItem>
                      <SelectItem value="under-14">Under 14</SelectItem>
                      <SelectItem value="under-16">Under 16</SelectItem>
                      <SelectItem value="under-18">Under 18</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="max_participants">Max Participants per House</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    min="1"
                    max="8"
                    value={formData.max_participants_per_house}
                    onChange={(e) =>
                      setFormData({ ...formData, max_participants_per_house: Number.parseInt(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="event_order">Event Order</Label>
                  <Input
                    id="event_order"
                    type="number"
                    min="1"
                    value={formData.event_order}
                    onChange={(e) => setFormData({ ...formData, event_order: Number.parseInt(e.target.value) })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active Event</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">{editingEvent ? "Update Event" : "Create Event"}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Competition Events
          </CardTitle>
          <CardDescription>Manage swimming events and their settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{event.name}</h3>
                    <Badge variant={event.is_active ? "default" : "secondary"}>
                      {event.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {event.category} • {event.distance} • {event.gender} • {event.age_group}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <Users className="inline h-3 w-3 mr-1" />
                    Max {event.max_participants_per_house} per house • Order: {event.event_order}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={event.is_active} onCheckedChange={() => toggleEventStatus(event)} />
                  <Button variant="outline" size="sm" onClick={() => handleEdit(event)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(event.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
