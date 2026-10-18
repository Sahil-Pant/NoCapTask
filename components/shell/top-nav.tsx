"use client"

import { Search, Plus, ChevronsUpDown, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/common/theme-toggle"
import { NotificationsMenu } from "@/components/shell/notifications-menu"
import { ProfileMenu } from "@/components/shell/profile-menu"
import { useUIStore } from "@/lib/store/ui-store"
import { useDataStore } from "@/lib/store/data-store"

export function TopNav() {
  const setCommandOpen = useUIStore((s) => s.setCommandOpen)
  const setQuickCreate = useUIStore((s) => s.setQuickCreateOpen)
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen)

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md md:px-4">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileSidebarOpen(true)} aria-label="Open navigation"><Menu /></Button>
      <WorkspaceSwitcher />

      <Separator orientation="vertical" className="mx-1 hidden h-5 md:block" />

      <button
        onClick={() => setCommandOpen(true)}
        className="group flex h-9 max-w-md flex-1 items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search everything...</span>
        <span className="sm:hidden">Search</span>
        <Kbd className="ml-auto hidden sm:inline-flex">⌘K</Kbd>
      </button>

      <div className="ml-auto flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="hidden gap-1.5 md:inline-flex"
          onClick={() => setQuickCreate(true)}
        >
          <Plus data-icon="inline-start" />
          Create
        </Button>
        <ThemeToggle />
        <NotificationsMenu />
        <ProfileMenu />
      </div>
    </header>
  )
}

function WorkspaceSwitcher() {
  const workspaceName = useDataStore((state) => state.settings.workspaceName)
  return (
    <div className="flex h-9 items-center gap-2 px-2 font-medium" aria-label={`Current workspace: ${workspaceName}`}>
      <span className="flex size-6 items-center justify-center rounded-md bg-primary/15 text-xs font-bold text-primary">
        {workspaceName.charAt(0).toUpperCase()}
      </span>
      <span className="hidden max-w-40 truncate text-sm sm:inline">{workspaceName}</span>
      <ChevronsUpDown className="size-3.5 text-muted-foreground" aria-hidden />
    </div>
  )
}
