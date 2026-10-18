import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { ensureWorkspaceTable, getDatabase } from "@/lib/server/database"

export const runtime = "nodejs"

type TeamSnapshot = { id: string; name: string; ownerId?: string }

async function syncTeams(userId: string, data: { teams?: TeamSnapshot[] }) {
  const database = getDatabase()
  for (const team of data.teams ?? []) {
    if (!team?.id || !team?.name) continue
    const ownerId = team.ownerId || userId
    await database.query(
      "INSERT INTO teams (id, name, owner_user_id) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()",
      [team.id, team.name, ownerId],
    )
    await database.query(
      "INSERT INTO team_memberships (id, team_id, user_id, role) VALUES ($1, $2, $3, 'Owner') ON CONFLICT (team_id, user_id) DO NOTHING",
      [`membership-${team.id}-${ownerId}`, team.id, ownerId],
    )
  }
}

const emptyWorkspace = {
  tasks: [], projects: [], teams: [], users: [], activities: [], notifications: [], goals: [], docs: [], automations: [],
  currentUserId: "",
  settings: { workspaceName: "My workspace", timezone: "UTC", defaultTaskPriority: "medium", notifications: { assignments: true, mentions: true, dueDates: true, digest: false }, reducedMotion: false },
}

function isLegacyDemoWorkspace(data: unknown): boolean {
  if (!data || typeof data !== "object") return false
  const snapshot = data as { currentUserId?: unknown; projects?: unknown; users?: unknown }
  return snapshot.currentUserId === "u1"
    && Array.isArray(snapshot.projects)
    && snapshot.projects.some((project) => project && typeof project === "object" && (project as { id?: unknown }).id === "p1")
    && Array.isArray(snapshot.users)
    && snapshot.users.some((user) => user && typeof user === "object" && (user as { id?: unknown }).id === "u2")
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    await ensureWorkspaceTable()
    const database = getDatabase()
    const result = await database.query<{ data: typeof emptyWorkspace }>("SELECT data FROM workspace_snapshots WHERE workspace_id = $1", [userId])
    if (result.rowCount && !isLegacyDemoWorkspace(result.rows[0].data)) return NextResponse.json(result.rows[0].data)
    if (result.rowCount) {
      await database.query("UPDATE workspace_snapshots SET data = $2::jsonb, updated_at = NOW() WHERE workspace_id = $1", [userId, JSON.stringify(emptyWorkspace)])
      return NextResponse.json(emptyWorkspace)
    }
    await database.query("INSERT INTO workspace_snapshots (workspace_id, data) VALUES ($1, $2::jsonb)", [userId, JSON.stringify(emptyWorkspace)])
    return NextResponse.json(emptyWorkspace)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database unavailable" }, { status: 503 })
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const data = await request.json()
    if (!data || typeof data !== "object" || !Array.isArray(data.tasks) || !Array.isArray(data.projects) || !Array.isArray(data.teams)) {
      return NextResponse.json({ error: "Invalid workspace payload." }, { status: 400 })
    }
    await ensureWorkspaceTable()
    await syncTeams(userId, data)
    await getDatabase().query(
      "INSERT INTO workspace_snapshots (workspace_id, data, updated_at) VALUES ($1, $2::jsonb, NOW()) ON CONFLICT (workspace_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()",
      [userId, JSON.stringify(data)],
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save workspace" }, { status: 500 })
  }
}
