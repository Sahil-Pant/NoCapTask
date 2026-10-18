"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { primaryNav, secondaryNav } from "@/lib/nav"
import { useUIStore } from "@/lib/store/ui-store"
import { useDataStore } from "@/lib/store/data-store"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { PanelLeftClose, PanelLeft, Plus, X } from "lucide-react"
import { Logo } from "@/components/shell/logo"

export function Sidebar() {
  const pathname = usePathname()
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggle = useUIStore((s) => s.toggleSidebar)
  const mobileOpen = useUIStore((s) => s.mobileSidebarOpen)
  const setMobileOpen = useUIStore((s) => s.setMobileSidebarOpen)
  const setQuickCreate = useUIStore((s) => s.setQuickCreateOpen)
  const tasks = useDataStore((s) => s.tasks)
  const currentUserId = useDataStore((s) => s.currentUserId)
  const notifications = useDataStore((s) => s.notifications)

  const myOpenTasks = tasks.filter(
    (t) => t.assigneeId === currentUserId && t.status !== "done"
  ).length
  const unreadInbox = notifications.filter((n) => !n.read).length

  const counts: Record<string, number> = {
    "/tasks": myOpenTasks,
    "/inbox": unreadInbox,
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(href + "/")
  }

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileOpen(false) }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [setMobileOpen])

  return (
    <>
      {mobileOpen ? <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/55 lg:hidden" onClick={() => setMobileOpen(false)} /> : null}
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex h-svh shrink-0 -translate-x-full flex-col border-r border-sidebar-border bg-sidebar transition-[width,transform] duration-300 ease-out lg:sticky lg:top-0 lg:z-30 lg:translate-x-0",
        mobileOpen && "translate-x-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-14 items-center gap-2 px-3">
        <Logo collapsed={collapsed} />
        <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X /></Button>
      </div>

      <div className="px-3 pb-2">
        <Button
          onClick={() => setQuickCreate(true)}
          className={cn("w-full justify-start gap-2 font-medium", collapsed && "justify-center px-0")}
        >
          <Plus data-icon="inline-start" />
          {!collapsed && "New task"}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-1 no-scrollbar">
        <ul className="flex flex-col gap-0.5">
          {primaryNav.map((item) => (
            <NavRow
              key={item.href}
              item={item}
              active={isActive(item.href)}
              collapsed={collapsed}
              count={counts[item.href]}
              onNavigate={() => setMobileOpen(false)}
            />
          ))}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border px-3 py-2">
        <ul className="flex flex-col gap-0.5">
          {secondaryNav.map((item) => (
            <NavRow
              key={item.href}
              item={item}
              active={isActive(item.href)}
              collapsed={collapsed}
              onNavigate={() => setMobileOpen(false)}
            />
          ))}
        </ul>
        <button
          onClick={toggle}
          className="mt-1 flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft className="size-4 shrink-0" /> : <PanelLeftClose className="size-4 shrink-0" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
    </>
  )
}

function NavRow({
  item,
  active,
  collapsed,
  count,
  onNavigate,
}: {
  item: (typeof primaryNav)[number]
  active: boolean
  collapsed: boolean
  count?: number
  onNavigate?: () => void
}) {
  const Icon = item.icon
  const content = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group/nav relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-0"
      )}
    >
      {active && !collapsed && (
        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
      )}
      <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && count ? (
        <span className="rounded-full bg-primary/15 px-1.5 text-xs font-semibold text-primary">
          {count}
        </span>
      ) : null}
      {collapsed && count ? (
        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" />
      ) : null}
    </Link>
  )

  if (collapsed) {
    return (
      <li>
        <Tooltip>
          <TooltipTrigger render={content as React.ReactElement} />
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      </li>
    )
  }
  return <li>{content}</li>
}
