import {
  LayoutDashboard,
  CheckSquare,
  Inbox,
  FolderKanban,
  Users,
  Calendar,
  FileText,
  Target,
  BarChart3,
  Zap,
  Settings,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  shortcut?: string
}

export const primaryNav: NavItem[] = [
  { label: "Home", href: "/", icon: LayoutDashboard, shortcut: "G H" },
  { label: "My Tasks", href: "/tasks", icon: CheckSquare, shortcut: "G T" },
  { label: "Inbox", href: "/inbox", icon: Inbox, shortcut: "G I" },
  { label: "Projects", href: "/projects", icon: FolderKanban, shortcut: "G P" },
  { label: "Teams", href: "/teams", icon: Users },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Automations", href: "/automations", icon: Zap },
]

export const secondaryNav: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
]

export const NAV_ITEMS = primaryNav
