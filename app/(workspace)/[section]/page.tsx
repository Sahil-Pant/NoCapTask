"use client"

import { useParams } from "next/navigation"
import { ProfileView, SettingsView } from "@/components/settings/settings-view"
import { AnalyticsView } from "@/components/analytics/analytics-view"
import { WorkspaceCrudView } from "@/components/workspace/workspace-crud-view"
import { TeamsView } from "@/components/teams/teams-view"

const CRUD_SECTIONS = ["inbox", "projects", "teams", "calendar", "documents", "goals"] as const

export default function SectionPage() {
  const { section } = useParams<{ section: string }>()
  if (section === "settings") return <SettingsView />
  if (section === "profile") return <ProfileView />
  if (section === "analytics") return <AnalyticsView />
  if (section === "teams") return <TeamsView />
  const activeSection = CRUD_SECTIONS.includes(section as (typeof CRUD_SECTIONS)[number]) ? section as (typeof CRUD_SECTIONS)[number] : "inbox"
  return <WorkspaceCrudView section={activeSection} />
}
