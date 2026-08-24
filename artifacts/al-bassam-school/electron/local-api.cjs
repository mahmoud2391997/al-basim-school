const http = require('node:http');
const { openSchoolDatabase } = require('./local-db.cjs');
const { hashPassword, verifyPassword } = require('./local-auth.cjs');
const crypto = require('node:crypto');

const collections = {
  '/api/students': { table: 'students', fields: ['full_name', 'status', 'academic_year_id'] },
  '/api/teachers': { table: 'teachers', fields: ['full_name', 'status', 'academic_year_id'] },
  '/api/employees': { table: 'employees', fields: ['full_name', 'status'] },
  '/api/library/books': { table: 'books', fields: ['title', 'author', 'total_copies', 'available_copies'] },
  '/api/academic-years': { table: 'academic_years', fields: ['name', 'is_current'] },
  '/api/attendance': { table: 'attendance', fields: ['student_id', 'academic_year_id', 'attendance_date', 'status', 'note'] },
};

function json(res, status, body) { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); }
function body(req) { return new Promise((resolve, reject) => { let raw = ''; req.on('data', (chunk) => raw += chunk); req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Invalid JSON')); } }); }); }
function startLocalApi(userDataPath) {
  const db = openSchoolDatabase(userDataPath);
  let sessionToken = null;
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (req.method === 'OPTIONS') return json(res, 204, {});
      if (url.pathname === '/api/auth/status') return json(res, 200, { setupRequired: !db.prepare("SELECT value FROM app_meta WHERE key = 'admin_password'").get(), authenticated: Boolean(sessionToken) });
      if (url.pathname === '/api/auth/setup' && req.method === 'POST') { const input = await body(req); if (db.prepare("SELECT value FROM app_meta WHERE key = 'admin_password'").get()) return json(res, 409, { error: 'Admin already configured' }); if (!input.password || String(input.password).length < 10) return json(res, 400, { error: 'Password must be at least 10 characters' }); db.prepare("INSERT INTO app_meta (key,value) VALUES ('admin_password', ?)").run(hashPassword(String(input.password))); return json(res, 201, { ok: true }); }
      if (url.pathname === '/api/auth/login' && req.method === 'POST') { const input = await body(req); const record = db.prepare("SELECT value FROM app_meta WHERE key = 'admin_password'").get(); if (!record || !verifyPassword(String(input.password || ''), record.value)) return json(res, 401, { error: 'Invalid credentials' }); sessionToken = crypto.randomBytes(32).toString('hex'); return json(res, 200, { token: sessionToken }); }
      if (url.pathname === '/api/auth/logout' && req.method === 'POST') { sessionToken = null; return json(res, 204, {}); }
      if (url.pathname === '/api/health') return json(res, 200, { status: 'ok', mode: 'offline' });
      if (url.pathname === '/api/desktop/status') return json(res, 200, { mode: 'offline', database: 'sqlite' });
      const match = Object.entries(collections).find(([base]) => url.pathname === base || url.pathname.startsWith(`${base}/`));
      if (!match) return json(res, 404, { error: 'Not found' });
      if (!sessionToken || req.headers.authorization !== `Bearer ${sessionToken}`) return json(res, 401, { error: 'Authentication required' });
      const [base, config] = match;
      const id = url.pathname.slice(base.length + 1);
      if (req.method === 'GET') {
        const rows = db.prepare(`SELECT * FROM ${config.table} ORDER BY id DESC`).all();
        return json(res, 200, rows);
      }
      if (req.method === 'POST') {
        const input = await body(req);
        const fields = config.fields.filter((field) => input[field] !== undefined);
        if (!fields.length) return json(res, 400, { error: 'No writable fields supplied' });
        const values = fields.map((field) => input[field]);
        const result = db.prepare(`INSERT INTO ${config.table} (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')}) RETURNING *`).get(...values);
        return json(res, 201, result);
      }
      if (req.method === 'PATCH' && id) {
        const input = await body(req);
        const fields = config.fields.filter((field) => input[field] !== undefined);
        if (!fields.length) return json(res, 400, { error: 'No writable fields supplied' });
        const result = db.prepare(`UPDATE ${config.table} SET ${fields.map((field) => `${field} = ?`).join(',')} WHERE id = ? RETURNING *`).get(...fields.map((field) => input[field]), Number(id));
        return result ? json(res, 200, result) : json(res, 404, { error: 'Record not found' });
      }
      if (req.method === 'DELETE' && id) {
        const result = db.prepare(`DELETE FROM ${config.table} WHERE id = ?`).run(Number(id));
        return result.changes ? json(res, 204, {}) : json(res, 404, { error: 'Record not found' });
      }
      return json(res, 405, { error: 'Method not allowed' });
    } catch (error) { return json(res, 400, { error: error.message === 'Invalid JSON' ? error.message : 'Request failed' }); }
  });
  return new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port, db })); });
}
module.exports = { startLocalApi };
