"use client"

import { useState, useEffect } from "react"

interface House {
  id: number
  name: string
  color: string
  swimmer_count: number
  total_points: number
}

export default function HouseManagement() {
  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)
  const [editingHouse, setEditingHouse] = useState<House | null>(null)
  const [newHouse, setNewHouse] = useState({ name: "", color: "#1E88E5" })

  const houseColors = [
    { name: "Red", value: "#E53935" },
    { name: "Blue", value: "#1E88E5" },
    { name: "Green", value: "#43A047" },
    { name: "Yellow", value: "#FDD835" },
    { name: "Purple", value: "#8E24AA" },
    { name: "Orange", value: "#FB8C00" },
  ]

  useEffect(() => {
    fetchHouses()
  }, [])

  const fetchHouses = async () => {
    try {
      const response = await fetch("/api/houses")
      const data = await response.json()
      setHouses(data)
    } catch (error) {
      console.error("Error fetching houses:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateHouse = async () => {
    try {
      const response = await fetch("/api/houses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHouse),
      })

      if (response.ok) {
        setNewHouse({ name: "", color: "#1E88E5" })
        fetchHouses()
      }
    } catch (error) {
      console.error("Error creating house:", error)
    }
  }

  const handleUpdateHouse = async () => {
    if (!editingHouse) return

    try {
      const response = await fetch(`/api/houses/${editingHouse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingHouse.name, color: editingHouse.color }),
      })

      if (response.ok) {
        setEditingHouse(null)
        fetchHouses()
      }
    } catch (error) {
      console.error("Error updating house:", error)
    }
  }

  const handleDeleteHouse = async (id: number) => {
    if (!confirm("Are you sure you want to delete this house? This will also remove all associated swimmers.")) return

    try {
      const response = await fetch(`/api/houses/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchHouses()
      }
    } catch (error) {
      console.error("Error deleting house:", error)
    }
  }

  if (loading) {
    return <div className="d-flex align-items-center justify-content-center p-4">Loading houses...</div>
  }

  return (
    <div className="d-grid gap-3">
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h2 className="h4 m-0">House Management</h2>
          <p className="text-primary m-0 small">Manage competition houses and their details</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateHouse} disabled={!newHouse.name}>
          <i className="bi bi-plus-circle me-2"></i> Add House
        </button>
      </div>

      {/* Add House */}
      <div className="card">
        <div className="card-header"><span className="fw-semibold">Create New House</span></div>
        <div className="card-body d-grid gap-2">
          <div>
            <label htmlFor="house-name" className="form-label">House Name</label>
            <input id="house-name" className="form-control" value={newHouse.name} onChange={(e) => setNewHouse({ ...newHouse, name: e.target.value })} placeholder="Enter house name" />
          </div>
          <div>
            <label className="form-label">House Color</label>
            <div className="d-flex gap-2 mt-1">
              {houseColors.map((color) => (
                <button key={color.value} type="button" className={`rounded-circle border ${newHouse.color === color.value ? 'border-primary' : 'border-secondary-subtle'}`} style={{ width: 28, height: 28, backgroundColor: color.value }} onClick={() => setNewHouse({ ...newHouse, color: color.value })} />
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleCreateHouse} disabled={!newHouse.name}>Create House</button>
        </div>
      </div>

      {/* House Cards */}
      <div className="row g-3">
        {houses.map((house) => (
          <div key={house.id} className="col-12 col-md-6 col-lg-4">
            <div className="card h-100">
              <div className="card-header py-2 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle border border-white" style={{ width: 20, height: 20, backgroundColor: house.color }} />
                  <span className="fw-semibold">{house.name}</span>
                </div>
                <div className="d-flex gap-1">
                  <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditingHouse(house)} title="Edit"><i className="bi bi-pencil"></i></button>
                  <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteHouse(house.id)} title="Delete"><i className="bi bi-trash"></i></button>
                </div>
              </div>
              <div className="card-body d-grid gap-2">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2"><i className="bi bi-people text-primary"></i><span className="small text-primary">Swimmers</span></div>
                  <span className="badge text-bg-secondary">{house.swimmer_count}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2"><i className="bi bi-trophy text-primary"></i><span className="small text-primary">Points</span></div>
                  <span className="badge" style={{ backgroundColor: house.color, color: 'var(--bs-body-bg)' }}>{house.total_points}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit House */}
      {editingHouse && (
        <div className="card">
          <div className="card-header"><span className="fw-semibold">Edit House</span></div>
          <div className="card-body d-grid gap-2">
            <div>
              <label htmlFor="edit-house-name" className="form-label">House Name</label>
              <input id="edit-house-name" className="form-control" value={editingHouse.name} onChange={(e) => setEditingHouse({ ...editingHouse, name: e.target.value })} />
            </div>
            <div>
              <label className="form-label">House Color</label>
              <div className="d-flex gap-2 mt-1">
                {houseColors.map((color) => (
                  <button key={color.value} type="button" className={`rounded-circle border ${editingHouse.color === color.value ? 'border-primary' : 'border-secondary-subtle'}`} style={{ width: 28, height: 28, backgroundColor: color.value }} onClick={() => setEditingHouse({ ...editingHouse, color: color.value })} />
                ))}
              </div>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary" onClick={handleUpdateHouse}>Update House</button>
              <button className="btn btn-outline-secondary" onClick={() => setEditingHouse(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
