"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function InvitePage() {
  const { token } = useParams<{ token: string }>(); const router = useRouter(); const [error, setError] = useState(""); const [loading, setLoading] = useState(false)
  const accept = async () => {
    setLoading(true); setError("")
    try {
      const response = await fetch(`/api/invitations/${token}/accept`, { method: "POST" })
      const text = await response.text()
      let data: { error?: string; teamId?: string } = {}
      try { data = text ? JSON.parse(text) as typeof data : {} } catch { /* Show a useful error below for non-JSON error pages. */ }
      if (response.status === 401) { router.push(`/sign-in?redirect_url=${encodeURIComponent(`/invite/${token}`)}`); return }
      if (!response.ok || !data.teamId) { setError(data.error ?? "The invitation could not be accepted right now. Please try again."); return }
      router.push(`/teams/${data.teamId}`)
    } catch {
      setError("We could not reach the invitation service. Please try again.")
    } finally { setLoading(false) }
  }
  return <main className="flex min-h-svh items-center justify-center bg-background p-4"><Card className="w-full max-w-md"><CardHeader><CardTitle>You have been invited</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Accept to join this NoCapTask team. Invitations are only applied after you confirm.</p>{error ? <p className="text-sm text-destructive">{error}</p> : null}<Button className="w-full" onClick={accept} disabled={loading}>{loading ? "Joining…" : "Accept invitation"}</Button></CardContent></Card></main>
}
