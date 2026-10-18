"use client"

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowUpRight, Check, FileText, Inbox, Plus, Search, Trash2, Users, CalendarDays, ListChecks, Pencil, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useDataStore } from "@/lib/store/data-store"
import type { Doc, Goal, Project, Team, User } from "@/lib/types"

type Section = "inbox" | "projects" | "teams" | "calendar" | "documents" | "goals"
type RecordItem = Project | Team | Doc | Goal

const meta: Record<Section, { title: string; eyebrow: string; description: string; icon: typeof Inbox }> = {
  inbox: { title: "Inbox", eyebrow: "Command center", description: "Triage every mention, handoff, and decision without losing the thread.", icon: Inbox },
  projects: { title: "Projects", eyebrow: "Work in motion", description: "A focused operating view for everything your team is building.", icon: FileText },
  teams: { title: "Teams", eyebrow: "People behind the work", description: "Keep ownership, context, and capacity visible across the workspace.", icon: Users },
  calendar: { title: "Calendar", eyebrow: "Time, arranged", description: "A clean runway of deadlines, focus blocks, and shared moments.", icon: CalendarDays },
  documents: { title: "Documents", eyebrow: "Shared context", description: "The briefs, notes, and decisions that make work move faster.", icon: FileText },
  goals: { title: "Goals", eyebrow: "Outcomes over activity", description: "Make progress legible with a direct line from intent to execution.", icon: ListChecks },
}

function titleOf(item: RecordItem) { return "name" in item ? item.name : item.title }
function formatDeadline(value: string) {
  const date = new Date(value)
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()}`
}
function formatActivityDate(value: string) {
  const date = new Date(value)
  const hours = date.getUTCHours()
  const minutes = String(date.getUTCMinutes()).padStart(2, "0")
  const meridiem = hours >= 12 ? "PM" : "AM"
  const hour = hours % 12 || 12
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()}, ${hour}:${minutes}:00 ${meridiem}`
}
function teamSummary(team: Team, users: { id: string; name: string; title: string }[]) {
  return `${team.memberIds.length} members: ${team.memberIds.map((id) => { const user = users.find((candidate) => candidate.id === id); return user ? `${user.name} (${user.title})` : null }).filter(Boolean).join(", ")}`
}
function subtitleOf(item: RecordItem) {
  if ("excerpt" in item) return item.excerpt
  if ("progress" in item) return `${item.progress}% complete · due ${formatDeadline(item.dueDate)}`
  if ("dueDate" in item) return `${item.description} · due ${formatDeadline(item.dueDate)}`
  return item.description
}

