import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const env = loadEnv('development', root, '')
const backend = env.API_PROXY_TARGET || 'http://localhost:3000'
const frontend = process.env.FRONTEND_URL || 'http://127.0.0.1:5173'

async function read(base, pathname) {
  const url = new URL(pathname, base)
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
  return { status: response.status, contentType: response.headers.get('content-type'), text: await response.text() }
}

try {
  // Real read-only requests. No fake server, token, login, or database writes.
  const current = await read(frontend, '/')
  assert.equal(current.status, 200)
  assert.match(current.text, /id="root"/)
  for (const [pathname, expectedStatus, expectedMessage] of [
    ['/api/auth/me', 401, 'Chưa đăng nhập'],
    ['/api/__migration_probe_missing', 404, 'API không tồn tại'],
  ]) {
    const direct = await read(backend, pathname)
    const proxied = await read(frontend, pathname)
    assert.equal(direct.status, expectedStatus)
    assert.equal(proxied.status, direct.status)
    assert.match(proxied.contentType, /application\/json/)
    assert.deepEqual(JSON.parse(proxied.text), JSON.parse(direct.text))
    assert.equal(JSON.parse(proxied.text).message, expectedMessage)
    console.log(`PASS ${pathname}: HTTP ${expectedStatus}, JSON unchanged through proxy`)
  }
  console.log('PASS React shell returns HTTP 200 and API proxy matches the backend')
} catch (error) {
  console.error(`Proxy check failed: ${error.message}`)
  console.error('Start the existing backend and Vite first. This check does not start or modify either server.')
  process.exitCode = 1
}
