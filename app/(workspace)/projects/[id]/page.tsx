"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, CalendarDays, CheckCircle2, AlertTriangle, Users, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/common/page-header"
import { useDataStore } from "@/lib/store/data-store"
import { projectHealth } from "@/lib/compute"
import { formatDate } from "@/lib/format"

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { projects, tasks, users, teams, updateProject, deleteProject } = useDataStore()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const project = projects.find((item) => item.id === id)

  if (!project) {
    return (
      <main className="flex flex-col gap-4">
        <Link href="/projects" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to projects
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <h1 className="text-lg font-semibold">Project not found</h1>
            <p className="text-sm text-muted-foreground">This project may have been removed or is not available in this workspace.</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  const projectTasks = tasks.filter((task) => task.projectId === project.id)
  const health = projectHealth(project, tasks)
  const overdueTasks = projectTasks.filter((task) => task.status !== "done" && task.dueDate && new Date(task.dueDate).getTime() < Date.now())
  const owner = users.find((user) => user.id === project.ownerId)
  const team = teams.find((item) => item.id === project.teamId)

  return (
    <main className="flex flex-col gap-6">
      <Link href="/projects" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to projects
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><PageHeader eyebrow={project.key} title={project.name} description={project.description || "No description yet."} /><div className="flex shrink-0 gap-2"><Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil />Edit</Button><Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)} aria-label="Delete project"><Trash2 /></Button></div></div>
      <div className="flex flex-wrap gap-2"><Badge variant="secondary">{project.status.replace("_", " ")}</Badge><Badge variant="outline">{project.priority ?? "medium"} priority</Badge><Badge variant="outline">{team?.name ?? "Personal workspace"}</Badge><Badge variant="outline"><Users className="mr-1 size-3" />{project.memberIds.length} member{project.memberIds.length === 1 ? "" : "s"}</Badge></div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm">Health</CardTitle></CardHeader><CardContent className="flex flex-col gap-3"><div className="flex items-center justify-between"><span className="text-3xl font-semibold">{health.score}</span><Badge>{health.label}</Badge></div><Progress value={health.score} />{overdueTasks.length ? <p className="flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="size-3" />{overdueTasks.length} overdue task{overdueTasks.length === 1 ? "" : "s"}</p> : <p className="text-xs text-muted-foreground">No overdue tasks.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Progress</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{health.completion}%</p><p className="mt-1 text-sm text-muted-foreground">{projectTasks.filter((task) => task.status === "done").length} of {projectTasks.length} tasks shipped</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Project details</CardTitle></CardHeader><CardContent className="flex flex-col gap-2 text-sm"><div className="flex items-center gap-2"><CalendarDays className="size-4 text-muted-foreground" /><span>{project.dueDate ? `Due ${formatDate(project.dueDate)}` : "No due date"}</span></div><p className="text-muted-foreground">Owner: {owner?.name ?? "Unassigned"}</p></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Project tasks</CardTitle></CardHeader><CardContent className="flex flex-col gap-2">{projectTasks.length ? projectTasks.map((task) => <Link key={task.id} href={`/tasks?task=${task.id}`} className="flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:border-primary/50"><CheckCircle2 className="size-4 text-muted-foreground" /><span className="flex-1 text-sm">{task.title}</span><Badge variant="secondary">{task.status.replace("_", " ")}</Badge></Link>) : <p className="py-6 text-sm text-muted-foreground">No tasks are linked to this project yet.</p>}</CardContent></Card>
      <Dialog open={editing} onOpenChange={setEditing}><ProjectEditor project={project} teams={teams} onCancel={() => setEditing(false)} onSave={(updates) => { updateProject(project.id, updates); setEditing(false) }} /></Dialog>
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}><DialogContent><DialogHeader><DialogTitle>Delete project?</DialogTitle><DialogDescription>This deletes the project only. Its tasks will remain in your workspace without a project so you can reassign them.</DialogDescription></DialogHeader><DialogFooter><Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button><Button variant="destructive" onClick={() => { updateProject(project.id, {}); useDataStore.setState((state) => ({ tasks: state.tasks.map((task) => task.projectId === project.id ? { ...task, projectId: undefined } : task) })); deleteProject(project.id); router.push("/projects") }}>Delete project</Button></DialogFooter></DialogContent></Dialog>
    </main>
  )
}

function ProjectEditor({ project, teams, onSave, onCancel }: { project: ReturnType<typeof useDataStore.getState>["projects"][number]; teams: ReturnType<typeof useDataStore.getState>["teams"]; onSave: (updates: Partial<ReturnType<typeof useDataStore.getState>["projects"][number]>) => void; onCancel: () => void }) {
  const [name, setName] = useState(project.name); const [description, setDescription] = useState(project.description); const [status, setStatus] = useState(project.status); const [priority, setPriority] = useState(project.priority ?? "medium"); const [teamId, setTeamId] = useState(project.teamId); const [dueDate, setDueDate] = useState(project.dueDate?.slice(0, 10) ?? "")
  return <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Edit project</DialogTitle><DialogDescription>Update project details. Changes save to your workspace.</DialogDescription></DialogHeader><div className="grid gap-4"><label className="grid gap-2 text-sm font-medium">Name<Input value={name} onChange={(e) => setName(e.target.value)} /></label><label className="grid gap-2 text-sm font-medium">Description<Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Status<select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="active">In progress</option><option value="on_hold">On hold</option><option value="completed">Completed</option><option value="archived">Archived</option></select></label><label className="grid gap-2 text-sm font-medium">Priority<select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label><label className="grid gap-2 text-sm font-medium">Team<select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">Personal workspace</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label><label className="grid gap-2 text-sm font-medium">Due date<Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label></div></div><DialogFooter><Button variant="ghost" onClick={onCancel}>Cancel</Button><Button disabled={!name.trim()} onClick={() => onSave({ name: name.trim(), description: description.trim(), status, priority, teamId, dueDate })}>Save changes</Button></DialogFooter></DialogContent>
}
