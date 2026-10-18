export type ID = string

export interface User {
  id: ID
  name: string
  handle: string
  email: string
  avatarColor: string
  initials: string
  role: TeamRole
  title: string
}

export type TeamRole = "Owner" | "Admin" | "Manager" | "Member" | "Guest"

export type TaskStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done"

export type TaskPriority = "low" | "medium" | "high" | "urgent"

export type DependencyType =
  | "blocks"
  | "blocked_by"
  | "depends_on"
  | "related_to"
  | "duplicate"
  | "follow_up"
  | "caused_by"

export interface Dependency {
  type: DependencyType
  taskId: ID
}

export interface Subtask {
  id: ID
  title: string
  done: boolean
}

export interface ChecklistItem {
  id: ID
  title: string
  done: boolean
}

export interface Comment {
  id: ID
  authorId: ID
  body: string
  createdAt: string
  reactions?: { emoji: string; count: number }[]
}

export interface Task {
  id: ID
  key: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId?: ID
  collaboratorIds: ID[]
  projectId?: ID
  labels: string[]
  startDate?: string
  dueDate?: string
  estimatedHours?: number
  actualHours?: number
  subtasks: Subtask[]
  checklist: ChecklistItem[]
  dependencies: Dependency[]
  comments: Comment[]
  linkedDocIds: ID[]
  createdAt: string
  updatedAt: string
  order: number
}

export type ProjectStatus = "active" | "on_hold" | "completed" | "archived"
export type ProjectPriority = "low" | "medium" | "high" | "urgent"

export interface Milestone {
  id: ID
  title: string
  dueDate: string
  done: boolean
}

export interface Project {
  id: ID
  name: string
  key: string
  description: string
  status: ProjectStatus
  color: string
  ownerId: ID
  memberIds: ID[]
  teamId: ID
  startDate: string
  dueDate: string
  milestones: Milestone[]
  createdAt: string
  updatedAt?: string
  priority?: ProjectPriority
}

export interface Team {
  id: ID
  name: string
  description: string
  memberIds: ID[]
  color: string
  ownerId?: ID
  memberRoles?: Partial<Record<ID, TeamRole>>
  archived?: boolean
}

export type ActivityType =
  | "task_created"
  | "task_completed"
  | "task_assigned"
  | "status_changed"
  | "priority_changed"
  | "comment_added"
  | "project_updated"
  | "document_edited"
  | "deadline_changed"
  | "team_created"
  | "team_updated"
  | "team_deleted"
  | "member_added"
  | "member_removed"
  | "role_changed"

export interface Activity {
  id: ID
  type: ActivityType
  actorId: ID
  summary: string
  targetId?: ID
  projectId?: ID
  createdAt: string
}

export type NotificationType = "mention" | "assignment" | "comment" | "deadline" | "blocker" | "approval"

export interface AppNotification {
  id: ID
  type: NotificationType
  actorId: ID
  body: string
  sourceLabel: string
  read: boolean
  createdAt: string
}

export interface Goal {
  id: ID
  title: string
  description: string
  ownerId: ID
  scope: "personal" | "team" | "project"
  progress: number
  dueDate: string
  linkedProjectIds: ID[]
}

export interface Doc {
  id: ID
  title: string
  icon: string
  excerpt: string
  authorId: ID
  projectId?: ID
  updatedAt: string
}

export type AutomationTrigger = "task_created" | "task_overdue" | "status_changed" | "priority_changed"
export type AutomationAction = "notify_assignee" | "assign_current_user" | "move_to_review" | "set_high_priority"
export interface Automation { id: ID; name: string; trigger: AutomationTrigger; action: AutomationAction; enabled: boolean; createdAt: string; lastRunAt?: string; runs: number; failures: number }

export interface WorkspaceSettings { workspaceName: string; timezone: string; defaultTaskPriority: TaskPriority; notifications: { assignments: boolean; mentions: boolean; dueDates: boolean; digest: boolean }; reducedMotion: boolean }

export const STATUS_META: Record<TaskStatus, { label: string; short: string }> = {
  backlog: { label: "Backlog", short: "BL" },
  todo: { label: "To Do", short: "TD" },
  in_progress: { label: "In Progress", short: "IP" },
  in_review: { label: "In Review", short: "IR" },
  done: { label: "Done", short: "DN" },
}

export const STATUS_ORDER: TaskStatus[] = ["backlog", "todo", "in_progress", "in_review", "done"]

export const PRIORITY_META: Record<TaskPriority, { label: string; weight: number }> = {
  low: { label: "Low", weight: 1 },
  medium: { label: "Medium", weight: 2 },
  high: { label: "High", weight: 3 },
  urgent: { label: "Urgent", weight: 4 },
}

export const DEPENDENCY_META: Record<DependencyType, { label: string }> = {
  blocks: { label: "Blocks" },
  blocked_by: { label: "Blocked by" },
  depends_on: { label: "Depends on" },
  related_to: { label: "Related to" },
  duplicate: { label: "Duplicate of" },
  follow_up: { label: "Follow-up to" },
  caused_by: { label: "Caused by" },
}
