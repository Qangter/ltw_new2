import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '')
  const proxy = {
    '/api': {
      target: env.API_PROXY_TARGET || 'http://localhost:3000',
      changeOrigin: true,
    },
  }

  return {
    // Parallel dev and E2E servers must not rewrite each other's optimized deps.
    cacheDir: mode === 'e2e' ? 'node_modules/.vite-e2e' : 'node_modules/.vite',
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy,
      // Source and assets belong to React; keep backend configuration outside Vite.
      fs: { allow: [root] },
    },
    preview: { host: '127.0.0.1', port: 4173, strictPort: true, proxy },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
      include: ['src/**/*.test.{js,jsx}'],
      clearMocks: true,
      restoreMocks: true,
    },
  }
})
