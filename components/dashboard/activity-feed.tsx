"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useDataStore } from "@/lib/store/data-store"
import { UserAvatar } from "@/components/common/user-avatar"
import { relativeTime } from "@/lib/format"
import { useUIStore } from "@/lib/store/ui-store"
import { Sparkles } from "lucide-react"

const VERB: Record<string, string> = {
  created: "created",
  completed: "shipped",
  commented: "commented on",
  assigned: "assigned",
  moved: "moved",
  updated: "updated",
}

export function ActivityFeed() {
  const activity = useDataStore((s) => s.activities)
  const members = useDataStore((s) => s.users)
  const openQuickCreate = useUIStore((s) => s.openQuickCreate)

  return (
    <Card className="flex h-full flex-col border-border/60 bg-card/60">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="size-4 text-primary" />Vibe check</CardTitle>
        <CardDescription>Real moves from your crew, minus the noise.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[340px] px-4 pb-4">
          {!activity.length ? <div className="flex h-[300px] flex-col items-center justify-center px-6 text-center"><span className="text-3xl" aria-hidden>✨</span><p className="mt-3 text-sm font-medium text-foreground">It&apos;s giving fresh start.</p><p className="mt-1 max-w-xs text-sm text-muted-foreground">Create a project or task and this space will keep the receipts.</p><Button size="sm" className="mt-4" onClick={() => openQuickCreate("project")}>Start a project</Button></div> : null}
          <ol className="relative flex flex-col gap-4 border-l border-border/60 pl-4">
            {activity.map((item) => {
              const actor = members.find((m) => m.id === item.actorId)
              return (
                <li key={item.id} className="relative flex items-start gap-3">
                  <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary/70 ring-4 ring-background" />
                  {actor ? <UserAvatar user={actor} className="size-6" /> : null}
                  <div className="flex flex-col gap-0.5 text-sm">
                    <p className="text-pretty leading-snug">
                      <span className="font-medium">{actor?.name ?? "Someone"}</span>{" "}
                      <span className="text-muted-foreground">{VERB[item.type] ?? item.type}</span>{" "}
                      <span className="font-medium">{item.summary}</span>
                    </p>
                    <span className="text-xs text-muted-foreground">{relativeTime(item.createdAt)}</span>
                  </div>
                </li>
              )
            })}
          </ol>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
