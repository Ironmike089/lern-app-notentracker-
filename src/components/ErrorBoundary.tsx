import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from './ui/Button'

interface Props {
  children: ReactNode
  /** Route-level fallback: fits inside the shell instead of taking the full viewport, and offers a "Zurück zur Übersicht" link instead of a full reload. */
  variant?: 'full' | 'inline'
}

interface State {
  error: Error | null
}

/**
 * Route-level use resets by remounting, not by watching props: the caller
 * passes `key={pathname}` (see AppShell) so React tears down and rebuilds
 * this boundary — and its error state with it — on every navigation, rather
 * than this component reaching for setState from componentDidUpdate.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      if (this.props.variant === 'inline') {
        return (
          <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-bg-card px-6 py-10 text-center">
            <p className="text-base font-semibold text-ink">Diese Ansicht konnte nicht geladen werden.</p>
            <p className="max-w-sm text-sm text-ink-soft">
              Deine gespeicherten Daten sind davon nicht betroffen. Versuch es über die Navigation erneut.
            </p>
            <Button variant="secondary" onClick={() => window.location.assign('#/app')}>
              <RotateCcw className="h-4 w-4" strokeWidth={2} />
              Zur Übersicht
            </Button>
          </div>
        )
      }
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
          <p className="text-lg font-semibold text-ink">Etwas ist schiefgelaufen.</p>
          <p className="max-w-sm text-sm text-ink-soft">
            Deine gespeicherten Daten sind davon nicht betroffen. Ein Neustart hilft meistens.
          </p>
          <Button onClick={() => window.location.reload()}>
            <RotateCcw className="h-4 w-4" strokeWidth={2} />
            Neu laden
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
