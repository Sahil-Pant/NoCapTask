import { DashboardHero } from "@/components/dashboard/dashboard-hero"
import { StatCards } from "@/components/dashboard/stat-cards"
import { FocusPanel } from "@/components/dashboard/focus-panel"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { ProjectsGlance } from "@/components/dashboard/projects-glance"

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardHero />
      <StatCards />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6">
          <FocusPanel />
          <ProjectsGlance />
        </div>
        <ActivityFeed />
      </div>
    </div>
  )
}
