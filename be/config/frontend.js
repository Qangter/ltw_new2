const fs = require('node:fs');
const path = require('node:path');
const express = require('express');

// Mount AFTER API routes and their JSON 404. Hash routes need no HTML fallback.
function createFrontendMiddleware({ mode = process.env.FRONTEND || 'legacy', root } = {}) {
  if (!['legacy', 'react'].includes(mode)) throw new Error('FRONTEND must be legacy or react');
  const directory = root || path.resolve(__dirname, '../..', mode === 'react' ? 'fe-react/dist' : 'fe');
  const router = express.Router();
  router.use((req, res, next) => {
    if (!fs.existsSync(path.join(directory, 'index.html'))) {
      return res.status(503).type('text').set('Cache-Control', 'no-store').send(
        mode === 'react'
          ? 'React build is missing. Run npm --prefix fe-react run build, then restart. Rollback: FRONTEND=legacy.'
          : 'Legacy frontend index.html is missing.',
      );
    }
    next();
  });
  router.use(express.static(directory, {
    setHeaders(res, file) {
      if (path.basename(file) === 'index.html') res.setHeader('Cache-Control', 'no-cache');
      else if (mode === 'react' && path.dirname(file) === path.join(directory, 'assets')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }));
  router.use((req, res) => res.status(404).type('text').send('Frontend resource not found. Use /#/ for application routes.'));
  return router;
}

module.exports = { createFrontendMiddleware };
