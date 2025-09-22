"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus, Users, Trophy } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
    return <div className="flex items-center justify-center p-8">Loading houses...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">House Management</h2>
          <p className="text-muted-foreground">Manage competition houses and their details</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="button-lift">
              <Plus className="w-4 h-4 mr-2" />
              Add House
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New House</DialogTitle>
              <DialogDescription>Add a new house to the competition</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="house-name">House Name</Label>
                <Input
                  id="house-name"
                  value={newHouse.name}
                  onChange={(e) => setNewHouse({ ...newHouse, name: e.target.value })}
                  placeholder="Enter house name"
                />
              </div>
              <div>
                <Label>House Color</Label>
                <div className="flex gap-2 mt-2">
                  {houseColors.map((color) => (
                    <button
                      key={color.value}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        newHouse.color === color.value ? "border-foreground scale-110" : "border-border"
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setNewHouse({ ...newHouse, color: color.value })}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleCreateHouse} className="w-full">
                Create House
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {houses.map((house) => (
          <Card key={house.id} className="card-hover">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: house.color }}
                  />
                  <CardTitle className="text-lg">{house.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditingHouse(house)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteHouse(house.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Swimmers</span>
                  </div>
                  <Badge variant="secondary">{house.swimmer_count}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Points</span>
                  </div>
                  <Badge className="font-mono font-bold" style={{ backgroundColor: house.color, color: "white" }}>
                    {house.total_points}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingHouse && (
        <Dialog open={!!editingHouse} onOpenChange={() => setEditingHouse(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit House</DialogTitle>
              <DialogDescription>Update house details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-house-name">House Name</Label>
                <Input
                  id="edit-house-name"
                  value={editingHouse.name}
                  onChange={(e) => setEditingHouse({ ...editingHouse, name: e.target.value })}
                />
              </div>
              <div>
                <Label>House Color</Label>
                <div className="flex gap-2 mt-2">
                  {houseColors.map((color) => (
                    <button
                      key={color.value}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        editingHouse.color === color.value ? "border-foreground scale-110" : "border-border"
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setEditingHouse({ ...editingHouse, color: color.value })}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleUpdateHouse} className="w-full">
                Update House
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
