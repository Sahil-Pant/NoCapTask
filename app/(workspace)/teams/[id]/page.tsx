"use client"

import { useParams } from "next/navigation"
import { TeamDetailView } from "@/components/teams/team-detail-view"

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>()
  return <TeamDetailView id={id} />
}
