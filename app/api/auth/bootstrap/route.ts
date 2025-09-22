import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

async function runBootstrap() {
  try {
    // Create tables if they do not exist
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin','official','viewer')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    // Seed demo users
    const adminEmail = 'admin@swimming.com'
    const officialEmail = 'official@swimming.com'
    const defaultPassword = 'admin123'
    const hash = await bcrypt.hash(defaultPassword, 10)

    await sql`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (${adminEmail}, ${hash}, 'Admin User', 'admin')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
    `

    await sql`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (${officialEmail}, ${hash}, 'Official User', 'official')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
    `

    return NextResponse.json({
      success: true,
      message: "Auth tables ensured and demo users seeded.",
      demoCredentials: [
        { email: adminEmail, password: defaultPassword, role: 'admin' },
        { email: officialEmail, password: defaultPassword, role: 'official' },
      ],
    })
  } catch (error) {
    console.error("Bootstrap error:", error)
    return NextResponse.json({ success: false, error: "Bootstrap failed" }, { status: 500 })
  }
}

export async function POST() {
  return runBootstrap()
}

export async function GET() {
  return runBootstrap()
}
