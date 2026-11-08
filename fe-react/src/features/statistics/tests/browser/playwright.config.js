import { fileURLToPath } from 'node:url'
import { defineConfig } from '@playwright/test'
import base from '../../../../../playwright.config.js'

// Feature-owned browser checks; reuse the project's browser/server configuration.
// Run from fe-react: node node_modules/@playwright/test/cli.js test --config src/features/statistics/tests/browser/playwright.config.js
export default defineConfig({
  ...base,
  testDir: '.',
  testMatch: '**/*.spec.js',
  outputDir: './test-results',
  webServer: {
    ...base.webServer,
    cwd: fileURLToPath(new URL('../../../../../', import.meta.url)),
  },
})
