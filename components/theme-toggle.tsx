"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const isDark = (theme ?? resolvedTheme) === "dark"

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="btn btn-outline-secondary btn-sm"
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <i className={`bi ${isDark ? "bi-sun" : "bi-moon"}`}></i>
    </button>
  )
}
