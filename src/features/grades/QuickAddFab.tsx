import { Plus } from 'lucide-react'
import { useQuickAdd } from './quickAdd'

/** Global quick-entry action, reachable with a thumb on mobile without leaving the current screen. */
export function QuickAddFab() {
  const { openQuickAdd } = useQuickAdd()

  return (
    <button
      type="button"
      onClick={() => openQuickAdd()}
      aria-label="Neue Note hinzufügen"
      className="fixed bottom-20 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-mint text-[#06140f] shadow-lg transition-transform duration-200 hover:brightness-110 active:scale-95 md:bottom-8 md:right-8"
    >
      <Plus className="h-6 w-6" strokeWidth={2.25} />
    </button>
  )
}
