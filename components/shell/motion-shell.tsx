"use client"

import * as React from "react"
import { motion } from "framer-motion"

export function MotionShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="contents" suppressHydrationWarning
    >
      {children}
    </motion.div>
  )
}
