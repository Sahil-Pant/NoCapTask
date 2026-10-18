"use client"

import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useDataStore } from "@/lib/store/data-store"

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { docs, tasks, projects } = useDataStore()
  const doc = docs.find((item) => item.id === id)
  if (!doc) return <Card className="glass-surface"><CardContent className="p-8"><p className="text-sm text-muted-foreground">Document not found.</p><Link href="/documents" className="mt-4 inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-sm font-medium"><ArrowLeft data-icon="inline-start" /> Back to documents</Link></CardContent></Card>
  const linkedTasks = tasks.filter((task) => task.linkedDocIds.includes(doc.id))
  const project = doc.projectId ? projects.find((item) => item.id === doc.projectId) : undefined
  return <div className="space-y-6 pb-12"><Link href="/documents" className="-ml-3 inline-flex h-9 items-center rounded-md px-3 text-sm hover:bg-accent"><ArrowLeft data-icon="inline-start" /> Documents</Link><Card className="glass-surface"><CardContent className="p-7"><div className="flex items-start gap-4"><div className="glass-surface flex size-12 items-center justify-center rounded-2xl"><FileText className="size-5" /></div><div><p className="eyebrow">Shared context</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.05em]">{doc.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{doc.excerpt}</p><p className="mt-4 text-xs text-muted-foreground">{project ? `Linked to ${project.name}` : "Workspace document"} · Updated {new Date(doc.updatedAt).toLocaleDateString()}</p></div></div></CardContent></Card><Card className="glass-surface"><CardContent className="p-6"><h2 className="text-sm font-semibold">Linked work</h2>{linkedTasks.length ? <div className="mt-4 space-y-3">{linkedTasks.map((task) => <Link key={task.id} href={`/tasks?task=${task.id}`} className="block rounded-xl border border-border/50 p-3 hover:bg-accent"><p className="text-sm font-medium">{task.title}</p><p className="mt-1 text-xs text-muted-foreground">{task.status.replace("_", " ")}</p></Link>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No linked tasks yet.</p>}</CardContent></Card></div>
}
