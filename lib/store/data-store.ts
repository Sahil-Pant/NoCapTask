"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  Task,
  Project,
  ProjectPriority,
  Team,
  User,
  Activity,
  AppNotification,
  Goal,
  Doc,
  TaskStatus,
  TaskPriority,
  Comment,
  TeamRole,
  Automation,
  AutomationAction,
  AutomationTrigger,
  WorkspaceSettings,
} from "@/lib/types"
const emptyUser: User = {
  id: "",
  name: "there",
  handle: "",
  email: "",
  avatarColor: "oklch(0.78 0.19 205)",
  initials: "?",
  role: "Owner",
  title: "",
}

interface DataState {
  tasks: Task[]
  projects: Project[]
  teams: Team[]
  users: User[]
  activities: Activity[]
  notifications: AppNotification[]
  goals: Goal[]
  docs: Doc[]
  currentUserId: string
  currentUser: User
  members: User[]
  activity: Activity[]
  automations: Automation[]
  settings: WorkspaceSettings

  // mutations
  updateTaskStatus: (taskId: string, status: TaskStatus, order?: number) => void
  moveTask: (taskId: string, status: TaskStatus, beforeTaskId?: string) => void
  updateTaskPriority: (taskId: string, priority: TaskPriority) => void
  updateTaskAssignee: (taskId: string, assigneeId: string | undefined) => void
  updateTask: (taskId: string, updates: Partial<Pick<Task, "title" | "description" | "priority" | "dueDate" | "projectId">>) => void
  toggleTaskDone: (taskId: string) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  addComment: (taskId: string, body: string) => void
  createTask: (input: Partial<Task> & { title: string }) => Task
  deleteTask: (taskId: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  archiveNotification: (id: string) => void
  createProject: (name: string, dueDate?: string, options?: { description?: string; teamId?: string; status?: Project["status"]; priority?: ProjectPriority; startDate?: string }) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  createTeam: (name: string, description?: string, memberIds?: string[]) => Team
  updateTeam: (id: string, updates: Partial<Team>) => void
  deleteTeam: (id: string) => void
  addTeamMember: (teamId: string, userId: string) => void
  addTeamMembers: (teamId: string, userIds: string[]) => void
  removeTeamMember: (teamId: string, userId: string) => void
  changeTeamMemberRole: (teamId: string, userId: string, role: TeamRole) => void
  createDoc: (title: string) => void
  updateDoc: (id: string, updates: Partial<Doc>) => void
  deleteDoc: (id: string) => void
  createGoal: (title: string, dueDate?: string) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  createAutomation: (input: Pick<Automation, "name" | "trigger" | "action">) => void
  toggleAutomation: (id: string) => void
  deleteAutomation: (id: string) => void
  updateSettings: (updates: Partial<Omit<WorkspaceSettings, "notifications">> & { notifications?: Partial<WorkspaceSettings["notifications"]> }) => void
  updateCurrentUser: (updates: Partial<Pick<User, "name" | "handle" | "title">>) => void
}

function now(): string {
  return new Date().toISOString()
}

function clientId(prefix: string): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return `${prefix}-${uuid}`
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function logActivity(
  set: (fn: (state: DataState) => Partial<DataState>) => void,
  activity: Omit<Activity, "id" | "createdAt">
) {
  set((state) => ({
    activities: [
      { ...activity, id: `act-${Math.random().toString(36).slice(2, 8)}`, createdAt: now() },
      ...state.activities,
    ],
  }))
}

function roleFor(team: Team, userId: string, users: User[]): TeamRole | undefined {
  if (!team.memberIds.includes(userId)) return undefined
  return team.memberRoles?.[userId] ?? (team.ownerId === userId ? "Owner" : users.find((user) => user.id === userId)?.role ?? "Member")
}

function canManageTeam(team: Team, userId: string, users: User[]) {
  const role = roleFor(team, userId, users)
  return role === "Owner" || role === "Admin"
}

function isLegacyDemoSnapshot(state: Partial<DataState>) {
  return state.currentUserId === "u1"
    && state.projects?.some((project) => project.id === "p1")
    && state.users?.some((user) => user.id === "u2")
}

export const useDataStore = create<DataState>()(persist((set, get) => ({
  tasks: [], projects: [], teams: [], users: [], activities: [], notifications: [], goals: [], docs: [],
  currentUserId: "",
  currentUser: emptyUser,
  members: [],
  activity: [],
  automations: [],
  settings: { workspaceName: "My workspace", timezone: "UTC", defaultTaskPriority: "medium", notifications: { assignments: true, mentions: true, dueDates: true, digest: false }, reducedMotion: false },

  updateTaskStatus: (taskId, status, order) => {
    const task = get().tasks.find((t) => t.id === taskId)
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status, order: order ?? t.order, updatedAt: now() }
          : t
      ),
    }))
    if (task && task.status !== status) {
      logActivity(set, {
        type: status === "done" ? "task_completed" : "status_changed",
        actorId: get().currentUserId,
        summary:
          status === "done"
            ? `completed ${task.title}`
            : `moved ${task.title} to ${status.replace("_", " ")}`,
        targetId: taskId,
        projectId: task.projectId,
      })
    }
  },

  moveTask: (taskId, status, beforeTaskId) => {
    const task = get().tasks.find((item) => item.id === taskId)
    if (!task) return

    const destination = get()
      .tasks
      .filter((item) => item.status === status && item.id !== taskId)
      .sort((a, b) => a.order - b.order)
    const insertAt = beforeTaskId
      ? Math.max(0, destination.findIndex((item) => item.id === beforeTaskId))
      : destination.length
    destination.splice(insertAt === -1 ? destination.length : insertAt, 0, { ...task, status })
    const orderById = new Map(destination.map((item, index) => [item.id, index]))

    set((state) => ({
      tasks: state.tasks.map((item) => {
        if (item.id === taskId) {
          return { ...item, status, order: orderById.get(item.id) ?? item.order, updatedAt: now() }
        }
        if (item.status === status) {
          const order = orderById.get(item.id)
          return order === undefined ? item : { ...item, order, updatedAt: now() }
        }
        return item
      }),
    }))

    if (task.status !== status) {
      logActivity(set, {
        type: status === "done" ? "task_completed" : "status_changed",
        actorId: get().currentUserId,
        summary: status === "done" ? `completed ${task.title}` : `moved ${task.title} to ${status.replace("_", " ")}`,
        targetId: taskId,
        projectId: task.projectId,
      })
    }
  },

  updateTaskPriority: (taskId, priority) => {
    const task = get().tasks.find((t) => t.id === taskId)
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, priority, updatedAt: now() } : t
      ),
    }))
    if (task && task.priority !== priority) {
      logActivity(set, {
        type: "priority_changed",
        actorId: get().currentUserId,
        summary: `changed priority on ${task.title} to ${priority}`,
        targetId: taskId,
        projectId: task.projectId,
      })
    }
  },

  updateTask: (taskId, updates) => {
    const task = get().tasks.find((item) => item.id === taskId)
    if (!task) return
    set((state) => ({
      tasks: state.tasks.map((item) =>
        item.id === taskId ? { ...item, ...updates, updatedAt: now() } : item,
      ),
    }))
    logActivity(set, {
      type: updates.priority && updates.priority !== task.priority ? "priority_changed" : "project_updated",
      actorId: get().currentUserId,
      summary: `updated ${task.title}`,
      targetId: taskId,
      projectId: updates.projectId ?? task.projectId,
    })
  },

  updateTaskAssignee: (taskId, assigneeId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, assigneeId, updatedAt: now() } : t
      ),
    }))
  },

  toggleTaskDone: (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId)
    if (!task) return
    const next: TaskStatus = task.status === "done" ? "todo" : "done"
    get().updateTaskStatus(taskId, next)
  },

  toggleSubtask: (taskId, subtaskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, done: !s.done } : s
              ),
              updatedAt: now(),
            }
          : t
      ),
    }))
  },

  addComment: (taskId, body) => {
    const comment: Comment = {
      id: `cm-${Math.random().toString(36).slice(2, 8)}`,
      authorId: get().currentUserId,
      body,
      createdAt: now(),
    }
    const task = get().tasks.find((t) => t.id === taskId)
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, comments: [...t.comments, comment], updatedAt: now() } : t
      ),
    }))
    if (task) {
      logActivity(set, {
        type: "comment_added",
        actorId: get().currentUserId,
        summary: `commented on ${task.title}`,
        targetId: taskId,
        projectId: task.projectId,
      })
    }
  },

  createTask: (input) => {
    const project = input.projectId ? get().projects.find((p) => p.id === input.projectId) : undefined
    if (input.projectId && !project) throw new Error("That project is no longer available.")
    const count = get().tasks
      .filter((task) => task.projectId === input.projectId)
      .reduce((highest, task) => {
        const match = task.key.match(new RegExp(`^${project?.key ?? "TASK"}-(\\d+)$`))
        return Math.max(highest, match ? Number(match[1]) : 0)
      }, 0) + 1
    const status = input.status ?? "todo"
    const order = get().tasks.filter((task) => task.status === status).reduce((highest, task) => Math.max(highest, task.order), -1) + 1
    const task: Task = {
      id: `k-${Math.random().toString(36).slice(2, 8)}`,
      key: `${project?.key ?? "TASK"}-${count}`,
      title: input.title,
      description: input.description,
      status,
      priority: input.priority ?? "medium",
      assigneeId: input.assigneeId ?? get().currentUserId,
      collaboratorIds: input.collaboratorIds ?? [],
      projectId: input.projectId,
      labels: input.labels ?? [],
      startDate: input.startDate,
      dueDate: input.dueDate,
      estimatedHours: input.estimatedHours,
      actualHours: input.actualHours,
      subtasks: input.subtasks ?? [],
      checklist: input.checklist ?? [],
      dependencies: input.dependencies ?? [],
      comments: [],
      linkedDocIds: [],
      createdAt: now(),
      updatedAt: now(),
      order,
    }
    set((state) => ({ tasks: [task, ...state.tasks] }))
    logActivity(set, {
      type: "task_created",
      actorId: get().currentUserId,
      summary: `created ${task.title}`,
      targetId: task.id,
      projectId: task.projectId,
    })
    return task
  },

  deleteTask: (taskId) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }))
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }))
  },

  markAllNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }))
  },

  archiveNotification: (id) => {
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }))
  },

  createProject: (name, dueDate, options) => set((state) => ({ projects: [{ id: clientId("project"), name, key: name.trim().replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase() || "PROJ", description: options?.description?.trim() || "", status: options?.status ?? "active", priority: options?.priority ?? "medium", color: "oklch(0.78 0.19 205)", ownerId: state.currentUserId, memberIds: [state.currentUserId], teamId: options?.teamId ?? "", startDate: options?.startDate || now(), dueDate: dueDate || "", milestones: [], createdAt: now(), updatedAt: now() }, ...state.projects] })),
  updateProject: (id, updates) => set((state) => ({ projects: state.projects.map((item) => item.id === id ? { ...item, ...updates, updatedAt: now() } : item) })),
  deleteProject: (id) => set((state) => ({ projects: state.projects.filter((item) => item.id !== id) })),
  createTeam: (name, description, memberIds = []) => {
    const trimmedName = name.trim()
    if (!trimmedName) throw new Error("A team needs a name.")
    if (get().teams.some((team) => team.name.toLowerCase() === trimmedName.toLowerCase())) throw new Error("A team with that name already exists.")
    const validMembers = [...new Set(memberIds)].filter((id) => get().users.some((user) => user.id === id) && id !== get().currentUserId)
    const team: Team = { id: clientId("team"), name: trimmedName, description: description?.trim() || "Team workspace", memberIds: [get().currentUserId, ...validMembers], color: "oklch(0.78 0.19 205)", ownerId: get().currentUserId, memberRoles: Object.fromEntries([[get().currentUserId, "Owner"], ...validMembers.map((id) => [id, "Member"])]) as Partial<Record<string, TeamRole>> }
    set((state) => ({ teams: [team, ...state.teams] }))
    logActivity(set, { type: "team_created", actorId: get().currentUserId, summary: `created team ${team.name}`, targetId: team.id })
    return team
  },
  updateTeam: (id, updates) => {
    const team = get().teams.find((item) => item.id === id)
    if (!team) throw new Error("Team not found.")
    if (!canManageTeam(team, get().currentUserId, get().users)) throw new Error("You do not have permission to update this team.")
    const name = updates.name?.trim()
    if (name && get().teams.some((item) => item.id !== id && item.name.toLowerCase() === name.toLowerCase())) throw new Error("A team with that name already exists.")
    set((state) => ({ teams: state.teams.map((item) => item.id === id ? { ...item, ...updates, ...(name ? { name } : {}) } : item) }))
    logActivity(set, { type: "team_updated", actorId: get().currentUserId, summary: `updated team ${name ?? team.name}`, targetId: id })
  },
  deleteTeam: (id) => {
    const team = get().teams.find((item) => item.id === id)
    if (!team) throw new Error("Team not found.")
    if (!canManageTeam(team, get().currentUserId, get().users)) throw new Error("You do not have permission to delete this team.")
    set((state) => ({
      teams: state.teams.filter((item) => item.id !== id),
      projects: state.projects.map((project) => project.teamId === id ? { ...project, teamId: "", updatedAt: now() } : project),
    }))
    logActivity(set, { type: "team_deleted", actorId: get().currentUserId, summary: `deleted team ${team.name}`, targetId: id })
  },
  addTeamMember: (teamId, userId) => get().addTeamMembers(teamId, [userId]),
  addTeamMembers: (teamId, userIds) => {
    const team = get().teams.find((item) => item.id === teamId)
    if (!team) throw new Error("Team not found.")
    if (!canManageTeam(team, get().currentUserId, get().users)) throw new Error("You do not have permission to add members.")
    const additions = [...new Set(userIds)].filter((id) => get().users.some((user) => user.id === id) && !team.memberIds.includes(id))
    if (!additions.length) throw new Error("Select at least one eligible workspace member.")
    set((state) => ({ teams: state.teams.map((item) => item.id === teamId ? { ...item, memberIds: [...item.memberIds, ...additions], memberRoles: { ...item.memberRoles, ...Object.fromEntries(additions.map((id) => [id, "Member"])) } } : item) }))
    logActivity(set, { type: "member_added", actorId: get().currentUserId, summary: `added ${additions.length} member${additions.length === 1 ? "" : "s"} to ${team.name}`, targetId: teamId })
  },
  removeTeamMember: (teamId, userId) => {
    const team = get().teams.find((item) => item.id === teamId)
    if (!team) throw new Error("Team not found.")
    if (!canManageTeam(team, get().currentUserId, get().users)) throw new Error("You do not have permission to remove members.")
    const role = roleFor(team, userId, get().users)
    if (!role) throw new Error("That user is not a member of this team.")
    const owners = team.memberIds.filter((id) => roleFor(team, id, get().users) === "Owner")
    if (role === "Owner" && owners.length <= 1) throw new Error("Assign another owner before removing the last team owner.")
    set((state) => ({ teams: state.teams.map((item) => item.id === teamId ? { ...item, memberIds: item.memberIds.filter((id) => id !== userId), memberRoles: Object.fromEntries(Object.entries(item.memberRoles ?? {}).filter(([id]) => id !== userId)) } : item) }))
    logActivity(set, { type: "member_removed", actorId: get().currentUserId, summary: `removed a member from ${team.name}`, targetId: teamId })
  },
  changeTeamMemberRole: (teamId, userId, role) => {
    const team = get().teams.find((item) => item.id === teamId)
    if (!team) throw new Error("Team not found.")
    if (roleFor(team, get().currentUserId, get().users) !== "Owner") throw new Error("Only a team owner can change roles.")
    const currentRole = roleFor(team, userId, get().users)
    if (!currentRole) throw new Error("That user is not a member of this team.")
    const owners = team.memberIds.filter((id) => roleFor(team, id, get().users) === "Owner")
    if (currentRole === "Owner" && role !== "Owner" && owners.length <= 1) throw new Error("Assign another owner before changing the last owner’s role.")
    set((state) => ({ teams: state.teams.map((item) => item.id === teamId ? { ...item, memberRoles: { ...item.memberRoles, [userId]: role }, ownerId: role === "Owner" ? userId : item.ownerId } : item) }))
    logActivity(set, { type: "role_changed", actorId: get().currentUserId, summary: `changed a team member role to ${role}`, targetId: teamId })
  },
  createDoc: (title) => set((state) => ({ docs: [{ id: `doc-${Date.now()}`, title, icon: "file", excerpt: "New document", authorId: state.currentUserId, updatedAt: now() }, ...state.docs] })),
  updateDoc: (id, updates) => set((state) => ({ docs: state.docs.map((item) => item.id === id ? { ...item, ...updates, updatedAt: now() } : item) })),
  deleteDoc: (id) => set((state) => ({ docs: state.docs.filter((item) => item.id !== id) })),
  createGoal: (title, dueDate) => set((state) => ({ goals: [{ id: `goal-${Date.now()}`, title, description: "New workspace goal", ownerId: state.currentUserId, scope: "personal", progress: 0, dueDate: dueDate || now(), linkedProjectIds: [] }, ...state.goals] })),
  updateGoal: (id, updates) => set((state) => ({ goals: state.goals.map((item) => item.id === id ? { ...item, ...updates } : item) })),
  deleteGoal: (id) => set((state) => ({ goals: state.goals.filter((item) => item.id !== id) })),
  createAutomation: (input) => {
    const name = input.name.trim()
    if (!name) throw new Error("An automation needs a name.")
    if (get().automations.some((item) => item.name.toLowerCase() === name.toLowerCase())) throw new Error("An automation with that name already exists.")
    set((state) => ({ automations: [{ id: clientId("auto"), ...input, name, enabled: true, createdAt: now(), runs: 0, failures: 0 }, ...state.automations] }))
  },
  toggleAutomation: (id) => set((state) => ({ automations: state.automations.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item) })),
  deleteAutomation: (id) => set((state) => ({ automations: state.automations.filter((item) => item.id !== id) })),
  updateSettings: (updates) => set((state) => ({ settings: { ...state.settings, ...updates, notifications: { ...state.settings.notifications, ...updates.notifications } } })),
  updateCurrentUser: (updates) => set((state) => ({ users: state.users.map((user) => user.id === state.currentUserId ? { ...user, ...updates } : user), currentUser: { ...state.currentUser, ...updates }, members: state.members.map((user) => user.id === state.currentUserId ? { ...user, ...updates } : user) })),
}), {
  name: "nocaptask-data",
  version: 4,
  migrate: (persistedState, version) => {
    const state = persistedState as Partial<DataState>
    if (version < 4 && isLegacyDemoSnapshot(state)) {
      return {
        tasks: [], projects: [], teams: [], users: [], activities: [], notifications: [], goals: [], docs: [], automations: [],
        currentUserId: "", currentUser: emptyUser, members: [], activity: [],
        settings: { workspaceName: "My workspace", timezone: "UTC", defaultTaskPriority: "medium", notifications: { assignments: true, mentions: true, dueDates: true, digest: false }, reducedMotion: false },
      } as unknown as DataState
    }
    if (version < 2 && state.teams) {
      state.teams = state.teams.map((team) => {
        if (team.ownerId && team.memberRoles) return team
        const ownerId = team.ownerId ?? team.memberIds[0]
        return {
          ...team,
          ownerId,
          memberRoles: team.memberRoles ?? Object.fromEntries(team.memberIds.map((id) => [id, id === ownerId ? "Owner" : "Member"])) as Partial<Record<string, TeamRole>>,
        }
      })
    }
    return state as DataState
  },
  // Rehydrate after mount so saved browser data cannot disagree with the
  // initial server-rendered state during React hydration.
  skipHydration: true,
  partialize: (state) => ({
    tasks: state.tasks,
    projects: state.projects,
    teams: state.teams,
    users: state.users,
    activities: state.activities,
    notifications: state.notifications,
    goals: state.goals,
    docs: state.docs,
    currentUserId: state.currentUserId,
    currentUser: state.currentUser,
    members: state.members,
    activity: state.activity,
    automations: state.automations,
    settings: state.settings,
  }),
}))
