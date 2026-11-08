import { defineConfig } from '@playwright/test'
import base from './playwright.config.js'

export default defineConfig(base, {
  // __components is intentionally absent from production. Actual page/modal tests still run.
  testIgnore: ['e2e/foundation.spec.js'],
  use: { ...base.use, baseURL: 'http://127.0.0.1:5181' },
  webServer: {
    command: 'node ../be/scripts/start-frontend.js react 5181',
    url: 'http://127.0.0.1:5181',
    reuseExistingServer: false,
    timeout: 30000,
  },
})
