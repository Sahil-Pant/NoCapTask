"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { User } from "@/lib/types"

export function UserAvatar({
  user,
  className,
}: {
  user?: User
  className?: string
}) {
  if (!user) {
    return (
      <Avatar className={cn("size-7", className)}>
        <AvatarFallback className="bg-muted text-muted-foreground text-xs">?</AvatarFallback>
      </Avatar>
    )
  }
  return (
    <Avatar className={cn("size-7", className)}>
      <AvatarFallback
        className="text-xs font-medium text-background"
        style={{ backgroundColor: user.avatarColor }}
      >
        {user.initials}
      </AvatarFallback>
    </Avatar>
  )
}

export function AvatarStack({
  users,
  max = 4,
  className,
}: {
  users: User[]
  max?: number
  className?: string
}) {
  const shown = users.slice(0, max)
  const extra = users.length - shown.length
  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {shown.map((u) => (
        <UserAvatar
          key={u.id}
          user={u}
          className="size-6 ring-2 ring-card"
        />
      ))}
      {extra > 0 && (
        <div className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-card">
          +{extra}
        </div>
      )}
    </div>
  )
}
