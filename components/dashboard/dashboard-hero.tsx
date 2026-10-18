"use client"

import { useMemo, useRef } from "react"
import { Command } from "lucide-react"

import { pick } from "@/lib/microcopy"
import { useDataStore } from "@/lib/store/data-store"
import { useUIStore } from "@/lib/store/ui-store"
import { rankTasks } from "@/lib/compute"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { useGsapEntrance } from "@/hooks/use-gsap"

export function DashboardHero() {
  const tasks = useDataStore((s) => s.tasks)
  const projects = useDataStore((s) => s.projects)
  const currentUser = useDataStore((s) => s.currentUser)
  const openCommand = useUIStore((s) => s.setCommandOpen)

  const ref = useRef<HTMLDivElement>(null)
  useGsapEntrance(ref, "[data-hero-item]")

  const subline = projects.length ? pick("dashboardSub", 0) : "Start with a workspace that feels like yours."
  const hello = useMemo(() => `Hey ${currentUser.name.split(" ")[0]}. ${pick("dashboardGreetings", 0)}`, [currentUser.name])

  const topThree = useMemo(() => {
    const active = tasks.filter((t) => t.status !== "done")
    return rankTasks(active, projects).slice(0, 3)
  }, [tasks, projects])

  return (
    <div ref={ref} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p data-hero-item className="text-sm font-medium text-primary">
          {hello}
        </p>
        <h1
          data-hero-item
          className="text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {subline}
        </h1>
        <p data-hero-item className="max-w-xl text-pretty text-sm text-muted-foreground">
          {projects.length ? `You have ${topThree.length} things worth caring about right now. Everything else can wait.` : "Create a project, then add the first task when you are ready."}
        </p>
      </div>

      <button
        data-hero-item
        onClick={() => openCommand(true)}
        className="group flex w-full max-w-md items-center justify-between rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <span>Search anything, run any command...</span>
        <KbdGroup>
          <Kbd>
            <Command className="size-3" />
          </Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </button>
    </div>
  )
}
