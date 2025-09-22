"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Users, Save, X } from "lucide-react"

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
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Swimmer Management</h2>
        <Card>
          <CardContent className="p-6">
            <div>Loading swimmers...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Swimmer Management</h2>
        <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
          <Plus className="mr-2 h-4 w-4" />
          Add Swimmer
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Swimmer" : "Add New Swimmer"}</CardTitle>
            <CardDescription>{editingId ? "Update swimmer information" : "Enter swimmer details"}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="house">House</Label>
                  <Select
                    value={formData.house_id}
                    onValueChange={(value) => setFormData({ ...formData, house_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select house..." />
                    </SelectTrigger>
                    <SelectContent>
                      {houses.map((house) => (
                        <SelectItem key={house.id} value={house.id.toString()}>
                          {house.name}
                        </SelectItem>
                      ))}
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
                      <SelectValue placeholder="Select age group..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Under 12">Under 12</SelectItem>
                      <SelectItem value="Under 14">Under 14</SelectItem>
                      <SelectItem value="Under 16">Under 16</SelectItem>
                      <SelectItem value="Under 18">Under 18</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {editingId ? "Update" : "Add"} Swimmer
                </Button>
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Swimmers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Registered Swimmers ({swimmers.length})
          </CardTitle>
          <CardDescription>Manage swimmer registrations and information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {swimmers.map((swimmer) => (
              <div key={swimmer.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: swimmer.house_color }} />
                  <div>
                    <div className="font-semibold text-lg">{swimmer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {swimmer.house_name} • {swimmer.age_group} • {swimmer.gender}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{swimmer.house_name}</Badge>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(swimmer)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(swimmer.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {swimmers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No swimmers registered yet.</p>
                <p className="text-sm">Add swimmers to get started with the competition.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
