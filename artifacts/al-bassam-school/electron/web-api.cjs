const path = require('node:path');
const { startLocalApi } = require('./local-api.cjs');

startLocalApi(path.join(__dirname, '..', '.web-data'), 24500)
  .then(({ port }) => console.log(`Local web API listening on http://127.0.0.1:${port}`))
  .catch((error) => {
    console.error('Failed to start local web API:', error);
    process.exit(1);
  });
