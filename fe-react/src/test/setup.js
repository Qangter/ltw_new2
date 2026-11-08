import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(cleanup)

// jsdom does not implement the native modal top layer/inert behavior.
// These shims only support component lifecycle tests; Playwright tests real focus.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () { this.open = true }
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function () { this.open = false }
}
