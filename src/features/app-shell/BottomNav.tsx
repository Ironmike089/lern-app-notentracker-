import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { NAV_ITEMS } from './navItems'

/** Mobile-only primary navigation, max 4 destinations. Quick Add is a separate floating action, not a 5th tab. */
export function BottomNav() {
  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 backdrop-blur md:hidden"
    >
      <div className="mx-auto flex w-full max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors duration-200',
                isActive ? 'text-mint' : 'text-ink-faint hover:text-ink-soft',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
