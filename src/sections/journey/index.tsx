import type { SectionProps } from '../SectionProps'
import { ReducedMotionFallback } from './ReducedMotionFallback'
import { JourneyScene } from './JourneyScene'
import './journey.css'

export default function JourneySection({ reducedMotion, item }: SectionProps) {
  return reducedMotion ? <ReducedMotionFallback /> : <JourneyScene stopId={item} />
}
