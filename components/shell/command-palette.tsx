"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import gsap from "gsap"
import {
  CheckCircle2,
  FolderKanban,
  Home,
  ListTodo,
  Moon,
  Plus,
  Search,
  Sun,
  Users,
  Zap,
} from "lucide-react"
import { useTheme } from "next-themes"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useUIStore } from "@/lib/store/ui-store"
import { useDataStore } from "@/lib/store/data-store"
import { NAV_ITEMS } from "@/lib/nav"
import { PriorityDot } from "@/components/common/task-badges"
import { pickFrom } from "@/lib/microcopy"

const ICONS = { Home, ListTodo, FolderKanban, Users, Zap } as const

export function CommandPalette() {
  const router = useRouter()
  const { setTheme, resolvedTheme } = useTheme()
  const open = useUIStore((s) => s.commandOpen)
  const setOpen = useUIStore((s) => s.setCommandOpen)
  const openQuickCreate = useUIStore((s) => s.openQuickCreate)

  const tasks = useDataStore((s) => s.tasks)
  const projects = useDataStore((s) => s.projects)
  const members = useDataStore((s) => s.members)

  const listRef = useRef<HTMLDivElement>(null)
  const [emptyLine] = useState(() => pickFrom("emptySearch"))
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (open) setQuery("")
  }, [open])

  const normalizedQuery = query.trim().toLowerCase()
  const matches = (value: string) =>
    !normalizedQuery || value.toLowerCase().includes(normalizedQuery)

  const topTasks = useMemo(
    () => tasks.filter((t) => t.status !== "done").slice(0, 6),
    [tasks],
  )

  const filteredNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => matches(`${item.label} ${item.href}`)),
    [normalizedQuery],
  )
  const filteredTasks = useMemo(
    () => topTasks.filter((task) => matches(`task ${task.title} ${task.priority}`)),
    [normalizedQuery, topTasks],
  )
  const filteredProjects = useMemo(
    () => projects.filter((project) => matches(`project ${project.name}`)),
    [normalizedQuery, projects],
  )
  const filteredMembers = useMemo(
    () => members.filter((member) => matches(`person ${member.name} ${member.role}`)),
    [normalizedQuery, members],
  )
  const hasResults =
    filteredNavItems.length +
      filteredTasks.length +
      filteredProjects.length +
      filteredMembers.length >
    0

  useEffect(() => {
    if (open && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-slot='command-item']")
      gsap.fromTo(
        items,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.28, stagger: 0.015, ease: "power2.out", overwrite: true },
      )
    }
  }, [open])

  const go = (path: string) => {
    setOpen(false)
    router.push(path)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Search and run commands"
      className="overflow-hidden border-border/60"
    >
      <Command shouldFilter={false}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search tasks, projects, people, or run a command..."
      />
      <CommandList ref={listRef} className="max-h-[420px]">
        <CommandEmpty>
          <div className="flex flex-col items-center gap-1 py-6 text-center">
            <Search className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-pretty">{emptyLine}</p>
          </div>
        </CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              setOpen(false)
              openQuickCreate("task")
            }}
          >
            <Plus />
            <span>Create task</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setOpen(false)
              openQuickCreate("project")
            }}
          >
            <FolderKanban />
            <span>Create project</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setOpen(false)
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }}
          >
            {resolvedTheme === "dark" ? <Sun /> : <Moon />}
            <span>Toggle theme</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          {filteredNavItems.map((item) => {
            const Icon = ICONS[item.icon as unknown as keyof typeof ICONS] ?? Home
            return (
              <CommandItem key={item.href} onSelect={() => go(item.href)}>
                <Icon />
                <span>{item.label}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>

        {filteredTasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tasks">
              {filteredTasks.map((task) => (
                <CommandItem
                  key={task.id}
                  value={`task ${task.title}`}
                  onSelect={() => go(`/tasks?task=${task.id}`)}
                >
                  <PriorityDot priority={task.priority} />
                  <span className="truncate">{task.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

          <CommandGroup heading="Projects">
          {filteredProjects.map((project) => (
            <CommandItem
              key={project.id}
              value={`project ${project.name}`}
              onSelect={() => go(`/projects/${project.id}`)}
            >
              <span
                className="size-2.5 rounded-[3px]"
                style={{ backgroundColor: project.color }}
                aria-hidden
              />
              <span className="truncate">{project.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="People">
          {filteredMembers.map((member) => (
            <CommandItem
              key={member.id}
              value={`person ${member.name}`}
              onSelect={() => go(`/team?member=${member.id}`)}
            >
              <Users />
              <span className="truncate">{member.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{member.role}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      </Command>
    </CommandDialog>
  )
}
