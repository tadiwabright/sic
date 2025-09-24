"use client"

import type React from "react"

import { useState, useEffect } from "react"

// Local types to avoid importing server-only code
interface House {
  id: number
  name: string
  color: string
}

interface Swimmer {
  id: number
  name: string
  house_id: number
  age_group: string
  gender: string
}

interface SwimmerWithHouse extends Swimmer {
  house_name: string
  house_color: string
}

export function SwimmerManagement() {
  const [swimmers, setSwimmers] = useState<SwimmerWithHouse[]>([])
  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    house_id: "",
    age_group: "",
    gender: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [swimmersRes, housesRes] = await Promise.all([fetch("/api/swimmers"), fetch("/api/houses")])
      const [swimmersJson, housesJson] = await Promise.all([
        swimmersRes.ok ? swimmersRes.json() : Promise.resolve([]),
        housesRes.ok ? housesRes.json() : Promise.resolve([]),
      ])
      setSwimmers((Array.isArray(swimmersJson) ? swimmersJson : []) as SwimmerWithHouse[])
      setHouses(Array.isArray(housesJson) ? housesJson : [])
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/swimmers", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          id: editingId,
          house_id: Number.parseInt(formData.house_id),
        }),
      })

      if (response.ok) {
        await loadData()
        setShowAddForm(false)
        setEditingId(null)
        setFormData({ name: "", house_id: "", age_group: "", gender: "" })
      }
    } catch (error) {
      console.error("Failed to save swimmer:", error)
    }
  }

  const handleEdit = (swimmer: SwimmerWithHouse) => {
    setEditingId(swimmer.id)
    setFormData({
      name: swimmer.name,
      house_id: swimmer.house_id.toString(),
      age_group: swimmer.age_group,
      gender: swimmer.gender,
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this swimmer?")) return

    try {
      const response = await fetch(`/api/swimmers/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await loadData()
      }
    } catch (error) {
      console.error("Failed to delete swimmer:", error)
    }
  }

  const cancelEdit = () => {
    setShowAddForm(false)
    setEditingId(null)
    setFormData({ name: "", house_id: "", age_group: "", gender: "" })
  }

  if (loading) {
    return (
      <div className="d-grid gap-3">
        <h2 className="h4 m-0">Swimmer Management</h2>
        <div className="card"><div className="card-body">Loading swimmers...</div></div>
      </div>
    )
  }

  return (
    <div className="d-grid gap-3">
      <div className="d-flex align-items-center justify-content-between">
        <h2 className="h4 m-0">Swimmer Management</h2>
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)} disabled={showAddForm}>
          <i className="bi bi-person-plus me-2"></i>
          Add Swimmer
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="card">
          <div className="card-header">
            <div className="fw-semibold">{editingId ? "Edit Swimmer" : "Add New Swimmer"}</div>
            <div className="text-body-secondary small">{editingId ? "Update swimmer information" : "Enter swimmer details"}</div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="d-grid gap-3">
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="name" className="form-label">Name</label>
                  <input id="name" className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">House</label>
                  <select className="form-select" value={formData.house_id} onChange={(e) => setFormData({ ...formData, house_id: e.target.value })}>
                    <option value="">Select house...</option>
                    {houses.map((house) => (
                      <option key={house.id} value={house.id.toString()}>{house.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Age Group</label>
                  <select className="form-select" value={formData.age_group} onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}>
                    <option value="">Select age group...</option>
                    <option value="Under 12">Under 12</option>
                    <option value="Under 14">Under 14</option>
                    <option value="Under 16">Under 16</option>
                    <option value="Under 18">Under 18</option>
                    <option value="Open">Open</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                    <option value="">Select gender...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">
                  <i className="bi bi-save me-2"></i>
                  {editingId ? "Update" : "Add"} Swimmer
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={cancelEdit}>
                  <i className="bi bi-x-lg me-2"></i>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Swimmers List */}
      <div className="card">
        <div className="card-header d-flex align-items-center gap-2">
          <i className="bi bi-people"></i>
          <span className="fw-semibold">Registered Swimmers ({swimmers.length})</span>
          <span className="ms-auto small text-body-secondary">Manage swimmer registrations and information</span>
        </div>
        <div className="card-body d-grid gap-2">
          {swimmers.map((swimmer) => (
            <div key={swimmer.id} className="d-flex align-items-center justify-content-between p-3 border rounded-2">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle" style={{ width: 12, height: 12, backgroundColor: swimmer.house_color }} />
                <div>
                  <div className="fw-semibold">{swimmer.name}</div>
                  <div className="small text-primary">{swimmer.house_name} • {swimmer.age_group} • {swimmer.gender}</div>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge text-bg-light">{swimmer.house_name}</span>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => handleEdit(swimmer)} title="Edit"><i className="bi bi-pencil"></i></button>
                <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(swimmer.id)} title="Delete"><i className="bi bi-trash"></i></button>
              </div>
            </div>
          ))}
          {swimmers.length === 0 && (
            <div className="text-center py-5 text-primary">
              <i className="bi bi-people fs-1 opacity-50"></i>
              <p className="m-0">No swimmers registered yet.</p>
              <p className="small m-0">Add swimmers to get started with the competition.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
