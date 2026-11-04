import { readFixture } from '../src/test/readFixtures.js'
export async function mockReadApi(target) {
  await target.route('**/api/**', (route) => {
    const data = readFixture(route.request().url())
    return data === undefined ? route.fallback() : route.fulfill({ json: data })
  })
}
