// Real Express server + configured MySQL, read-only HTTP checks. No seed/reset.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

test('real Express: React build -> restart on same port with legacy rollback', { timeout: 40000 }, async () => {
  const port = '5192';
  for (const mode of ['react', 'legacy']) {
    const child = spawn(process.execPath, [path.resolve(__dirname, '../scripts/start-frontend.js'), mode, port], {
      stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
    });
    const exited = once(child, 'exit');
    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Backend startup timed out; check MySQL/configuration')), 15000);
        let output = '';
        child.stdout.on('data', (chunk) => {
          output += chunk;
          if (output.includes(`http://localhost:${port}`)) { clearTimeout(timer); resolve(); }
        });
        child.once('error', (error) => { clearTimeout(timer); reject(error); });
        child.once('exit', (code) => { clearTimeout(timer); reject(new Error(`Backend exited during startup: ${code}`)); });
      });
      const url = `http://127.0.0.1:${port}`;
      const page = await fetch(url);
      assert.equal(page.status, 200);
      const html = await page.text();
      assert.match(html, mode === 'react' ? /\/assets\/index-.*\.js/ : /js\/app\.js/);
      const assetPath = mode === 'react' ? html.match(/src="(\/assets\/[^\"]+\.js)"/)[1] : '/js/app.js';
      assert.equal((await fetch(url + assetPath)).status, 200);
      const denied = await fetch(url + '/api/auth/me');
      assert.equal(denied.status, 401);
      assert.match(denied.headers.get('content-type'), /json/);
      const missing = await fetch(url + '/api/migration-not-found');
      assert.equal(missing.status, 404);
      assert.match(missing.headers.get('content-type'), /json/);
    } finally {
      if (child.exitCode === null) child.kill();
      await exited;
    }
  }
});
