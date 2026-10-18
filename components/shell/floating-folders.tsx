"use client"

import Link from "next/link"
import { useState } from "react"
import { FileText, Folder, FolderOpen, Plus, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const initialFolders = [{ name: "Launch 2026", count: 12 }, { name: "Brand system", count: 8 }, { name: "Personal focus", count: 5 }]

export function FloatingFolders() {
  const [folders, setFolders] = useState(initialFolders)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState("")
  function addFolder() { const trimmed = name.trim(); if (!trimmed) return; setFolders((current) => [...current, { name: trimmed, count: 0 }]); setName(""); setAdding(false) }
  return <Card className="glass-card fixed bottom-5 right-5 z-30 hidden w-72 shadow-2xl shadow-black/20 lg:block"><CardHeader className="flex-row items-center justify-between p-4"><div><p className="eyebrow">Quick access</p><CardTitle className="mt-1 text-sm">Folders</CardTitle></div><Button variant="ghost" size="icon" aria-label="Add folder" onClick={() => setAdding((value) => !value)}>{adding ? <X /> : <Plus />}</Button></CardHeader><CardContent className="space-y-1 p-2 pt-0">{adding && <div className="flex gap-2 p-2"><Input autoFocus value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addFolder() }} placeholder="New folder" /><Button size="sm" onClick={addFolder}>Add</Button></div>}{folders.map((folder, index) => <Link key={`${folder.name}-${index}`} href={index === 0 ? "/projects" : "/documents"} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-primary/10"><span className="flex size-8 items-center justify-center rounded-lg bg-primary/10"><Folder className="size-4 text-primary" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{folder.name}</span><span className="text-xs text-muted-foreground">{folder.count} items</span></span><FileText className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" /></Link>)}<Link href="/documents" className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:bg-accent"><FolderOpen className="size-3.5" /> Browse all folders</Link></CardContent></Card>
}
