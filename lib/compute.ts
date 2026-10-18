import type { Task, Project, TaskStatus } from "./types"
import { PRIORITY_META } from "./types"

const DAY = 1000 * 60 * 60 * 24

export function daysUntil(iso?: string): number | null {
  if (!iso) return null
  return Math.round((new Date(iso).getTime() - Date.now()) / DAY)
}

export function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === "done") return false
  const du = daysUntil(task.dueDate)
  return du !== null && du < 0
}

export interface PriorityResult {
  score: number
  reasons: string[]
}

// Dynamic priority score out of 100 with human-readable reasons.
export function priorityScore(task: Task, allTasks: Task[], projects: Project[]): PriorityResult {
  const reasons: string[] = []
  let score = 0

  // Base priority weight (max 30)
  const pWeight = PRIORITY_META[task.priority].weight
  score += pWeight * 7.5
  if (task.priority === "urgent") reasons.push("marked urgent")

  // Deadline proximity (max 30)
  const du = daysUntil(task.dueDate)
  if (du !== null) {
    if (du < 0) {
      score += 30
      reasons.push(`overdue by ${Math.abs(du)} day${Math.abs(du) === 1 ? "" : "s"}`)
    } else if (du === 0) {
      score += 28
      reasons.push("due today")
    } else if (du <= 1) {
      score += 24
      reasons.push("due tomorrow")
    } else if (du <= 3) {
      score += 18
      reasons.push(`due in ${du} days`)
    } else if (du <= 7) {
      score += 10
    }
  }

  // Blocking others (max 22)
  const blocks = task.dependencies.filter((dep) => dep.type === "blocks").length
  if (blocks > 0) {
    score += Math.min(blocks * 11, 22)
    reasons.push(`${blocks} other task${blocks === 1 ? "" : "s"} depend${blocks === 1 ? "s" : ""} on it`)
  }

  // Blocked penalty (harder to action)
  const blockedBy = task.dependencies.filter((dep) => dep.type === "blocked_by").length
  if (blockedBy > 0) {
    score -= 6
    reasons.push("currently blocked")
  }

  // Project importance (max 10)
  const project = projects.find((p) => p.id === task.projectId)
  if (project) {
    const pdu = daysUntil(project.dueDate)
    if (pdu !== null && pdu <= 14 && project.status === "active") {
      score += 8
      reasons.push("in a project with a near deadline")
    }
  }

  // Task age nudge (max 8)
  const age = Math.abs(daysUntil(task.createdAt) ?? 0)
  if (age > 7 && task.status !== "done") {
    score += Math.min((age - 7) * 0.8, 8)
    reasons.push("has been sitting for a while")
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  return { score, reasons }
}

export interface HealthResult {
  score: number
  label: "Healthy" | "At Risk" | "Off Track"
  completion: number
  blockers: number
  overdue: number
  daysRemaining: number | null
  velocity: number
}

export function projectHealth(project: Project, allTasks: Task[]): HealthResult {
  const projectTasks = allTasks.filter((t) => t.projectId === project.id)
  const total = projectTasks.length || 1
  const done = projectTasks.filter((t) => t.status === "done").length
  const completion = Math.round((done / total) * 100)

  const blockers = projectTasks.filter((t) =>
    t.dependencies.some((dep) => dep.type === "blocked_by") && t.status !== "done"
  ).length
  const overdue = projectTasks.filter((t) => isOverdue(t)).length
  const daysRemaining = daysUntil(project.dueDate)

  // Velocity proxy: tasks completed recently.
  const velocity = projectTasks.filter((t) => {
    if (t.status !== "done") return false
    const du = daysUntil(t.updatedAt)
    return du !== null && du >= -7
  }).length

  let score = 50 + (completion - 50) * 0.6
  score -= blockers * 8
  score -= overdue * 9
  if (daysRemaining !== null && daysRemaining < 0 && completion < 100) score -= 15
  if (daysRemaining !== null && daysRemaining >= 0 && daysRemaining < 3 && completion < 70) score -= 10
  score += velocity * 3
  if (project.status === "completed") score = 100

  score = Math.max(0, Math.min(100, Math.round(score)))
  const label = score >= 75 ? "Healthy" : score >= 50 ? "At Risk" : "Off Track"

  return { score, label, completion, blockers, overdue, daysRemaining, velocity }
}

// Workload: percentage capacity based on assigned open task estimated hours.
export function userWorkload(userId: string, allTasks: Task[]): number {
  const CAPACITY = 32 // hours "sprint" capacity
  const open = allTasks.filter(
    (t) => t.assigneeId === userId && t.status !== "done"
  )
  const hours = open.reduce((sum, t) => sum + (t.estimatedHours ?? 4), 0)
  return Math.min(100, Math.round((hours / CAPACITY) * 100))
}

export function rankTasks(tasks: Task[], projects: Project[]): Task[] {
  return [...tasks].sort((a, b) => priorityScore(b, tasks, projects).score - priorityScore(a, tasks, projects).score)
}

export function projectStats(projectId: string, allTasks: Task[]) {
  const items = allTasks.filter((task) => task.projectId === projectId)
  const done = items.filter((task) => task.status === "done").length
  const progress = items.length ? Math.round((done / items.length) * 100) : 0
  const health = progress >= 75 ? "Healthy" : progress >= 50 ? "At Risk" : "Off Track"
  return { total: items.length, done, progress, health }
}

export function healthMeta(health: string) {
  const styles = {
    Healthy: "bg-primary/15 text-primary",
    "At Risk": "bg-warning/15 text-warning",
    "Off Track": "bg-destructive/15 text-destructive",
  }
  return { label: health, className: styles[health as keyof typeof styles] ?? styles["At Risk"] }
}

export function formatDueLabel(iso?: string): { text: string; tone: "overdue" | "soon" | "normal" | "none" } {
  const du = daysUntil(iso)
  if (du === null) return { text: "No date", tone: "none" }
  if (du < 0) return { text: `${Math.abs(du)}d overdue`, tone: "overdue" }
  if (du === 0) return { text: "Due today", tone: "soon" }
  if (du === 1) return { text: "Due tomorrow", tone: "soon" }
  if (du <= 3) return { text: `Due in ${du}d`, tone: "soon" }
  return { text: `Due in ${du}d`, tone: "normal" }
}