export function WorkspaceCrudView({ section }: { section: Section }) {
  const { tasks, projects, teams, docs, goals, notifications, activities, users, createProject, updateProject, deleteProject, createTeam, updateTeam, deleteTeam, addTeamMember, removeTeamMember, createDoc, updateDoc, deleteDoc, createGoal, updateGoal, deleteGoal } = useDataStore()
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<RecordItem | null>(null)
  const [draft, setDraft] = useState("")
  const [deadline, setDeadline] = useState("")
  const [description, setDescription] = useState("")
  const [progress, setProgress] = useState("")
  const [creating, setCreating] = useState(false)
  const info = meta[section]
  const Icon = info.icon
  const records: RecordItem[] = section === "projects" ? projects : section === "teams" ? teams : section === "documents" ? docs : section === "goals" ? goals : []
  const filtered = useMemo(() => records.filter((item) => `${titleOf(item)} ${subtitleOf(item)}`.toLowerCase().includes(query.toLowerCase())), [records, query])
  const inboxItems = notifications.filter((item) => !item.read)
  const calendarItems = tasks.filter((task) => task.dueDate).slice(0, 8)

  const save = () => {
    const value = draft.trim()
    if (!value) return
    if (editing) {
      if (section === "projects") updateProject(editing.id, { name: value, ...(deadline ? { dueDate: deadline } : {}), ...(progress ? { progress: Math.min(100, Math.max(0, Number(progress))) } : {}) })
      if (section === "teams") updateTeam(editing.id, { name: value, description: description.trim() || "Team workspace" })
      if (section === "documents") updateDoc(editing.id, { title: value })
      if (section === "goals") updateGoal(editing.id, { title: value, ...(deadline ? { dueDate: deadline } : {}), ...(progress ? { progress: Math.min(100, Math.max(0, Number(progress))) } : {}) })
    } else {
      if (section === "projects") createProject(value, deadline || undefined)
      if (section === "teams") createTeam(value, description)
      if (section === "documents") createDoc(value)
      if (section === "goals") createGoal(value, deadline || undefined)
    }
    setDraft(""); setDescription(""); setDeadline(""); setProgress(""); setEditing(null); setCreating(false)
  }
  const remove = (item: RecordItem) => {
    if (section === "projects") deleteProject(item.id)
    if (section === "teams") deleteTeam(item.id)
    if (section === "documents") deleteDoc(item.id)
    if (section === "goals") deleteGoal(item.id)
  }

  return <div className="space-y-6 pb-12">
    <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div className="flex items-start gap-4"><div className="glass-surface flex size-12 shrink-0 items-center justify-center rounded-2xl"><Icon className="size-5" /></div><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">{info.eyebrow}</p><h1 className="font-display text-4xl font-semibold tracking-[-0.05em]">{info.title}</h1><p className="mt-2 max-w-xl text-sm text-muted-foreground">{info.description}</p></div></div>
      {section !== "inbox" && section !== "calendar" && <Button onClick={() => { setCreating(true); setEditing(null); setDraft(""); setDescription(""); setDeadline("") }} className="rounded-xl"><Plus data-icon="inline-start" /> New {section === "documents" ? "document" : section.slice(0, -1)}</Button>}
    </header>
    <div className="grid gap-3 sm:grid-cols-3"><Stat label="Visible" value={section === "inbox" ? `${inboxItems.length}` : section === "calendar" ? `${calendarItems.length}` : `${records.length}`} /><Stat label="Active signal" value={section === "goals" ? `${goals.filter((goal) => goal.progress >= 50).length} on track` : section === "projects" ? `${projects.filter((project) => project.status === "active").length} moving` : "Live now"} /><Stat label="Shortcut" value="⌘ K" /></div>
    <Card className="glass-surface overflow-hidden"><CardContent className="p-0">
      <div className="flex flex-col gap-3 border-b border-border/50 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-sm font-medium"><Search className="size-4 text-muted-foreground" /> <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${info.title.toLowerCase()}...`} className="h-9 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" /></div><Badge variant="outline" className="w-fit">{section === "inbox" || section === "calendar" ? "Linked view" : "Editable"}</Badge></div>
      {creating && <Editor value={draft} setValue={setDraft} deadline={deadline} setDeadline={setDeadline} description={description} setDescription={setDescription} showDescription={section === "teams"} showDeadline={section === "projects" || section === "goals"} progress={progress} setProgress={setProgress} showProgress={section === "projects" || section === "goals"} onSave={save} onCancel={() => { setCreating(false); setDeadline("") }} label={`New ${section.slice(0, -1)}`} />}
      {section === "inbox" && inboxItems.map((item, index) => <Row key={item.id} index={index} title={item.body} subtitle={item.sourceLabel} href="/tasks" />)}
      {section === "calendar" && calendarItems.map((item, index) => <Row key={item.id} index={index} title={item.title} subtitle={`Due ${item.dueDate}`} href={`/tasks?task=${item.id}`} />)}
      {section !== "inbox" && section !== "calendar" && filtered.map((item, index) => editing?.id === item.id ? <Editor key={item.id} value={draft} setValue={setDraft} deadline={deadline} setDeadline={setDeadline} description={description} setDescription={setDescription} showDescription={section === "teams"} showDeadline={section === "projects" || section === "goals"} progress={progress} setProgress={setProgress} showProgress={section === "projects" || section === "goals"} onSave={save} onCancel={() => { setEditing(null); setDeadline("") }} label="Edit item" /> : <Row key={item.id} index={index} title={titleOf(item)} subtitle={section === "teams" ? `${subtitleOf(item)} · ${teamSummary(item as Team, users)}` : subtitleOf(item)} href={section === "projects" ? `/projects/${item.id}` : section === "documents" ? `/documents/${item.id}` : `/${section}`} trailing={section === "teams" ? <TeamMembers team={item as Team} users={users} onAdd={addTeamMember} onRemove={removeTeamMember} /> : null} onEdit={() => { setEditing(item); setDraft(titleOf(item)); setDescription("description" in item ? item.description : ""); setDeadline("dueDate" in item ? item.dueDate.slice(0, 10) : ""); setProgress("progress" in item ? String(item.progress) : "") }} onDelete={() => remove(item)} />)}
      {!creating && !filtered.length && section !== "inbox" && section !== "calendar" && <div className="p-12 text-center text-sm text-muted-foreground">Nothing matches this view yet.</div>}
    </CardContent></Card>
    <Card className="glass-surface"><CardContent className="p-5"><div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold">Live workspace tracking</p><p className="text-xs text-muted-foreground">Projects, tasks, deadlines, and team activity update here.</p></div><span className="size-2 animate-pulse rounded-full bg-emerald-400" /></div><div className="space-y-3">{activities.slice(0, 6).map((item) => <div key={item.id} className="flex gap-3 text-xs"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" /><div><p>{users.find((user) => user.id === item.actorId)?.name ?? "Someone"} {item.summary}</p><p className="mt-1 text-muted-foreground">{formatActivityDate(item.createdAt)}</p></div></div>)}</div></CardContent></Card>
  </div>
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="glass-surface rounded-2xl p-4"><p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div> }
function Editor({ value, setValue, deadline, setDeadline, description, setDescription, showDescription, showDeadline, progress, setProgress, showProgress, onSave, onCancel, label }: { value: string; setValue: (value: string) => void; deadline: string; setDeadline: (value: string) => void; description: string; setDescription: (value: string) => void; showDescription: boolean; showDeadline: boolean; progress: string; setProgress: (value: string) => void; showProgress: boolean; onSave: () => void; onCancel: () => void; label: string }) { return <div className="flex flex-col gap-3 border-b border-border/50 p-4"><div className="flex gap-2"><Textarea autoFocus value={value} onChange={(event) => setValue(event.target.value)} placeholder={label} className="min-h-10 resize-none" /><Button onClick={onSave} size="icon" aria-label="Save"><Check /></Button><Button onClick={onCancel} size="icon" variant="ghost" aria-label="Cancel"><X /></Button></div>{showDescription && <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What is this team for?" />}{showDeadline && <label className="flex items-center gap-3 text-xs text-muted-foreground"><span className="min-w-24">Custom deadline</span><Input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="h-9 max-w-48" /></label>}{showProgress && <label className="flex items-center gap-3 text-xs text-muted-foreground"><span className="min-w-24">Completion %</span><Input type="number" min="0" max="100" value={progress} onChange={(event) => setProgress(event.target.value)} placeholder="0–100" className="h-9 max-w-28" /></label>}</div> }
function TeamMembers({ team, users, onAdd, onRemove }: { team: Team; users: User[]; onAdd: (teamId: string, userId: string) => void; onRemove: (teamId: string, userId: string) => void }) {
  const available = users.filter((user) => !team.memberIds.includes(user.id))
  return <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
    <select aria-label={`Add member to ${team.name}`} defaultValue="" onChange={(event) => { if (event.target.value) onAdd(team.id, event.target.value); event.target.value = "" }} className="h-8 max-w-28 rounded-md border border-border bg-background px-2 text-[11px]">
      <option value="">Add member</option>{available.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
    </select>
    {team.memberIds.map((id) => { const user = users.find((candidate) => candidate.id === id); return user ? <Button key={id} onClick={() => onRemove(team.id, id)} size="icon" variant="ghost" className="size-8" aria-label={`Remove ${user.name} from ${team.name}`} title={`Remove ${user.name}`}><X className="size-3" /></Button> : null })}
  </div> }

function Row({ title, subtitle, href, index, trailing, onEdit, onDelete }: { title: string; subtitle?: string; href: string; index: number; trailing?: ReactNode; onEdit?: () => void; onDelete?: () => void }) { return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="group flex items-center gap-3 border-b border-border/40 p-4 last:border-0 hover:bg-foreground/[0.03]"><div className="size-1.5 rounded-full bg-foreground/45" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{title}</p>{subtitle && <p className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</p>}</div>{trailing}{onEdit && <Button onClick={onEdit} size="icon" variant="ghost" className="opacity-0 transition-opacity group-hover:opacity-100" aria-label={`Edit ${title}`}><Pencil /></Button>}{onDelete && <Button onClick={onDelete} size="icon" variant="ghost" className="opacity-0 text-muted-foreground transition-opacity group-hover:opacity-100 hover:text-foreground" aria-label={`Delete ${title}`}><Trash2 /></Button>}<Link href={href} className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground" aria-label={`Open ${title}`}><ArrowUpRight className="size-4" /></Link></motion.div> }

export default WorkspaceCrudView
