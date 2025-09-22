"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { KeyRound } from "lucide-react"

export default function AdminKeyPage() {
  const [key, setKey] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      })
      const data = await res.json()
      if (data.success) {
        router.push("/admin")
      } else {
        setError(data.error || "Invalid key")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <KeyRound className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
          <CardDescription>Enter the secret key to access the admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter secret key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
            />
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Checking..." : "Enter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
