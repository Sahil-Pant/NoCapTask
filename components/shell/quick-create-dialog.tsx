"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUIStore } from "@/lib/store/ui-store"
import { useDataStore } from "@/lib/store/data-store"
import { PRIORITY_META, type TaskPriority } from "@/lib/types"
import { pickRandom } from "@/lib/microcopy"

const DUE_OPTIONS = [
  { value: "none", label: "No due date" },
  { value: "0", label: "Today" },
  { value: "1", label: "Tomorrow" },
  { value: "3", label: "In 3 days" },
  { value: "7", label: "Next week" },
]

export function QuickCreateDialog() {
  const open = useUIStore((s) => s.quickCreateOpen)
  const kind = useUIStore((s) => s.quickCreateKind)
  const setOpen = useUIStore((s) => s.setQuickCreateOpen)
  const allProjects = useDataStore((s) => s.projects)
  const projects = React.useMemo(() => allProjects.filter((project) => project.status === "active"), [allProjects])
  const createTask = useDataStore((s) => s.createTask)
  const createProject = useDataStore((s) => s.createProject)

  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [projectId, setProjectId] = React.useState("unassigned")
  const [priority, setPriority] = React.useState<TaskPriority>("medium")
  const [due, setDue] = React.useState("none")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setTitle("")
      setDescription("")
      setProjectId("unassigned")
      setPriority("medium")
      setDue("none")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function submit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (isSubmitting) return
    if (!title.trim()) {
      toast.error("A task needs a name. Even a bad one.")
      return
    }
    let dueDate: string | undefined
    if (due !== "none") {
      const d = new Date()
      d.setDate(d.getDate() + Number(due))
      dueDate = d.toISOString()
    }
    setIsSubmitting(true)
    try {
      if (kind === "project") {
        createProject(title.trim(), dueDate)
      } else {
        createTask({ title: title.trim(), description: description.trim() || undefined, projectId: projectId === "unassigned" ? undefined : projectId, priority, dueDate })
      }
      setOpen(false)
      toast.success(pickRandom("success"), { description: kind === "project" ? `"${title.trim()}" is ready for tasks.` : `"${title.trim()}" is in the queue.` })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create this task. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.nativeEvent.isComposing || (e as any).keyCode === 229) return
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      submit()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg" onKeyDown={onKeyDown}>
        <DialogHeader>
          <DialogTitle className="font-display">Create a {kind}</DialogTitle>
          <DialogDescription>{kind === "project" ? "Start with a name. You can add structure when the work is ready." : "Add it now, sort it out later. That&apos;s allowed."}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="qc-title">Title</FieldLabel>
            <Input
              id="qc-title"
              autoFocus
              placeholder={kind === "project" ? "What are you building?" : "What needs to happen?"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          {kind === "task" && <Field>
            <FieldLabel htmlFor="qc-desc">Description</FieldLabel>
            <Textarea
              id="qc-desc"
              placeholder="Optional. Add context so future-you isn't confused."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </Field>}

          <div className={`grid grid-cols-1 gap-4 ${kind === "task" ? "sm:grid-cols-3" : "sm:grid-cols-1"}`}>
            {kind === "task" && <>
            <Field>
              <FieldLabel>Project <span className="font-normal text-muted-foreground">optional</span></FieldLabel>
              <Select value={projectId} onValueChange={(value) => setProjectId(value ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue>{() => projects.find((p) => p.id === projectId)?.name ?? "No project"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="unassigned">No project</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            </>}
            {kind === "task" && <Field>
              <FieldLabel>Priority</FieldLabel>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{() => PRIORITY_META[priority].label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {(Object.keys(PRIORITY_META) as TaskPriority[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_META[p].label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>}
            <Field>
              <FieldLabel>Due</FieldLabel>
              <Select value={due} onValueChange={(value) => setDue(value ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue>{() => DUE_OPTIONS.find((o) => o.value === due)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {DUE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </FieldGroup>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating…" : `Create ${kind}`}</Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
