"use client"

import { UserButton } from "@clerk/nextjs"

export function ProfileMenu() {
  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: "size-7",
        },
      }}
    />
  )
}
