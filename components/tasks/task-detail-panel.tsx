"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, Edit3, MessageCircle, Save, Send, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useDataStore } from "@/lib/store/data-store"
import type { Task } from "@/lib/types"
import { PriorityBadge, DueBadge } from "@/components/common/task-badges"

export function TaskDetailPanel() {
  const router = useRouter()
  const params = useSearchParams()
  const taskId = params.get("task")
  const task = useDataStore((state) => state.tasks.find((item) => item.id === taskId))
  const toggleTaskDone = useDataStore((state) => state.toggleTaskDone)
  const updateTask = useDataStore((state) => state.updateTask)
  const deleteTask = useDataStore((state) => state.deleteTask)
  const toggleSubtask = useDataStore((state) => state.toggleSubtask)
  const addComment = useDataStore((state) => state.addComment)
  const users = useDataStore((state) => state.users)
  const [comment, setComment] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState({ title: "", description: "", priority: "medium" as Task["priority"], dueDate: "", projectId: "" })
  const author = users[0]
  const comments = useMemo(() => task?.comments ?? [], [task])

  useEffect(() => {
    if (!task) return
    setDraft({
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
      dueDate: task.dueDate ?? "",
      projectId: task.projectId ?? "unassigned",
    })
  }, [task])

  if (!task) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-foreground/20 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Task details for ${task.title}`}>
      <button className="absolute inset-0 cursor-default" aria-label="Close task details" onClick={() => router.push("/tasks")} />
      <Card className="relative z-10 h-full w-full max-w-xl overflow-y-auto rounded-none border-y-0 border-r-0 shadow-2xl">
        <CardHeader className="flex flex-row items-start justify-between gap-4 border-b">
          <div className="flex min-w-0 flex-1 flex-col gap-2"><span className="font-mono text-xs text-muted-foreground">{task.key}</span><CardTitle className="text-xl text-balance">{task.title}</CardTitle><div className="flex items-center gap-2"><PriorityBadge priority={task.priority} /><DueBadge due={task.dueDate} /></div></div>
          <div className="flex items-center gap-1"><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => { if (window.confirm(`Delete ${task.title}?`)) { deleteTask(task.id); router.push("/tasks") } }} aria-label="Delete task"><Trash2 /></Button><Button variant="ghost" size="icon" onClick={() => setIsEditing((value) => !value)} aria-label={isEditing ? "Close edit task" : "Edit task"}><Edit3 /></Button><Button variant="ghost" size="icon" onClick={() => router.push("/tasks")} aria-label="Close"><X /></Button></div>
        </CardHeader>
        <CardContent className="flex flex-col gap-7 p-6">
          {isEditing ? (
            <section className="flex flex-col gap-4 rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Edit task</h2><span className="text-xs text-muted-foreground">Update the essentials</span></div>
              <label className="flex flex-col gap-2 text-xs font-medium">Title<input className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" value={draft.title} onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))} /></label>
              <label className="flex flex-col gap-2 text-xs font-medium">Description<textarea className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" value={draft.description} onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))} /></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs font-medium">Priority<select className="h-10 rounded-md border border-border bg-background px-3 text-sm" value={draft.priority} onChange={(event) => setDraft((value) => ({ ...value, priority: event.target.value as Task["priority"] }))}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
                <label className="flex flex-col gap-2 text-xs font-medium">Due date<input type="date" className="h-10 rounded-md border border-border bg-background px-3 text-sm" value={draft.dueDate} onChange={(event) => setDraft((value) => ({ ...value, dueDate: event.target.value }))} /></label>
              </div>
              <label className="flex flex-col gap-2 text-xs font-medium">Project<select className="h-10 rounded-md border border-border bg-background px-3 text-sm" value={draft.projectId} onChange={(event) => setDraft((value) => ({ ...value, projectId: event.target.value }))}><option value="unassigned">No project</option>{useDataStore.getState().projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
              <Button disabled={!draft.title.trim()} onClick={() => { updateTask(task.id, { title: draft.title.trim(), description: draft.description.trim(), priority: draft.priority, dueDate: draft.dueDate || undefined, projectId: draft.projectId === "unassigned" ? undefined : draft.projectId }); setIsEditing(false) }}><Save data-icon="inline-start" />Save changes</Button>
            </section>
          ) : <p className="text-sm leading-6 text-muted-foreground">{task.description || "No description yet. Add context so the next person does not have to guess."}</p>}
          <Button onClick={() => toggleTaskDone(task.id)} variant={task.status === "done" ? "outline" : "default"}><Check data-icon="inline-start" />{task.status === "done" ? "Reopen task" : "Mark complete"}</Button>
          <section className="flex flex-col gap-3"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Checklist</h2><Badge variant="secondary">{task.subtasks.filter((item) => item.done).length}/{task.subtasks.length}</Badge></div>{task.subtasks.map((item) => <button key={item.id} className="flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors hover:bg-muted/50" onClick={() => toggleSubtask(task.id, item.id)}><span className={`flex size-5 items-center justify-center rounded border ${item.done ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{item.done ? <Check /> : null}</span><span className={item.done ? "text-muted-foreground line-through" : ""}>{item.title}</span></button>)}</section>
          <section className="flex flex-col gap-3"><h2 className="flex items-center gap-2 text-sm font-semibold"><MessageCircle />Discussion</h2>{comments.map((item) => <div key={item.id} className="rounded-lg bg-muted/50 p-3 text-sm"><p>{item.body}</p><p className="mt-2 text-xs text-muted-foreground">{users.find((user) => user.id === item.authorId)?.name || author?.name}</p></div>)}<div className="flex gap-2"><Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a comment" aria-label="Add a comment" /><Button size="icon" aria-label="Send comment" disabled={!comment.trim()} onClick={() => { addComment(task.id, comment.trim()); setComment("") }}><Send /></Button></div></section>
        </CardContent>
      </Card>
    </div>
  )
}

export default TaskDetailPanel
