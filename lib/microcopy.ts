// NoCapTask personality layer.
// Keep it casual, dry, confident. Never joke in destructive/security contexts.

export const microcopy = {
  dashboardGreetings: [
    "What's the move today?",
    "Alright, let's lock in.",
    "Back at it. No cap.",
    "The grind resumes.",
    "Let's make it happen.",
  ],
  dashboardSub: [
    "Three things that matter. The rest can wait.",
    "A clear board is a dangerous thing.",
    "Keep the main thing the main thing.",
  ],
  loading: [
    "Cooking...",
    "Doing the thing...",
    "One sec...",
    "Asking the servers nicely...",
    "Loading the goods...",
    "Almost there...",
  ],
  success: [
    "W. Task secured.",
    "Clean work.",
    "We are so back.",
    "That's the one.",
    "Locked in.",
    "Noted and handled.",
  ],
  error: [
    "Well, that went sideways.",
    "Something broke. We're on it.",
    "The internet chose violence.",
    "Yeah, that didn't work.",
  ],
  networkError: ["The internet ghosted us.", "Connection said nope."],
  emptyTasks: ["No tasks. Suspicious.", "Nothing to do. Enjoy it while it lasts."],
  emptyProjects: ["Nothing here yet. Big plans?", "No projects. A blank canvas."],
  emptySearch: ["Nothing. We looked everywhere.", "Zero results. We tried."],
  emptyInbox: ["Inbox zero. Nice.", "You're all caught up.", "Nothing new. Peace and quiet."],
  emptyNotifications: ["You're all caught up.", "Silence. We respect it."],
  emptyDocuments: ["No docs yet. Someone has to write them.", "Blank shelf. Start writing."],
  emptyGoals: ["No goals set. Dream a little.", "Nothing to chase yet."],
  overdue: ["Bro... this was due yesterday.", "This one's overdue. Just saying.", "The deadline came and went."],
  upcomingDeadline: ["Clock's ticking.", "Deadline incoming.", "This is due soon."],
  projectDone: ["That's a wrap.", "Actually impressive.", "Shipped it. No cap."],
  teamCooking: ["The team is cooking.", "Everyone entered their productivity arc.", "Okay, we're actually making progress."],
  teamOverloaded: ["Yeah... everyone's got a lot going on.", "The team is buried. Might be time to redistribute."],
  deleteConfirm: ["You sure? This is going into the void.", "This can't be undone. You good?"],
  taskCompleted: ["That took a minute.", "Done and dusted.", "One less thing."],
} as const

type MicrocopyKey = keyof typeof microcopy

// Deterministic-per-render helper so we don't hydrate-mismatch.
export function pick(key: MicrocopyKey, seed = 0): string {
  const list = microcopy[key]
  return list[Math.abs(seed) % list.length]
}

export function pickRandom(key: MicrocopyKey): string {
  const list = microcopy[key]
  return list[Math.floor(Math.random() * list.length)]
}

export const pickFrom = (key: MicrocopyKey): string => pick(key)
export const greeting = (name: string) => `Hey ${name}. ${pick("dashboardGreetings")}`
