"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("🔄 Submitting login:", { email, password: "***" })
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      console.log("📡 Response status:", response.status)
      const data = await response.json()
      console.log("📊 Response data:", data)

      if (data.success) {
        console.log("✅ Login successful, redirecting to /admin")
        // Use window.location for more reliable redirect
        window.location.href = "/admin"
      } else {
        console.log("❌ Login failed:", data.error)
        setError(data.error || "Login failed")
      }
    } catch (error) {
      console.error("🚨 Network error:", error)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-4 bg-body-tertiary">
      <div className="card w-100" style={{ maxWidth: 420 }}>
        <div className="card-header text-center">
          <div className="d-flex justify-content-center mb-2">
            <i className="bi bi-trophy fs-3 text-primary"></i>
          </div>
          <div className="fw-bold">Swimming Competition</div>
          <div className="small text-body-secondary">Sign in to access the admin dashboard</div>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="d-grid gap-3">
            <div>
              <label htmlFor="email" className="form-label">Email</label>
              <input id="email" type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@swimming.com" required />
            </div>
            <div>
              <label htmlFor="password" className="form-label">Password</label>
              <input id="password" type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
            </div>
            {error && (<div className="alert alert-danger" role="alert">{error}</div>)}
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? (<><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Signing in...</>) : ("Sign In")}
            </button>
          </form>
          <div className="mt-3 text-center small text-body-secondary">
            <div>Demo Credentials:</div>
            <div>Admin: admin@swimming.com / admin123</div>
            <div>Official: official@swimming.com / admin123</div>
          </div>
        </div>
      </div>
    </div>
  )
}
