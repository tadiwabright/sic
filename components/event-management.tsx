"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
      <div className="d-grid gap-3">
        <h2 className="h4 m-0">Event Management</h2>
        <div className="card">
          <div className="card-body">Loading events...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="d-grid gap-3">
      <div className="d-flex align-items-center justify-content-between">
        <h2 className="h4 m-0">Event Management</h2>
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          <i className="bi bi-plus-circle me-2"></i>
          Add Event
        </button>
      </div>

      {/* Add/Edit Event Form */}
      {showAddForm && (
        <div className="card">
          <div className="card-header">
            <div className="fw-semibold">{editingEvent ? "Edit Event" : "Add New Event"}</div>
            <div className="text-body-secondary small">{editingEvent ? "Update event details" : "Create a new swimming event"}</div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="d-grid gap-3">
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="name" className="form-label">Event Name</label>
                  <input id="name" className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Boys Under-14 50m Freestyle" required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    <option value="">Select category</option>
                    <option value="freestyle">Freestyle</option>
                    <option value="backstroke">Backstroke</option>
                    <option value="breaststroke">Breaststroke</option>
                    <option value="butterfly">Butterfly</option>
                    <option value="individual_medley">Individual Medley</option>
                    <option value="relay">Relay</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Distance</label>
                  <select className="form-select" value={formData.distance} onChange={(e) => setFormData({ ...formData, distance: e.target.value })}>
                    <option value="">Select distance</option>
                    <option value="25m">25m</option>
                    <option value="50m">50m</option>
                    <option value="100m">100m</option>
                    <option value="200m">200m</option>
                    <option value="4x25m">4x25m</option>
                    <option value="4x50m">4x50m</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Age Group</label>
                  <select className="form-select" value={formData.age_group} onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}>
                    <option value="">Select age group</option>
                    <option value="under-12">Under 12</option>
                    <option value="under-14">Under 14</option>
                    <option value="under-16">Under 16</option>
                    <option value="under-18">Under 18</option>
                    <option value="open">Open</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label htmlFor="max_participants" className="form-label">Max Participants per House</label>
                  <input id="max_participants" type="number" min={1} max={8} className="form-control" value={formData.max_participants_per_house} onChange={(e) => setFormData({ ...formData, max_participants_per_house: Number.parseInt(e.target.value) })} />
                </div>
                <div className="col-md-6">
                  <label htmlFor="event_order" className="form-label">Event Order</label>
                  <input id="event_order" type="number" min={1} className="form-control" value={formData.event_order} onChange={(e) => setFormData({ ...formData, event_order: Number.parseInt(e.target.value) })} />
                </div>
                <div className="col-md-6 d-flex align-items-center">
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                    <label className="form-check-label" htmlFor="is_active">Active Event</label>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">{editingEvent ? "Update Event" : "Create Event"}</button>
                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="card">
        <div className="card-header d-flex align-items-center gap-2">
          <i className="bi bi-calendar3 me-1"></i>
          <span className="fw-semibold">Competition Events</span>
          <span className="ms-auto text-body-secondary small">Manage swimming events and their settings</span>
        </div>
        <div className="card-body d-grid gap-3">
          {events.map((event) => (
            <div key={event.id} className="d-flex align-items-center justify-content-between p-3 border rounded-2">
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <h3 className="h6 m-0 fw-semibold">{event.name}</h3>
                  <span className={`badge ${event.is_active ? 'text-bg-primary' : 'text-bg-secondary'}`}>
                    {event.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="small text-primary">
                  {event.category} • {event.distance} • {event.gender} • {event.age_group}
                </div>
                <div className="small text-primary d-flex align-items-center gap-1">
                  <i className="bi bi-people me-1"></i>
                  Max {event.max_participants_per_house} per house • Order: {event.event_order}
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <div className="form-check form-switch m-0">
                  <input className="form-check-input" type="checkbox" checked={event.is_active} onChange={() => toggleEventStatus(event)} />
                </div>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => handleEdit(event)} title="Edit">
                  <i className="bi bi-pencil"></i>
                </button>
                <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(event.id)} title="Delete">
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
