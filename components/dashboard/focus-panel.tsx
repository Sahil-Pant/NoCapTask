"use client"

import Link from "next/link"
import { useMemo } from "react"
import { ArrowUpRight, Sparkles } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useDataStore } from "@/lib/store/data-store"
import { rankTasks, priorityScore } from "@/lib/compute"
import { PriorityDot } from "@/components/common/task-badges"
import { UserAvatar } from "@/components/common/user-avatar"
import { formatDueDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useUIStore } from "@/lib/store/ui-store"

export function FocusPanel() {
  const tasks = useDataStore((s) => s.tasks)
  const users = useDataStore((s) => s.users)
  const projects = useDataStore((s) => s.projects)
  const toggleTask = useDataStore((s) => s.toggleTaskDone)
  const openQuickCreate = useUIStore((s) => s.openQuickCreate)

  const focus = useMemo(() => {
    const active = tasks.filter((t) => t.status !== "done")
    return rankTasks(active, projects).slice(0, 5)
  }, [tasks, projects])

  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" />
            Your focus list
          </CardTitle>
          <CardDescription>Ranked by deadline, priority, and blockers. No fluff.</CardDescription>
        </div>
        <Link
          href="/tasks"
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          All tasks
          <ArrowUpRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 p-2">
        {!projects.length ? <div className="rounded-lg px-3 py-8 text-center"><p className="text-sm font-medium">No projects yet</p><p className="mt-1 text-xs text-muted-foreground">Create a project before adding work to your focus list.</p><Button size="sm" className="mt-4" onClick={() => openQuickCreate("project")}>Create project</Button></div> : null}
        {focus.map((task) => {
          const assignee = users.find((m) => m.id === task.assigneeId)
          const score = priorityScore(task, tasks, projects).score
          return (
            <Link
              key={task.id}
              href={`/tasks?task=${task.id}`}
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60"
            >
              <Checkbox
                checked={false}
                onClick={(e) => {
                  e.preventDefault()
                  toggleTask(task.id)
                }}
                aria-label={`Mark ${task.title} done`}
              />
              <PriorityDot priority={task.priority} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-medium">{task.title}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={cn(formatDueDate(task.dueDate).overdue && "text-destructive")}>
                    {formatDueDate(task.dueDate).label}
                  </span>
                  {task.dependencies.some((dependency) => dependency.type === "blocked_by") ? (
                    <Badge variant="outline" className="h-4 border-destructive/40 px-1 text-[10px] text-destructive">
                      blocked
                    </Badge>
                  ) : null}
                </div>
              </div>
              {score >= 70 ? (
                <Badge className="hidden shrink-0 bg-primary/15 text-primary sm:inline-flex">
                  hot
                </Badge>
              ) : null}
              {assignee ? <UserAvatar user={assignee} className="size-6" /> : null}
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
