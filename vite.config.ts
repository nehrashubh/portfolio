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
          // React gets its own chunk, and it must come FIRST. Without this
          // the bundler puts React — shared by the landing and every
          // section — inside the three chunk, and the landing then cannot
          // render until all 1.1 MB of WebGL has downloaded. The whole
          // point of the lazy sections is that it never downloads at all
          // unless a card is opened.
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
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
