import { Suspense } from "react"
import { PageHeader } from "@/components/common/page-header"
import { TaskBoard } from "@/components/tasks/task-board"
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel"

export default function TasksPage() {
  return (
    <main className="flex flex-col gap-6">
      <PageHeader eyebrow="Work queue" title="My tasks" description="Everything that needs your attention, without the motivational poster energy." />
      <TaskBoard />
      <Suspense fallback={null}>
        <TaskDetailPanel />
      </Suspense>
    </main>
  )
}
