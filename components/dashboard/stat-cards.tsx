"use client"

import { useMemo, useRef } from "react"
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Clock, Flame, Target } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useDataStore } from "@/lib/store/data-store"
import { isOverdue } from "@/lib/compute"
import { useGsapStagger } from "@/hooks/use-gsap"

export function StatCards() {
  const tasks = useDataStore((s) => s.tasks)
  const ref = useRef<HTMLDivElement>(null)
  useGsapStagger(ref, "[data-stat]")

  const stats = useMemo(() => {
    const done = tasks.filter((t) => t.status === "done")
    const active = tasks.filter((t) => t.status !== "done")
    const overdue = active.filter((t) => isOverdue(t))
    const completionRate = tasks.length
      ? Math.round((done.length / tasks.length) * 100)
      : 0

    return [
      {
        label: "Open tasks",
        value: active.length,
        icon: Target,
        trend: "+3 this week",
        trendUp: true,
        tone: "neutral" as const,
      },
      {
        label: "Shipped",
        value: done.length,
        icon: CheckCircle2,
        trend: `${completionRate}% done`,
        trendUp: true,
        tone: "positive" as const,
      },
      {
        label: "Overdue",
        value: overdue.length,
        icon: Clock,
        trend: overdue.length ? "needs attention" : "all clear",
        trendUp: overdue.length === 0,
        tone: overdue.length ? ("negative" as const) : ("positive" as const),
      },
      {
        label: "Completed",
        value: done.length,
        icon: Flame,
        trend: tasks.length ? `${completionRate}% of tasks` : "nothing completed yet",
        trendUp: done.length > 0,
        tone: "accent" as const,
      },
    ]
  }, [tasks])

  return (
    <div ref={ref} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        const TrendIcon = stat.trendUp ? ArrowUpRight : ArrowDownRight
        return (
          <Card
            key={stat.label}
            data-stat
            className="relative overflow-hidden border-border/60 bg-card/60"
          >
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </span>
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md",
                    stat.tone === "accent"
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </span>
              </div>
              <div className="flex items-end justify-between gap-2">
                <span className="font-display text-3xl font-semibold tabular-nums tracking-tight">
                  {stat.value}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-0.5 text-xs font-medium",
                    stat.tone === "negative"
                      ? "text-destructive"
                      : stat.tone === "positive" || stat.tone === "accent"
                        ? "text-primary"
                        : "text-muted-foreground",
                  )}
                >
                  <TrendIcon className="size-3" />
                  {stat.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
