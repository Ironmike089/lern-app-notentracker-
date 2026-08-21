import type { ThemePreference } from '../../domain/types'
import { useTheme } from '../theme/themeContext'
import { Card } from '../../components/ui/Card'
import { SegmentedControl } from '../../components/ui/SegmentedControl'

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dunkel' },
  { value: 'light', label: 'Hell' },
]

export function ThemeSection() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-ink-soft">Darstellung</p>
      <Card>
        <SegmentedControl value={theme} onChange={setTheme} options={OPTIONS} aria-label="Darstellung wählen" />
      </Card>
    </div>
  )
}
