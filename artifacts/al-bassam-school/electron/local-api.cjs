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

function toClientRow(table, row) {
  if (table === 'academic_years') return { id: row.id, label: row.name, startDate: '', endDate: '', isCurrent: Boolean(row.is_current) };
  if (table === 'students') return { ...row, fullName: row.full_name, fullNameArabic: row.full_name_arabic || '', studentNumber: row.student_number || '', nationalId: row.national_id || '', grade: row.grade || '', className: row.class_name || '', guardianName: row.guardian_name || '', guardianPhone: row.guardian_phone || '', enrollmentDate: row.enrollment_date || '' };
  if (table === 'teachers') return { ...row, fullName: row.full_name, fullNameArabic: row.full_name_arabic || '', name: row.name || row.full_name, surname: row.surname || '', employeeCode: row.employee_code || '', nationalId: row.national_id || '', phone: row.phone || '', email: row.email || '', subject: row.subject || '', weeklyClasses: row.weekly_classes || 0, isEmployee: Boolean(row.is_employee) };
  if (table === 'employees') return { ...row, fullName: row.full_name };
  if (table === 'books') return { ...row, isbn: row.isbn || '', category: row.category || '', language: row.language || 'Arabic', copies: row.total_copies, availableCopies: row.available_copies, shelf: row.shelf || '', dateAdded: row.date_added || '' };
  return row;
}

function toDatabaseInput(table, input) {
  if (table === 'students') return { full_name: input.fullName, full_name_arabic: input.fullNameArabic, student_number: input.studentNumber, national_id: input.nationalId, grade: input.grade, class_name: input.className, guardian_name: input.guardianName, guardian_phone: input.guardianPhone, enrollment_date: input.enrollmentDate, status: input.status, academic_year_id: input.academicYearId ?? 1 };
  if (table === 'teachers') return { full_name: input.fullName || [input.name, input.surname].filter(Boolean).join(' '), full_name_arabic: input.fullNameArabic, name: input.name, surname: input.surname, employee_code: input.employeeCode, national_id: input.nationalId, phone: input.phone, email: input.email, subject: input.subject, weekly_classes: input.weeklyClasses, is_employee: input.isEmployee, status: input.status, academic_year_id: input.academicYearId ?? 1 };
  if (table === 'employees') return { full_name: input.fullName, status: input.status };
  if (table === 'books') return { title: input.title, author: input.author, isbn: input.isbn, category: input.category, language: input.language, total_copies: input.copies, available_copies: input.availableCopies ?? input.copies, shelf: input.shelf, date_added: input.dateAdded };
  if (table === 'academic_years') return { name: input.label || input.name, is_current: input.isCurrent ?? input.is_current };
  return input;
}

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  });
  res.end(JSON.stringify(body));
}
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
      if (url.pathname === '/api/dashboard/summary') {
        return json(res, 200, {
          students: db.prepare("SELECT COUNT(*) AS count FROM students WHERE status = 'active'").get().count,
          teachers: db.prepare("SELECT COUNT(*) AS count FROM teachers WHERE status = 'active'").get().count,
          books: db.prepare('SELECT COUNT(*) AS count FROM books').get().count,
          attendanceRate: 0,
          recentActivity: [],
        });
      }
      if (url.pathname === '/api/library/borrows') return json(res, 200, []);
      const match = Object.entries(collections).find(([base]) => url.pathname === base || url.pathname.startsWith(`${base}/`));
      if (!match) return json(res, 404, { error: 'Not found' });
      const [base, config] = match;
      const id = url.pathname.slice(base.length + 1);
      if (req.method === 'GET') {
        const rows = db.prepare(`SELECT * FROM ${config.table} ORDER BY id DESC`).all();
        return json(res, 200, rows.map((row) => toClientRow(config.table, row)));
      }
      if (req.method === 'POST') {
        const input = toDatabaseInput(config.table, await body(req));
        const fields = config.fields.filter((field) => input[field] !== undefined);
        if (!fields.length) return json(res, 400, { error: 'No writable fields supplied' });
        const values = fields.map((field) => input[field]);
        const result = db.prepare(`INSERT INTO ${config.table} (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')}) RETURNING *`).get(...values);
        return json(res, 201, toClientRow(config.table, result));
      }
      if (req.method === 'PATCH' && id) {
        const input = toDatabaseInput(config.table, await body(req));
        const fields = config.fields.filter((field) => input[field] !== undefined);
        if (!fields.length) return json(res, 400, { error: 'No writable fields supplied' });
        const result = db.prepare(`UPDATE ${config.table} SET ${fields.map((field) => `${field} = ?`).join(',')} WHERE id = ? RETURNING *`).get(...fields.map((field) => input[field]), Number(id));
        return result ? json(res, 200, toClientRow(config.table, result)) : json(res, 404, { error: 'Record not found' });
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
