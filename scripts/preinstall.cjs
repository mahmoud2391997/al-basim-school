const fs = require('node:fs');
const path = require('node:path');

for (const file of ['package-lock.json', 'yarn.lock']) {
  fs.rmSync(path.resolve(__dirname, '..', file), { force: true });
}

if (!String(process.env.npm_config_user_agent || '').startsWith('pnpm/')) {
  console.error('Use pnpm instead');
  process.exit(1);
}
