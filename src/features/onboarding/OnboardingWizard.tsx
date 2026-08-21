import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { ErrorBanner } from '../../components/ui/ErrorBanner'
import { useToast } from '../../components/ui/toastContext'
import { completeOnboarding } from '../../services/onboardingService'
import { WelcomeStep } from './WelcomeStep'
import { StateStep } from './StateStep'
import { SchoolTypeStep } from './SchoolTypeStep'
import { GradeLevelStep } from './GradeLevelStep'
import { SubjectsStep } from './SubjectsStep'
import type { OnboardingDraft, SubjectSelectionDraft } from './types'

const TOTAL_STEPS = 5

interface OnboardingWizardProps {
  onComplete: () => void
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<OnboardingDraft>({ subjectSelections: [] })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()

  const goBack = () => setStep((s) => Math.max(s - 1, 0))

  async function handleFinish(subjectSelections: SubjectSelectionDraft[]) {
    setSubmitting(true)
    setError(null)
    try {
      await completeOnboarding({
        state: draft.state!,
        schoolType: draft.schoolType!,
        gradeLevel: draft.gradeLevel!,
        gradingScale: draft.gradingScale!,
        upperSecondary: draft.upperSecondary ?? false,
        subjectSelections: subjectSelections.map((s) => ({
          catalogId: s.catalogId,
          name: s.name,
          icon: s.icon,
          custom: s.custom,
        })),
      })
      showToast('Dein Tracker ist eingerichtet.', 'success')
      onComplete()
    } catch (err) {
      console.error('Onboarding konnte nicht gespeichert werden:', err)
      setError('Speichern hat nicht geklappt. Bitte versuch es noch einmal.')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col px-5 py-6">
      {step > 0 && (
        <header className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            aria-label="Zurück"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-bg-card hover:text-ink"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <ProgressBar value={step} max={TOTAL_STEPS - 1} className="flex-1" />
        </header>
      )}

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}

      {step === 1 && (
        <StateStep
          value={draft.state}
          onNext={(state) => {
            setDraft((d) => ({ ...d, state }))
            setStep(2)
          }}
        />
      )}

      {step === 2 && (
        <SchoolTypeStep
          value={draft.schoolType}
          onNext={(schoolType) => {
            setDraft((d) => ({ ...d, schoolType }))
            setStep(3)
          }}
        />
      )}

      {step === 3 && draft.schoolType && (
        <GradeLevelStep
          schoolType={draft.schoolType}
          onNext={({ gradeLevel, gradingScale, upperSecondary }) => {
            setDraft((d) => ({ ...d, gradeLevel, gradingScale, upperSecondary }))
            setStep(4)
          }}
        />
      )}

      {step === 4 && (
        <SubjectsStep
          initialSelections={draft.subjectSelections}
          submitting={submitting}
          onFinish={handleFinish}
        />
      )}
    </div>
  )
}
