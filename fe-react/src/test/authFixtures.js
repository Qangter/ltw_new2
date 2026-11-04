// Fixtures for tests ONLY. No demo data is used by the application.
import { vi } from 'vitest'
import { createAuthSession } from '../features/auth/authSession.js'
import { readFixture } from './readFixtures.js'
export const userFixture = (role = 'ADMIN') => ({ id: role === 'STUDENT' ? 3 : 1, username: role.toLowerCase(), full_name: `Test ${role}`, role })
export const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
export function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
export function testSession({ token = 'test-token', role = 'ADMIN', fetchImpl } = {}) {
  let storedToken = token
  const storage = {
    readToken: vi.fn(() => storedToken),
    save: vi.fn((value) => { storedToken = value; return true }),
    clear: vi.fn(() => { storedToken = null; return true }),
  }
  const fetchMock = fetchImpl || vi.fn(async (url) => jsonResponse(readFixture(url) ?? userFixture(role)))
  return { session: createAuthSession({ storage, fetchImpl: fetchMock }), storage, fetchMock }
}
