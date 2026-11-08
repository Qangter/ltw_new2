const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('express');
const { createFrontendMiddleware } = require('../config/frontend');

test('invalid frontend selection fails explicitly', () => {
  assert.throws(() => createFrontendMiddleware({ mode: 'typo' }), /FRONTEND/);
});

for (const mode of ['legacy', 'react']) {
  test(`${mode}: index/assets, hash URLs, JSON API 404 and missing build`, async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'migration-static-'));
    fs.mkdirSync(path.join(root, 'assets'));
    fs.writeFileSync(path.join(root, 'index.html'), '<!doctype html><title>Static fixture</title>');
    fs.writeFileSync(path.join(root, 'assets', 'app-123abc.js'), 'console.log("fixture")');
    const app = express();
    app.use('/api', (req, res) => res.status(404).json({ message: 'API fixture not found' }));
    app.use(createFrontendMiddleware({ mode, root }));
    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const url = `http://127.0.0.1:${server.address().port}`;
    try {
      for (const route of ['/', '/index.html', '/#/student/42']) {
        const response = await fetch(url + route);
        assert.equal(response.status, 200);
        assert.equal(response.headers.get('cache-control'), 'no-cache');
        assert.match(await response.text(), /Static fixture/);
      }
      const asset = await fetch(url + '/assets/app-123abc.js');
      assert.match(asset.headers.get('content-type'), /javascript/);
      if (mode === 'react') assert.match(asset.headers.get('cache-control'), /immutable/);
      for (const route of ['/assets/missing.js', '/non-hash-route']) {
        const response = await fetch(url + route);
        assert.equal(response.status, 404);
        assert.match(response.headers.get('content-type'), /text\/plain/);
      }
      fs.unlinkSync(path.join(root, 'index.html')); // Only this test's generated fixture.
      const missing = await fetch(url + '/');
      assert.equal(missing.status, 503);
      assert.equal(missing.headers.get('cache-control'), 'no-store');
      assert.match(await missing.text(), /missing/);
      for (const method of ['GET', 'POST']) {
        const api = await fetch(url + '/api/not-found', { method });
        assert.equal(api.status, 404);
        assert.match(api.headers.get('content-type'), /application\/json/);
      }
    } finally {
      await new Promise((resolve) => server.close(resolve));
      assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
      assert.ok(path.basename(root).startsWith('migration-static-'));
      fs.rmSync(root, { recursive: true });
    }
  });
}
