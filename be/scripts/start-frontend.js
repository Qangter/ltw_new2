// Cross-platform launcher; does not modify .env or database state.
const path = require('node:path');
const [mode, port] = process.argv.slice(2);
if (mode !== 'react' || (port && !/^\d+$/.test(port))) {
  throw new Error('Usage: node scripts/start-frontend.js react [port]');
}
if (port) process.env.PORT = port;
process.chdir(path.resolve(__dirname, '..'));
require('../server');
