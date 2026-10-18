"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (v: boolean) => void

  commandOpen: boolean
  setCommandOpen: (v: boolean) => void

  quickCreateOpen: boolean
  quickCreateKind: "task" | "project"
  setQuickCreateOpen: (v: boolean) => void
  openQuickCreate: (kind: "task" | "project") => void

  activeTaskId: string | null
  setActiveTaskId: (id: string | null) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      mobileSidebarOpen: false,
      setMobileSidebarOpen: (v) => set({ mobileSidebarOpen: v }),

      commandOpen: false,
      setCommandOpen: (v) => set({ commandOpen: v }),

      quickCreateOpen: false,
      quickCreateKind: "task",
      setQuickCreateOpen: (v) => set({ quickCreateOpen: v }),
      openQuickCreate: (kind) => set({ quickCreateOpen: true, quickCreateKind: kind }),

      activeTaskId: null,
      setActiveTaskId: (id) => set({ activeTaskId: id }),
    }),
    {
      name: "nocaptask-ui",
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
)
