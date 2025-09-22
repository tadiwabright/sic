import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { AdminDashboard } from "@/components/admin-dashboard"

export default async function AdminPage() {
  console.log("🔍 Admin page: Checking authentication...")
  
  const user = await getCurrentUser()
  console.log("👤 Current user:", user)

  if (!user) {
    console.log("❌ No user found, redirecting to login")
    redirect("/login")
  }

  if (user.role !== "admin" && user.role !== "official") {
    console.log("❌ User role not authorized:", user.role)
    redirect("/login")
  }

  console.log("✅ User authorized, showing admin dashboard")
  return <AdminDashboard />
}
