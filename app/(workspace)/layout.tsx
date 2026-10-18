import type React from "react"
import { Sidebar } from "@/components/shell/sidebar"
import { TopNav } from "@/components/shell/top-nav"
import { SmoothScroll } from "@/components/smooth-scroll"
import { CommandPalette } from "@/components/shell/command-palette"
import { QuickCreateDialog } from "@/components/shell/quick-create-dialog"
import { GlobalShortcuts } from "@/components/shell/global-shortcuts"
import { MotionShell } from "@/components/shell/motion-shell"
import { GlobalCursorLens } from "@/components/shell/global-cursor-lens"

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-svh overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-70 [background-image:radial-gradient(circle_at_15%_0%,hsl(var(--foreground)/0.08),transparent_28%),radial-gradient(circle_at_100%_100%,hsl(var(--foreground)/0.06),transparent_24%)]" />
      <Sidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <TopNav />
        <SmoothScroll className="h-[calc(100svh-3.5rem)] overflow-y-auto">
          <MotionShell>
            <main className="stagger-children mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 lg:px-8">
              {children}
            </main>
          </MotionShell>
        </SmoothScroll>
      </div>
      <CommandPalette />
      <QuickCreateDialog />
      <GlobalShortcuts />
      <GlobalCursorLens />
    </div>
  )
}
