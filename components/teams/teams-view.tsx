"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { MoreHorizontal, Plus, Search, Users } from "lucide-react"
import { toast } from "sonner"
import { AvatarStack } from "@/components/common/user-avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useDataStore } from "@/lib/store/data-store"

export function TeamsView() {
  const teams = useDataStore((state) => state.teams)
  const users = useDataStore((state) => state.users)
  const currentUserId = useDataStore((state) => state.currentUserId)
  const createTeam = useDataStore((state) => state.createTeam)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const activeTeams = teams.filter((team) => !team.archived)
  const visibleTeams = useMemo(() => activeTeams.filter((team) => `${team.name} ${team.description}`.toLowerCase().includes(query.toLowerCase())), [activeTeams, query])
  const activeMembers = new Set(activeTeams.flatMap((team) => team.memberIds)).size

  const create = () => {
    if (saving) return
    setSaving(true)
    try {
      const team = createTeam(name, description)
      toast.success("Team created", { description: `${team.name} is ready for its first project.` })
      setOpen(false); setName(""); setDescription("")
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not create the team.") }
    finally { setSaving(false) }
  }

  return <main className="flex flex-col gap-6 pb-12">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">People behind the work</p><h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.05em]">Teams</h1><p className="mt-2 max-w-xl text-sm text-muted-foreground">A calm, clear view of the people and groups moving work forward.</p></div><Button onClick={() => setOpen(true)} className="rounded-xl"><Plus data-icon="inline-start" />Create team</Button></header>
    <section className="grid gap-3 sm:grid-cols-3"><Stat label="Teams" value={String(activeTeams.length)} /><Stat label="Active members" value={String(activeMembers)} /><Stat label="Invitations" value="Link-based" detail="Manage links from each team" /></section>
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3"><Search className="size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teams" className="border-0 bg-transparent shadow-none focus-visible:ring-0" /></div>
    {visibleTeams.length ? <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleTeams.map((team) => { const members = team.memberIds.map((id) => users.find((user) => user.id === id)).filter((user): user is NonNullable<typeof user> => Boolean(user)); const canManage = ["Owner", "Admin"].includes(team.memberRoles?.[currentUserId] ?? (team.ownerId === currentUserId ? "Owner" : "Member")); return <Card key={team.id} className="glass-surface group transition-transform hover:-translate-y-0.5"><CardHeader className="flex-row items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><Users className="size-5" /></div><div className="min-w-0"><CardTitle className="truncate text-base">{team.name}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{team.memberIds.length} active member{team.memberIds.length === 1 ? "" : "s"}</p></div></div>{canManage && <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Actions for ${team.name}`}><MoreHorizontal /></Button>} /><DropdownMenuContent align="end"><DropdownMenuItem render={<Link href={`/teams/${team.id}`} />}>Manage team</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}</CardHeader><CardContent className="flex flex-col gap-5"><p className="min-h-10 text-sm leading-5 text-muted-foreground">{team.description}</p><div className="flex items-center justify-between"><AvatarStack users={members} /><Badge variant="secondary">Active</Badge></div><Button nativeButton={false} variant="outline" className="w-full" render={<Link href={`/teams/${team.id}`} />}>View team</Button></CardContent></Card>})}</section> : <Card className="glass-surface"><CardContent className="p-12 text-center"><Users className="mx-auto size-8 text-muted-foreground" /><h2 className="mt-4 font-medium">No teams found</h2><p className="mt-1 text-sm text-muted-foreground">Try a different search or create a team to get started.</p></CardContent></Card>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Create team</DialogTitle><DialogDescription>Give the group a clear home. You’ll be added as its owner, then can invite teammates with a link.</DialogDescription></DialogHeader><div className="space-y-4"><label className="block text-sm font-medium">Name<Input className="mt-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Product Design" autoFocus /></label><label className="block text-sm font-medium">Description<Textarea className="mt-2" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What does this team own?" /></label></div><DialogFooter><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={saving || !name.trim()} onClick={create}>{saving ? "Creating…" : "Create team"}</Button></DialogFooter></DialogContent></Dialog>
  </main>
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) { return <Card className="glass-surface"><CardContent className="p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p>{detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}</CardContent></Card> }
