import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { AdminDashboard } from "@/components/admin-dashboard"

export default async function SecretAdminPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "admin" && user.role !== "official") {
    redirect("/login")
  }

  return <AdminDashboard />
}
