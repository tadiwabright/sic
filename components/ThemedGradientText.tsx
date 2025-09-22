"use client"

import React from "react"
import GradientText from "./GradientText"

interface Props {
  as?: keyof React.JSX.IntrinsicElements
  className?: string
  children: React.ReactNode
}

export default function ThemedGradientText({ as = "div", className = "", children }: Props) {
  return (
    <GradientText
      as={as as any}
      colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
      animationSpeed={3}
      showBorder={false}
      className={className}
    >
      {children}
    </GradientText>
  )
}
