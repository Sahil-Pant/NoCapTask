"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { PRIORITY_META, STATUS_META, type TaskPriority, type TaskStatus } from "@/lib/types"
import { formatDueLabel } from "@/lib/compute"
import { CalendarClock, CircleDot, CircleDashed, Circle, CircleCheck, Eye } from "lucide-react"

const STATUS_DOT: Record<TaskStatus, string> = {
  backlog: "text-muted-foreground",
  todo: "text-chart-2",
  in_progress: "text-warning",
  in_review: "text-chart-2",
  done: "text-primary",
}

const STATUS_ICON: Record<TaskStatus, typeof Circle> = {
  backlog: CircleDashed,
  todo: Circle,
  in_progress: CircleDot,
  in_review: Eye,
  done: CircleCheck,
}

export function StatusPill({ status, className }: { status: TaskStatus; className?: string }) {
  const Icon = STATUS_ICON[status]
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", className)}>
      <Icon className={cn("size-3.5", STATUS_DOT[status])} />
      {STATUS_META[status].label}
    </span>
  )
}

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: "border-transparent bg-muted text-muted-foreground",
  medium: "border-transparent bg-chart-2/15 text-chart-2",
  high: "border-transparent bg-warning/15 text-warning",
  urgent: "border-transparent bg-destructive/15 text-destructive",
}

export function PriorityBadge({ priority, className }: { priority: TaskPriority; className?: string }) {
  return (
    <Badge className={cn("font-medium", PRIORITY_STYLES[priority], className)}>
      {PRIORITY_META[priority].label}
    </Badge>
  )
}

export function DueBadge({ due, className }: { due?: string; className?: string }) {
  const { text, tone } = formatDueLabel(due)
  if (tone === "none") return null
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        tone === "overdue" && "text-destructive",
        tone === "soon" && "text-warning",
        tone === "normal" && "text-muted-foreground",
        className
      )}
    >
      <CalendarClock className="size-3.5" />
      {text}
    </span>
  )
}

export function PriorityDot({ priority }: { priority: TaskPriority }) {
  const colors: Record<TaskPriority, string> = {
    low: "bg-muted-foreground",
    medium: "bg-chart-2",
    high: "bg-warning",
    urgent: "bg-destructive",
  }
  return <span className={cn("inline-block size-2 rounded-full", colors[priority])} aria-label={`${priority} priority`} />
}

export function LabelChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
      {label}
    </span>
  )
}
