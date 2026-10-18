"use client"

import * as React from "react"
import { ThemeProvider } from "next-themes"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { useDataStore } from "@/lib/store/data-store"
import { useUser } from "@clerk/nextjs"

export function Providers({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  React.useEffect(() => {
    if (!user) return
    const name = user.fullName || user.username || user.primaryEmailAddress?.emailAddress?.split("@")[0] || "Member"
    const workspaceUser = {
      id: user.id,
      name,
      handle: user.username || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      email: user.primaryEmailAddress?.emailAddress || "",
      initials: name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "M",
      avatarColor: "oklch(0.78 0.19 205)",
      role: "Owner" as const,
      title: "",
    }
    useDataStore.setState((state) => ({
      currentUserId: user.id,
      currentUser: workspaceUser,
      users: state.users.some((member) => member.id === user.id) ? state.users.map((member) => member.id === user.id ? { ...member, ...workspaceUser } : member) : [workspaceUser, ...state.users],
      members: state.members.some((member) => member.id === user.id) ? state.members.map((member) => member.id === user.id ? { ...member, ...workspaceUser } : member) : [workspaceUser, ...state.members],
    }))
  }, [user])

  React.useEffect(() => {
    let isReady = false
    const snapshot = () => {
      const state = useDataStore.getState()
      return {
        tasks: state.tasks, projects: state.projects, teams: state.teams, users: state.users,
        activities: state.activities, notifications: state.notifications, goals: state.goals,
        docs: state.docs, automations: state.automations, settings: state.settings, currentUserId: state.currentUserId,
      }
    }
    const load = async () => {
      await useDataStore.persist.rehydrate()
      try {
        const response = await fetch("/api/workspace")
        if (!response.ok) throw new Error("Workspace database is unavailable")
        const data = await response.json()
        useDataStore.setState((state) => ({
          ...state, ...data,
          currentUserId: data.currentUserId || state.currentUserId,
          currentUser: data.users?.find((user: { id: string }) => user.id === data.currentUserId) ?? state.currentUser,
          members: data.users?.length ? data.users : state.members,
          users: data.users?.length ? data.users : state.users,
          activity: data.activities ?? state.activity,
        }))
      } catch (error) {
        console.warn(error)
      } finally {
        isReady = true
      }
    }
    void load()
    const unsubscribe = useDataStore.subscribe(() => {
      if (!isReady) return
      void fetch("/api/workspace", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(snapshot()) }).catch((error) => console.warn(error))
    })
    return unsubscribe
  }, [])

  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false },
        },
      })
  )

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delay={200}>
          {children}
          <Toaster position="bottom-right" />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
