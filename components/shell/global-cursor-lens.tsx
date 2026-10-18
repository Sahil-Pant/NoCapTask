'use client'

import { useEffect, useRef } from 'react'

export function GlobalCursorLens() {
  const lensRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouchDevice || reducedMotion.matches) return

    let frame = 0
    let active = false
    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let currentX = targetX
    let currentY = targetY

    const onPointerMove = (event: PointerEvent) => {
      targetX = event.clientX
      targetY = event.clientY
      active = true
    }

    const render = () => {
      currentX += (targetX - currentX) * 0.18
      currentY += (targetY - currentY) * 0.18
      const x = `${currentX}px`
      const y = `${currentY}px`
      lensRef.current?.style.setProperty('left', x)
      lensRef.current?.style.setProperty('top', y)
      glowRef.current?.style.setProperty('left', x)
      glowRef.current?.style.setProperty('top', y)
      lensRef.current?.toggleAttribute('data-active', active)
      glowRef.current?.toggleAttribute('data-active', active)
      frame = requestAnimationFrame(render)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    frame = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <>
      <div ref={glowRef} className="global-cursor-glow" aria-hidden="true" />
      <div ref={lensRef} className="global-cursor-lens" aria-hidden="true" />
    </>
  )
}
