import { cleanup, configure } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Each project pill renders a hidden copy of its open card, purely so its
// height can be measured. Nobody can see or reach it, so text queries skip it
// the way a person would.
configure({ defaultIgnore: 'script, style, .pill--sizer, .pill--sizer *' })

// jsdom does not implement matchMedia. Every reduced-motion / media-query hook
// calls it at mount, and tests that care override this with their own mock.
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

// jsdom has no ResizeObserver; the journey's scroll container observes itself.
if (typeof window.ResizeObserver !== 'function') {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

afterEach(() => {
  cleanup()
})
