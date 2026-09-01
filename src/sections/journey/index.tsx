import type { SectionProps } from '../SectionProps'
import { ReducedMotionFallback } from './ReducedMotionFallback'
import { JourneyScene } from './JourneyScene'
import './journey.css'

export default function JourneySection({ reducedMotion }: SectionProps) {
  return reducedMotion ? <ReducedMotionFallback /> : <JourneyScene />
}
