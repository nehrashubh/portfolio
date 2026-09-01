/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { target: 'es2022' },
  test: {
    environment: 'jsdom',
    // The Projects tests were written against vitest globals.
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})
