"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useUIStore } from "@/lib/store/ui-store"

// Global keyboard shortcuts: Cmd/Ctrl+K palette, C to create, G+<key> navigation.
export function GlobalShortcuts() {
  const router = useRouter()
  const setCommandOpen = useUIStore((s) => s.setCommandOpen)
  const setQuickCreate = useUIStore((s) => s.setQuickCreateOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const pendingG = React.useRef(false)

  React.useEffect(() => {
    function isTyping(target: EventTarget | null) {
      const el = target as HTMLElement | null
      if (!el) return false
      const tag = el.tagName
      return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable
    }

    function onKeyDown(e: KeyboardEvent) {
      // Command palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setCommandOpen(true)
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault()
        toggleSidebar()
        return
      }
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return

      // G-prefixed navigation
      if (pendingG.current) {
        pendingG.current = false
        const map: Record<string, string> = {
          h: "/",
          t: "/tasks",
          i: "/inbox",
          p: "/projects",
        }
        const dest = map[e.key.toLowerCase()]
        if (dest) {
          e.preventDefault()
          router.push(dest)
        }
        return
      }
      if (e.key.toLowerCase() === "g") {
        pendingG.current = true
        setTimeout(() => (pendingG.current = false), 800)
        return
      }
      if (e.key.toLowerCase() === "c") {
        e.preventDefault()
        setQuickCreate(true)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [router, setCommandOpen, setQuickCreate, toggleSidebar])

  return null
}
