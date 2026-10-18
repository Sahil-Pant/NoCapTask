"use client"

import { Bell, AtSign, UserPlus, MessageSquare, CalendarClock, Ban, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { useDataStore } from "@/lib/store/data-store"
import { relativeTime } from "@/lib/format"
import { pick } from "@/lib/microcopy"
import { cn } from "@/lib/utils"
import type { NotificationType } from "@/lib/types"

const ICONS: Record<NotificationType, typeof AtSign> = {
  mention: AtSign,
  assignment: UserPlus,
  comment: MessageSquare,
  deadline: CalendarClock,
  blocker: Ban,
  approval: CheckCircle2,
}

export function NotificationsMenu() {
  const notifications = useDataStore((s) => s.notifications)
  const users = useDataStore((s) => s.users)
  const markRead = useDataStore((s) => s.markNotificationRead)
  const markAllRead = useDataStore((s) => s.markAllNotificationsRead)
  const unread = notifications.filter((n) => !n.read).length

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative" />
        }
      >
        <Bell />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unread > 0 ? `${unread} unread` : pick("emptyNotifications")}
            </p>
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="p-6">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Bell />
                </EmptyMedia>
                <EmptyTitle>{pick("emptyNotifications")}</EmptyTitle>
                <EmptyDescription>Nothing needs you right now.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <ul className="p-1">
              {notifications.map((n) => {
                const Icon = ICONS[n.type]
                const actor = users.find((u) => u.id === n.actorId)
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => markRead(n.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent",
                        !n.read && "bg-primary/[0.04]"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                          n.type === "blocker" || n.type === "deadline"
                            ? "bg-destructive/12 text-destructive"
                            : "bg-primary/12 text-primary"
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="flex-1">
                        <p className="text-sm leading-snug text-foreground">
                          <span className="font-medium">{actor?.name}</span>{" "}
                          <span className="text-muted-foreground">{n.body}</span>
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono">{n.sourceLabel}</span>
                          <span>·</span>
                          <span>{relativeTime(n.createdAt)}</span>
                        </div>
                      </div>
                      {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  )
}
