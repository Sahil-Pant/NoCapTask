"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <CheckMark />
      </span>
      {!collapsed && (
        <span className="font-display text-[15px] font-semibold tracking-tight text-foreground">
          NoCap<span className="text-primary">Task</span>
        </span>
      )}
    </Link>
  )
}

function CheckMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 8.5L6 12L13.5 4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
