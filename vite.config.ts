/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    // The three.js runtime is one deliberately large chunk, loaded only when a
    // 3D section opens. Naming it keeps it recognisable in the output; the
    // limit is raised so its size is not reported as a surprise every build.
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules\/(three|@react-three|@react-spring)\//.test(id)) return 'three'
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    // The Projects tests were written against vitest globals.
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})
