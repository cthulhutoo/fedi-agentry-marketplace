"use client"

import { ReactNode } from "react"

interface FlexProps {
  children: ReactNode
  col?: boolean
  center?: boolean
  gap?: 0 | 1 | 2 | 4 | 6 | 8
  p?: 0 | 1 | 2 | 4 | 6 | 8
  grow?: boolean
  wrap?: boolean
  width?: "full" | "auto"
  height?: "full" | "auto"
  justify?: "start" | "end" | "center" | "between"
  align?: "start" | "end" | "center"
  className?: string
}

export default function Flex({
  children,
  col = false,
  center = false,
  gap = 0,
  p = 0,
  grow = false,
  wrap = false,
  width,
  height,
  justify,
  align,
  className = "",
}: FlexProps) {
  const classes = [
    "flex",
    col ? "flex-col" : "flex-row",
    center && "justify-center items-center",
    justify && !center && `justify-${justify}`,
    align && !center && `items-${align}`,
    gap > 0 && `gap-${gap}`,
    p > 0 && `p-${p}`,
    grow && "flex-grow",
    wrap && "flex-wrap",
    width === "full" && "w-full",
    width === "auto" && "w-auto",
    height === "full" && "h-full",
    height === "auto" && "h-auto",
    className,
  ]
    .filter(Boolean)
    .join(" ")

  return <div className={classes}>{children}</div>
}
