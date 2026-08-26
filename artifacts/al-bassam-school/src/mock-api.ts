const KEY = 'al-bassam-school-demo-v1';

type Row = Record<string, any> & { id: number };
type Store = Record<string, Row[]>;

const seed: Store = {
  students: [
    { id: 1, fullName: 'Sara Al-Harbi', fullNameArabic: 'سارة الحربي', studentNumber: 'AB-2024-014', nationalId: '1023456789', grade: 'Grade 8', className: '8A', guardianName: 'Khalid Al-Harbi', guardianPhone: '+966 5x xxx xxxx', enrollmentDate: '2024-09-01', status: 'active' },
    { id: 2, fullName: 'Omar Al-Qahtani', fullNameArabic: 'عمر القحطاني', studentNumber: 'AB-2024-015', nationalId: '1023456790', grade: 'Grade 7', className: '7B', guardianName: 'Noura Al-Qahtani', guardianPhone: '+966 5x xxx xxxx', enrollmentDate: '2024-09-01', status: 'active' },
  ],
  teachers: [{ id: 1, fullName: 'Maha Al-Salem', fullNameArabic: 'مها السالم', employeeNumber: 'T-001', email: 'maha@example.com', phone: '+966 5x xxx xxxx', subject: 'Mathematics', status: 'active' }],
  employees: [{ id: 1, fullName: 'Fahad Al-Mutairi', fullNameArabic: 'فهد المطيري', employeeNumber: 'E-001', role: 'Administrator', department: 'Administration', status: 'active' }],
  books: [{ id: 1, title: 'The Little Prince', author: 'Antoine de Saint-Exupéry', isbn: '978-0156012195', category: 'Literature', totalCopies: 4, availableCopies: 4, status: 'available' }],
  'academic-years': [{ id: 1, name: '2024 / 2025', startDate: '2024-09-01', endDate: '2025-06-30', isCurrent: true }],
  attendance: [{ id: 1, studentId: 1, academicYearId: 1, attendanceDate: '2025-01-12', status: 'present', note: '' }, { id: 2, studentId: 2, academicYearId: 1, attendanceDate: '2025-01-12', status: 'present', note: '' }],
  borrows: [],
};

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
function load(): Store { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : clone(seed); } catch { return clone(seed); } }
function save(store: Store) { localStorage.setItem(KEY, JSON.stringify(store)); }
function collection(path: string) { const parts = path.replace(/^\/api\//, '').split('/'); return parts[0] === 'library' ? 'books' : parts[0]; }

export function createMockFetch(): typeof fetch {
  return async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, window.location.origin);
    const method = (init.method || (typeof input !== 'string' && !(input instanceof URL) ? input.method : 'GET')).toUpperCase();
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    const store = load();
    if (url.pathname === '/api/dashboard/summary') {
      const students = store.students.filter((row) => row.status === 'active');
      const present = store.attendance.filter((row) => row.status === 'present').length;
      const total = store.attendance.length;
      return respond({ students: students.length, teachers: store.teachers.length, books: store.books.reduce((sum, row) => sum + Number(row.totalCopies || 0), 0), attendanceRate: total ? Math.round((present / total) * 1000) / 10 : 0, recentActivity: [] });
    }
    const name = collection(url.pathname); const rows = store[name] || [];
    const match = url.pathname.match(/\/(\d+)$/); const id = match ? Number(match[1]) : undefined;
    if (method === 'GET') {
      const search = url.searchParams.get('search')?.toLowerCase(); const status = url.searchParams.get('status');
      return respond(rows.filter((row) => (!search || JSON.stringify(row).toLowerCase().includes(search)) && (!status || row.status === status)));
    }
    if (method === 'POST') { const row = { ...body, id: Math.max(0, ...rows.map((item) => item.id)) + 1 }; rows.push(row); store[name] = rows; save(store); return respond(row, 201); }
    if (id === undefined) return respond({ error: 'Record id is required' }, 400);
    const index = rows.findIndex((row) => row.id === id); if (index < 0) return respond({ error: 'Record not found' }, 404);
    if (method === 'DELETE') rows.splice(index, 1); else if (method === 'PATCH') rows[index] = { ...rows[index], ...body };
    store[name] = rows; save(store); return respond(method === 'DELETE' ? null : rows[index], method === 'DELETE' ? 204 : 200);
  };
}
function respond(data: unknown, status = 200) { return new Response(status === 204 ? null : JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } }); }
export function resetMockData() { localStorage.setItem(KEY, JSON.stringify(seed)); window.location.reload(); }
