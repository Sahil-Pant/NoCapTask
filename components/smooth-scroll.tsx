"use client"

import * as React from "react"
import Lenis from "lenis"

// Wraps a scrollable region with Lenis smooth scrolling.
// Respects prefers-reduced-motion by skipping initialization entirely.
export function SmoothScroll({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced || !wrapperRef.current || !contentRef.current) return

    const lenis = new Lenis({
      wrapper: wrapperRef.current,
      content: contentRef.current,
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    })

    let frame = 0
    function raf(time: number) {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [])

  return (
    <div ref={wrapperRef} className={className}>
      <div ref={contentRef}>{children}</div>
    </div>
  )
}
