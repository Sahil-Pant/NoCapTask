"use client"

import Link from "next/link"
import { ArrowUpRight, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useDataStore } from "@/lib/store/data-store"
import { useUIStore } from "@/lib/store/ui-store"
import { projectHealth } from "@/lib/compute"

export function ProjectsGrid() {
  const projects = useDataStore((s) => s.projects)
  const tasks = useDataStore((s) => s.tasks)
  const openQuickCreate = useUIStore((s) => s.openQuickCreate)
  return <div className="flex flex-col gap-4"><div className="flex justify-end"><Button onClick={() => openQuickCreate("project")}><Plus data-icon="inline-start" />New project</Button></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{projects.map((project) => { const health = projectHealth(project, tasks); return <Link href={`/projects/${project.id}`} key={project.id}><Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/50"><CardHeader className="flex-row items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="size-3 rounded-[4px]" style={{ backgroundColor: project.color }} /><div><CardTitle className="text-base">{project.name}</CardTitle><p className="mt-1 font-mono text-xs text-muted-foreground">{project.key}</p></div></div><ArrowUpRight className="size-4 text-muted-foreground" /></CardHeader><CardContent className="flex flex-col gap-4"><p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{project.description}</p><div className="flex items-center justify-between text-xs"><Badge variant="secondary">{health.label}</Badge><span className="text-muted-foreground">{health.completion}% complete</span></div><Progress value={health.completion} /></CardContent></Card></Link> })}</div></div>
}
