"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Plus, List, Kanban, Search, GripVertical, Trash2, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDataStore } from "@/lib/store/data-store"
import { useUIStore } from "@/lib/store/ui-store"
import { STATUS_META, type TaskStatus } from "@/lib/types"
import { PriorityBadge, DueBadge } from "@/components/common/task-badges"
import { UserAvatar } from "@/components/common/user-avatar"

const columns: TaskStatus[] = ["backlog", "todo", "in_progress", "in_review", "done"]

export function TaskBoard() {
  const tasks = useDataStore((s) => s.tasks)
  const users = useDataStore((s) => s.users)
  const projects = useDataStore((s) => s.projects)
  const moveTaskInStore = useDataStore((s) => s.moveTask)
  const deleteTask = useDataStore((s) => s.deleteTask)
  const openQuickCreate = useUIStore((s) => s.openQuickCreate)
  const [query, setQuery] = useState("")
  const [view, setView] = useState("board")
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null)
  const [dragOverDelete, setDragOverDelete] = useState(false)
  const [showDeleteZone, setShowDeleteZone] = useState(false)

  const filtered = useMemo(
    () => tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase())),
    [tasks, query],
  )

  const moveTask = (status: TaskStatus, event?: React.DragEvent<HTMLElement>, beforeTaskId?: string) => {
    event?.preventDefault()
    const taskId = event?.dataTransfer.getData("text/plain") || draggedId
    if (taskId) moveTaskInStore(taskId, status, beforeTaskId)
    setDraggedId(null)
    setDragOverStatus(null)
  }

  const removeDraggedTask = () => {
    if (draggedId) deleteTask(draggedId)
    setDraggedId(null)
    setDragOverDelete(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks" className="border-white/10 bg-white/[0.03] pl-9" />
          </div>
          <Tabs value={view} onValueChange={setView}><TabsList><TabsTrigger value="board"><Kanban data-icon="inline-start" />Board</TabsTrigger><TabsTrigger value="list"><List data-icon="inline-start" />List</TabsTrigger></TabsList></Tabs>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-white text-black hover:bg-white/80" onClick={() => openQuickCreate("task")}><Plus data-icon="inline-start" />New task</Button>
          <Button
            variant="outline"
            className={`border-white/15 bg-white/[0.03] transition-all hover:border-white/40 hover:bg-white/[0.08] ${dragOverDelete ? "border-white bg-white text-black shadow-[0_0_28px_rgba(255,255,255,0.2)]" : ""}`}
            onClick={() => setShowDeleteZone((visible) => !visible)}
            onDragOver={(event) => {
              event.preventDefault()
              event.dataTransfer.dropEffect = "move"
              setDragOverDelete(true)
            }}
            onDragLeave={() => setDragOverDelete(false)}
            onDrop={(event) => {
              event.preventDefault()
              removeDraggedTask()
              setShowDeleteZone(false)
            }}
            aria-pressed={showDeleteZone}
            aria-label="Delete task by dragging a task onto this button"
          >
            <Trash2 data-icon="inline-start" />{dragOverDelete ? "Release to delete" : "Delete task"}
          </Button>
        </div>
      </div>

      {view === "board" ? (
        <>
          <div className="grid gap-3 overflow-x-auto lg:grid-cols-5">
            {columns.map((status) => {
              const items = filtered.filter((task) => task.status === status)
              const isOver = dragOverStatus === status
              return (
                <section key={status} onDragOver={(event) => { event.preventDefault(); setDragOverStatus(status) }} onDragLeave={() => setDragOverStatus(null)} onDrop={(event) => moveTask(status, event)} className={`min-w-[230px] rounded-2xl border p-2 transition-all duration-200 ${isOver ? "border-white/70 bg-white/[0.1] shadow-[0_0_30px_rgba(255,255,255,0.08)]" : "border-white/10 bg-white/[0.025]"}`}>
                  <div className="flex items-center justify-between px-2 py-2"><h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{STATUS_META[status].label}</h2><Badge variant="secondary">{items.length}</Badge></div>
                  <div className="flex min-h-32 flex-col gap-2">
                    {items.map((task) => {
                      const project = projects.find((item) => item.id === task.projectId)
                      const assignee = users.find((item) => item.id === task.assigneeId)
                      return <div key={task.id} draggable onDragStart={(event) => { const card = event.currentTarget as HTMLElement; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", task.id); event.dataTransfer.setData("application/x-nocaptask-task", task.id); event.dataTransfer.setDragImage(card, card.offsetWidth / 2, 28); setDraggedId(task.id) }} onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = "move"; setDragOverStatus(status) }} onDrop={(event) => { event.stopPropagation(); moveTask(status, event, task.id) }} onDragEnd={() => { setDraggedId(null); setDragOverStatus(null); setDragOverDelete(false) }} className={`group cursor-grab rounded-xl transition-all active:cursor-grabbing ${draggedId === task.id ? "scale-[1.02] opacity-35 ring-2 ring-white/60" : "hover:-translate-y-0.5"}`}>
                        <Link href={`/tasks?task=${task.id}`}><Card className="border-white/10 bg-black/20 transition-all hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/[0.06]"><CardContent className="flex flex-col gap-3 p-3"><div className="flex items-start justify-between gap-2"><span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground"><GripVertical className="size-3" />{task.key}</span><PriorityBadge priority={task.priority} /></div><p className="text-sm font-medium leading-snug">{task.title}</p><div className="flex items-center justify-between gap-2"><span className="truncate text-xs text-muted-foreground">{project?.name ?? "No project"}</span><div className="flex items-center gap-2"><DueBadge due={task.dueDate} />{assignee ? <UserAvatar user={assignee} className="size-6" /> : null}</div></div></CardContent></Card></Link>
                      </div>
                    })}
                    {isOver && <div className="flex h-12 items-center justify-center rounded-xl border border-dashed border-white/40 text-xs text-muted-foreground">Drop here to move</div>}
                  </div>
                </section>
              )
            })}
          </div>
          {showDeleteZone ? <div onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDragOverDelete(true) }} onDragLeave={() => setDragOverDelete(false)} onDrop={(event) => { event.preventDefault(); const taskId = event.dataTransfer.getData("text/plain") || draggedId; if (taskId) deleteTask(taskId); setDraggedId(null); setDragOverDelete(false); setShowDeleteZone(false) }} className={`flex min-h-16 items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-3 text-sm transition-all duration-200 ${dragOverDelete ? "scale-[1.01] border-white bg-white text-black shadow-[0_0_32px_rgba(255,255,255,0.18)]" : "border-white/20 bg-white/[0.025] text-muted-foreground hover:border-white/45"}`}><Trash2 className="size-4" /><span>{dragOverDelete ? "Release to delete task" : "Drag a task here to delete it"}</span></div> : null}
        </>
      ) : (
        <div className="flex flex-col gap-2">{filtered.map((task) => <Link href={`/tasks?task=${task.id}`} key={task.id}><Card className="border-white/10 bg-white/[0.025] transition-colors hover:border-white/40"><CardContent className="flex items-center gap-3 p-3"><GripVertical className="size-4 text-muted-foreground" /><span className="min-w-0 flex-1 truncate text-sm font-medium">{task.title}</span><PriorityBadge priority={task.priority} /><DueBadge due={task.dueDate} /></CardContent></Card></Link>)}</div>
      )}
      <p className="text-xs text-muted-foreground"><GripVertical className="mr-1 inline size-3" />Drag cards between columns to update status, or drop one on the delete zone.</p>
    </div>
  )
}

export default TaskBoard

