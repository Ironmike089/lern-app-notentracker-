import { useNavigate } from 'react-router-dom'
import { OnboardingWizard } from '../features/onboarding/OnboardingWizard'

export function OnboardingRoute() {
  const navigate = useNavigate()
  return <OnboardingWizard onComplete={() => navigate('/app', { replace: true })} />
}
