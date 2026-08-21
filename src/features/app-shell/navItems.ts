import { Home, Layers, LineChart, Settings2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/app', label: 'Übersicht', icon: Home, end: true },
  { to: '/app/subjects', label: 'Fächer', icon: Layers },
  { to: '/app/analytics', label: 'Analyse', icon: LineChart },
  { to: '/app/more', label: 'Einstellungen', icon: Settings2 },
]
