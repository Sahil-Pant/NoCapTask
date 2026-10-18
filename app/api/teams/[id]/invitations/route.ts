import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createHash, randomBytes, randomUUID } from "crypto"
import { ensureWorkspaceTable, getDatabase } from "@/lib/server/database"

export const runtime = "nodejs"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const hash = (token: string) => createHash("sha256").update(token).digest("hex")
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!)

async function canInvite(teamId: string, userId: string) {
  await ensureWorkspaceTable()
  const database = getDatabase()
  const result = await database.query<{ role: string }>("SELECT role FROM team_memberships WHERE team_id = $1 AND user_id = $2", [teamId, userId])
  return result.rows[0]?.role === "Owner" || result.rows[0]?.role === "Admin"
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth(); const { id } = await params
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!await canInvite(id, userId)) return NextResponse.json({ error: "Not allowed" }, { status: 403 })
  const invitations = await getDatabase().query("SELECT id, invited_email AS \"invitedEmail\", invitation_type AS type, role, status, expires_at AS \"expiresAt\", created_at AS \"createdAt\", max_uses AS \"maxUses\", uses_count AS \"usesCount\" FROM team_invitations WHERE team_id = $1 ORDER BY created_at DESC", [id])
  return NextResponse.json(invitations.rows)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth(); const { id: teamId } = await params
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!await canInvite(teamId, userId)) return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    const body = await request.json() as { type?: "EMAIL" | "LINK"; email?: string; role?: "Admin" | "Member"; maxUses?: number }
  if (body.type !== "EMAIL" && body.type !== "LINK") return NextResponse.json({ error: "Choose an invitation type." }, { status: 400 })
  if (body.type === "EMAIL" && (!body.email || !EMAIL.test(body.email))) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
  const role = body.role === "Admin" ? "Admin" : "Member"
  const database = getDatabase(); const email = body.email?.trim().toLowerCase() ?? null
  const team = await database.query<{ name: string }>("SELECT name FROM teams WHERE id = $1", [teamId])
  const teamName = team.rows[0]?.name ?? "your NoCapTask team"
  if (email) {
    const duplicate = await database.query("SELECT 1 FROM team_invitations WHERE team_id = $1 AND invited_email = $2 AND status = 'PENDING' AND expires_at > NOW()", [teamId, email])
    if (duplicate.rowCount) return NextResponse.json({ error: "An active invitation already exists for this email." }, { status: 409 })
  }
  const token = randomBytes(32).toString("base64url")
  const invitationId = randomUUID(); const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await database.query("INSERT INTO team_invitations (id, team_id, invited_email, token_hash, invitation_type, role, invited_by_user_id, expires_at, max_uses) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)", [invitationId, teamId, email, hash(token), body.type, role, userId, expiresAt, body.type === "LINK" ? Math.min(Math.max(body.maxUses ?? 100, 1), 1000) : 1])
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/invite/${token}`
  if (body.type === "EMAIL") {
    if (!process.env.RESEND_API_KEY || !process.env.INVITATION_FROM_EMAIL) {
      await database.query("UPDATE team_invitations SET status = 'FAILED', delivery_error = 'Email delivery is not configured', updated_at = NOW() WHERE id = $1", [invitationId])
      return NextResponse.json({ error: "Email delivery is not configured. Add RESEND_API_KEY and INVITATION_FROM_EMAIL." }, { status: 503 })
    }
    const expiresOn = expiresAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    const safeTeamName = escapeHtml(teamName)
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.INVITATION_FROM_EMAIL,
        to: [email],
        subject: `You’re invited to join ${teamName} on NoCapTask`,
        text: `You’ve been invited to join ${teamName} on NoCapTask as a ${role}.\n\nAccept your invitation: ${url}\n\nThis invitation expires on ${expiresOn}. If you weren’t expecting this invitation, you can safely ignore this email.`,
        html: `<main style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1f2937"><p style="font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6366f1;margin:0 0 24px">NoCapTask</p><h1 style="font-size:28px;line-height:1.2;margin:0 0 16px">You’re invited to join ${safeTeamName}</h1><p style="font-size:16px;line-height:1.6;margin:0 0 24px">You’ve been invited to collaborate as a <strong>${role}</strong>.</p><p style="margin:0 0 28px"><a href="${url}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Accept invitation</a></p><p style="font-size:14px;line-height:1.6;color:#6b7280;margin:0">This invitation expires on ${expiresOn}. If you weren’t expecting it, you can safely ignore this email.</p></main>`,
      }),
    })
    if (!response.ok) { await database.query("UPDATE team_invitations SET status = 'FAILED', delivery_error = 'Email provider rejected delivery', updated_at = NOW() WHERE id = $1", [invitationId]); return NextResponse.json({ error: "The invitation was saved, but email delivery failed." }, { status: 502 }) }
  }
    return NextResponse.json({ id: invitationId, url: body.type === "LINK" ? url : undefined, expiresAt }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create invitation." }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth(); const { id: teamId } = await params
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!await canInvite(teamId, userId)) return NextResponse.json({ error: "Not allowed" }, { status: 403 })
  const { invitationId } = await request.json() as { invitationId?: string }
  if (!invitationId) return NextResponse.json({ error: "Invitation ID is required." }, { status: 400 })
  const result = await getDatabase().query("UPDATE team_invitations SET status = 'REVOKED', revoked_at = NOW(), updated_at = NOW() WHERE id = $1 AND team_id = $2 AND status = 'PENDING' RETURNING id", [invitationId, teamId])
  if (!result.rowCount) return NextResponse.json({ error: "Invitation is no longer active." }, { status: 409 })
  return NextResponse.json({ ok: true })
}
