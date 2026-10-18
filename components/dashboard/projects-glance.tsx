"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useDataStore } from "@/lib/store/data-store"
import { projectStats, healthMeta } from "@/lib/compute"
import { cn } from "@/lib/utils"

export function ProjectsGlance() {
  const projects = useDataStore((s) => s.projects)
  const tasks = useDataStore((s) => s.tasks)

  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">Projects in flight</CardTitle>
          <CardDescription>Health checks that do not lie.</CardDescription>
        </div>
        <Link
          href="/projects"
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
          <ArrowUpRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {!projects.length ? <p className="rounded-xl border border-dashed border-border/60 p-5 text-sm text-muted-foreground sm:col-span-2">No active projects yet. Create one to see progress and health here.</p> : null}
        {projects.slice(0, 4).map((project) => {
          const stats = projectStats(project.id, tasks)
          const health = healthMeta(stats.health)
          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group flex flex-col gap-3 rounded-xl border border-border/60 bg-background/40 p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-[3px]"
                    style={{ backgroundColor: project.color }}
                    aria-hidden
                  />
                  <span className="truncate text-sm font-medium">{project.name}</span>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    health.className,
                  )}
                >
                  {health.label}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{stats.done}/{stats.total} done</span>
                  <span className="tabular-nums">{stats.progress}%</span>
                </div>
                <Progress value={stats.progress} className="h-1.5" />
              </div>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
