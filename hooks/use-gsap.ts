"use client"

import * as React from "react"
import { gsap } from "gsap"

function prefersReduced(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

// Staggered entrance for direct children marked with [data-reveal].
export function useStaggerReveal(deps: React.DependencyList = []) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const targets = el.querySelectorAll<HTMLElement>("[data-reveal]")
    if (!targets.length) return

    if (prefersReduced()) {
      gsap.set(targets, { opacity: 1, y: 0 })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: "power3.out",
          stagger: 0.06,
        }
      )
    }, el)

    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}

// Simple fade/scale-in on mount for a single element (e.g. modals, palettes).
export function usePopIn<T extends HTMLElement>(active = true) {
  const ref = React.useRef<T>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el || !active) return
    if (prefersReduced()) {
      gsap.set(el, { opacity: 1, scale: 1, y: 0 })
      return
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, scale: 0.97, y: 8 },
        { opacity: 1, scale: 1, y: 0, duration: 0.32, ease: "power3.out" }
      )
    })
    return () => ctx.revert()
  }, [active])

  return ref
}

// Animate a numeric value counting up (for stats).
export function useCountUp(target: number, duration = 1) {
  const [value, setValue] = React.useState(0)

  React.useEffect(() => {
    if (prefersReduced()) {
      setValue(target)
      return
    }
    const obj = { v: 0 }
    const tween = gsap.to(obj, {
      v: target,
      duration,
      ease: "power2.out",
      onUpdate: () => setValue(Math.round(obj.v)),
    })
    return () => {
      tween.kill()
    }
  }, [target, duration])

  return value
}

export function useGsapEntrance(ref: React.RefObject<HTMLElement | null>, selector = "[data-reveal]") {
  return useStaggerReveal([ref, selector])
}

export function useGsapStagger(ref: React.RefObject<HTMLElement | null>, selector = "[data-reveal]") {
  return useStaggerReveal([ref, selector])
}

export { gsap }
