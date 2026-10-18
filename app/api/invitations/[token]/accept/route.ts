import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { createHash, randomUUID } from "crypto"
import { ensureWorkspaceTable, getDatabase } from "@/lib/server/database"

export const runtime = "nodejs"
const hash = (token: string) => createHash("sha256").update(token).digest("hex")

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { userId } = await auth(); const { token } = await params
  if (!userId) return NextResponse.json({ error: "Sign in to accept this invitation." }, { status: 401 })
  await ensureWorkspaceTable(); const database = getDatabase(); const client = await database.connect()
  try {
    await client.query("BEGIN")
    const result = await client.query<{ id: string; team_id: string; invited_email: string | null; invitation_type: "EMAIL" | "LINK"; role: "Admin" | "Member"; status: string; expires_at: Date; max_uses: number; uses_count: number }>("SELECT * FROM team_invitations WHERE token_hash = $1 FOR UPDATE", [hash(token)])
    const invitation = result.rows[0]
    if (!invitation || invitation.status !== "PENDING" || new Date(invitation.expires_at) <= new Date() || invitation.uses_count >= invitation.max_uses) { await client.query("ROLLBACK"); return NextResponse.json({ error: "This invitation is invalid, expired, or no longer available." }, { status: 410 }) }
    const user = await currentUser(); const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase()
    if (invitation.invitation_type === "EMAIL" && invitation.invited_email !== email) { await client.query("ROLLBACK"); return NextResponse.json({ error: "Sign in with the email address this invitation was sent to." }, { status: 403 }) }
    await client.query("INSERT INTO team_memberships (id, team_id, user_id, role, display_name, email) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (team_id, user_id) DO NOTHING", [randomUUID(), invitation.team_id, userId, invitation.role, user?.fullName ?? user?.username ?? null, email ?? null])
    const nextStatus = invitation.invitation_type === "EMAIL" ? "ACCEPTED" : invitation.uses_count + 1 >= invitation.max_uses ? "ACCEPTED" : "PENDING"
    await client.query("UPDATE team_invitations SET uses_count = uses_count + 1, status = $2, accepted_at = COALESCE(accepted_at, NOW()), updated_at = NOW() WHERE id = $1", [invitation.id, nextStatus])
    await client.query("COMMIT")
    return NextResponse.json({ ok: true, teamId: invitation.team_id })
  } catch {
    await client.query("ROLLBACK")
    return NextResponse.json({ error: "Could not accept this invitation." }, { status: 500 })
  } finally { client.release() }
}
