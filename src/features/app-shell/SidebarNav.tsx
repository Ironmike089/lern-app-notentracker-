import { NavLink } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { cn } from '../../utils/cn'
import { NAV_ITEMS } from './navItems'

/**
 * Tablet: icon-only rail. Desktop (lg+): full sidebar with labels.
 * Same four destinations as BottomNav — one navigation model, two layouts.
 */
export function SidebarNav() {
  return (
    <aside className="sticky top-0 hidden h-svh shrink-0 flex-col border-r border-border bg-bg-raised/40 md:flex md:w-20 lg:w-64">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Logo size={28} />
        <p className="hidden text-base font-bold text-ink lg:block">Notentracker</p>
      </div>

      <nav aria-label="Hauptnavigation" className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                'md:justify-center lg:justify-start',
                isActive ? 'bg-mint-soft/40 text-ink' : 'text-ink-soft hover:bg-bg-card hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
                <span className="hidden lg:block">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
