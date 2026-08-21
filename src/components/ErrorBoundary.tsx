import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from './ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

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
