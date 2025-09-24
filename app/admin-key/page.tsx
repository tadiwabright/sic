"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
// Converted to Bootstrap components; removed shadcn/ui and lucide-react

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
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3 bg-body-tertiary">
      <div className="card shadow-sm" style={{ maxWidth: 420, width: "100%" }}>
        <div className="card-header text-center bg-body">
          <div className="d-flex justify-content-center mb-2">
            <i className="bi bi-key-fill fs-1 text-primary"></i>
          </div>
          <h2 className="h4 mb-1">Admin Access</h2>
          <div className="text-body-secondary small">Enter the secret key to access the admin dashboard</div>
        </div>
        <div className="card-body">
          <form onSubmit={submit} className="d-grid gap-3">
            <div>
              <label className="form-label">Secret key</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter secret key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Checking...
                </>
              ) : (
                <>Enter</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

