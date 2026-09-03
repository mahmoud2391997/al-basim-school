const Database = require('better-sqlite3');
const fs = require('node:fs');
const path = require('node:path');

function openSchoolDatabase(userDataPath) {
  fs.mkdirSync(userDataPath, { recursive: true });
  const db = new Database(path.join(userDataPath, 'al-bassam-school.sqlite'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS academic_years (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, label TEXT NOT NULL DEFAULT '', start_date TEXT NOT NULL DEFAULT '', end_date TEXT NOT NULL DEFAULT '', is_current INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, academic_year_id INTEGER NOT NULL DEFAULT 1, full_name TEXT NOT NULL, full_name_arabic TEXT NOT NULL DEFAULT '', student_number TEXT NOT NULL DEFAULT '', national_id TEXT NOT NULL DEFAULT '', grade TEXT NOT NULL DEFAULT '', class_name TEXT NOT NULL DEFAULT '', guardian_name TEXT NOT NULL DEFAULT '', guardian_phone TEXT NOT NULL DEFAULT '', enrollment_date TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'active');
    CREATE TABLE IF NOT EXISTS teachers (id INTEGER PRIMARY KEY AUTOINCREMENT, academic_year_id INTEGER NOT NULL DEFAULT 1, full_name TEXT NOT NULL, full_name_arabic TEXT NOT NULL DEFAULT '', name TEXT NOT NULL DEFAULT '', surname TEXT NOT NULL DEFAULT '', username TEXT NOT NULL DEFAULT '', password TEXT NOT NULL DEFAULT '', english_name TEXT NOT NULL DEFAULT '', employee_code TEXT NOT NULL DEFAULT '', national_id TEXT NOT NULL DEFAULT '', nationality TEXT NOT NULL DEFAULT '', gender TEXT NOT NULL DEFAULT '', marital_status TEXT NOT NULL DEFAULT '', religion TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '', area TEXT NOT NULL DEFAULT '', country TEXT NOT NULL DEFAULT '', height INTEGER NOT NULL DEFAULT 0, weight INTEGER NOT NULL DEFAULT 0, branch TEXT NOT NULL DEFAULT '', academic_level TEXT NOT NULL DEFAULT '', subject TEXT NOT NULL DEFAULT '', weekly_classes INTEGER NOT NULL DEFAULT 0, is_employee INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'active');
    CREATE TABLE IF NOT EXISTS employees (id INTEGER PRIMARY KEY AUTOINCREMENT, full_name TEXT NOT NULL, full_name_arabic TEXT NOT NULL DEFAULT '', employee_number TEXT NOT NULL DEFAULT '', national_id TEXT NOT NULL DEFAULT '', job_title TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'active');
    CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, author TEXT NOT NULL DEFAULT '', isbn TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT '', language TEXT NOT NULL DEFAULT 'Arabic', volume TEXT NOT NULL DEFAULT '', copies INTEGER NOT NULL DEFAULT 1, available_copies INTEGER NOT NULL DEFAULT 1, lost_copies INTEGER NOT NULL DEFAULT 0, damaged_copies INTEGER NOT NULL DEFAULT 0, total_copies INTEGER NOT NULL DEFAULT 1, date_added TEXT NOT NULL DEFAULT '', deposit_number TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'available', publication_place TEXT NOT NULL DEFAULT '', publication_date TEXT NOT NULL DEFAULT '', general_number TEXT NOT NULL DEFAULT '', special_number TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '', cover_image TEXT NOT NULL DEFAULT '', shelf TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, academic_year_id INTEGER NOT NULL, attendance_date TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('present','absent','late','excused')), note TEXT NOT NULL DEFAULT '', UNIQUE(student_id, attendance_date));
    CREATE TABLE IF NOT EXISTS borrows (id INTEGER PRIMARY KEY AUTOINCREMENT, book_id INTEGER NOT NULL, student_id INTEGER NOT NULL, borrowed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, due_date TEXT, returned_at TEXT, condition TEXT NOT NULL DEFAULT 'good');
    CREATE INDEX IF NOT EXISTS idx_students_year ON students(academic_year_id);
    CREATE INDEX IF NOT EXISTS idx_teachers_year ON teachers(academic_year_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_year_date ON attendance(academic_year_id, attendance_date);
  `);
  const migrations = [
    ['students', 'full_name_arabic TEXT NOT NULL DEFAULT \'\''], ['students', 'student_number TEXT NOT NULL DEFAULT \'\''], ['students', 'national_id TEXT NOT NULL DEFAULT \'\''], ['students', 'grade TEXT NOT NULL DEFAULT \'\''], ['students', 'class_name TEXT NOT NULL DEFAULT \'\''], ['students', 'guardian_name TEXT NOT NULL DEFAULT \'\''], ['students', 'guardian_phone TEXT NOT NULL DEFAULT \'\''], ['students', 'enrollment_date TEXT NOT NULL DEFAULT \'\''],
    ['teachers', 'full_name_arabic TEXT NOT NULL DEFAULT \'\''], ['teachers', 'name TEXT NOT NULL DEFAULT \'\''], ['teachers', 'surname TEXT NOT NULL DEFAULT \'\''], ['teachers', 'username TEXT NOT NULL DEFAULT \'\''], ['teachers', 'password TEXT NOT NULL DEFAULT \'\''], ['teachers', 'english_name TEXT NOT NULL DEFAULT \'\''], ['teachers', 'employee_code TEXT NOT NULL DEFAULT \'\''], ['teachers', 'national_id TEXT NOT NULL DEFAULT \'\''], ['teachers', 'nationality TEXT NOT NULL DEFAULT \'\''], ['teachers', 'gender TEXT NOT NULL DEFAULT \'\''], ['teachers', 'marital_status TEXT NOT NULL DEFAULT \'\''], ['teachers', 'religion TEXT NOT NULL DEFAULT \'\''], ['teachers', 'phone TEXT NOT NULL DEFAULT \'\''], ['teachers', 'email TEXT NOT NULL DEFAULT \'\''], ['teachers', 'address TEXT NOT NULL DEFAULT \'\''], ['teachers', 'area TEXT NOT NULL DEFAULT \'\''], ['teachers', 'country TEXT NOT NULL DEFAULT \'\''], ['teachers', 'height INTEGER NOT NULL DEFAULT 0'], ['teachers', 'weight INTEGER NOT NULL DEFAULT 0'], ['teachers', 'branch TEXT NOT NULL DEFAULT \'\''], ['teachers', 'academic_level TEXT NOT NULL DEFAULT \'\''], ['teachers', 'subject TEXT NOT NULL DEFAULT \'\''], ['teachers', 'weekly_classes INTEGER NOT NULL DEFAULT 0'], ['teachers', 'is_employee INTEGER NOT NULL DEFAULT 1'],
    ['academic_years', 'label TEXT NOT NULL DEFAULT \'\''], ['academic_years', 'start_date TEXT NOT NULL DEFAULT \'\''], ['academic_years', 'end_date TEXT NOT NULL DEFAULT \'\''],
    ['employees', 'full_name_arabic TEXT NOT NULL DEFAULT \'\''], ['employees', 'employee_number TEXT NOT NULL DEFAULT \'\''], ['employees', 'national_id TEXT NOT NULL DEFAULT \'\''], ['employees', 'job_title TEXT NOT NULL DEFAULT \'\''], ['employees', 'phone TEXT NOT NULL DEFAULT \'\''],
    ['books', 'isbn TEXT NOT NULL DEFAULT \'\''], ['books', 'category TEXT NOT NULL DEFAULT \'\''], ['books', 'language TEXT NOT NULL DEFAULT \'Arabic\''], ['books', 'volume TEXT NOT NULL DEFAULT \'\''], ['books', 'copies INTEGER NOT NULL DEFAULT 1'], ['books', 'shelf TEXT NOT NULL DEFAULT \'\''], ['books', 'date_added TEXT NOT NULL DEFAULT \'\''], ['books', 'deposit_number TEXT NOT NULL DEFAULT \'\''], ['books', 'status TEXT NOT NULL DEFAULT \'available\''], ['books', 'publication_place TEXT NOT NULL DEFAULT \'\''], ['books', 'publication_date TEXT NOT NULL DEFAULT \'\''], ['books', 'general_number TEXT NOT NULL DEFAULT \'\''], ['books', 'special_number TEXT NOT NULL DEFAULT \'\''], ['books', 'description TEXT NOT NULL DEFAULT \'\''], ['books', 'cover_image TEXT NOT NULL DEFAULT \'\''], ['books', 'lost_copies INTEGER NOT NULL DEFAULT 0'], ['books', 'damaged_copies INTEGER NOT NULL DEFAULT 0'],
    ['borrows', 'condition TEXT NOT NULL DEFAULT \'good\''],
  ];
  for (const [table, column] of migrations) {
    try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${column}`); } catch (error) { if (!String(error.message).includes('duplicate column name')) throw error; }
  }
  function ensureColumnDefault(tableName, column, defaultValue) {
    const info = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const col = info.find((c) => c.name === column);
    if (!col || col.dflt_value !== null) return;
    const sql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name = ?").get(tableName).sql;
    db.transaction(() => {
      db.exec(`ALTER TABLE ${tableName} RENAME TO ${tableName}__rebuild`);
      db.exec(sql.replace(new RegExp(`${column}\\s+(INTEGER\\s+NOT\\s+NULL)`, 'i'), `${column} $1 DEFAULT ${defaultValue}`));
      const cols = info.map((c) => c.name).join(',');
      db.exec(`INSERT INTO ${tableName} (${cols}) SELECT ${cols} FROM ${tableName}__rebuild`);
      db.exec(`DROP TABLE ${tableName}__rebuild`);
    })();
    db.exec(`CREATE INDEX IF NOT EXISTS idx_${tableName}_year ON ${tableName}(academic_year_id)`);
  }
  ensureColumnDefault('students', 'academic_year_id', 1);
  ensureColumnDefault('teachers', 'academic_year_id', 1);
  for (let gradeNumber = 1; gradeNumber <= 12; gradeNumber += 1) {
    db.prepare('UPDATE students SET grade = ? WHERE grade = ?').run(`Grade ${gradeNumber}`, String(gradeNumber));
  }
  if (db.prepare('SELECT COUNT(*) AS count FROM students').get().count === 0) {
    const seed = db.transaction(() => {
      db.prepare('INSERT OR IGNORE INTO academic_years (name, label, start_date, end_date, is_current) VALUES (?, ?, ?, ?, ?)').run('2025-2026', '2025-2026', '2025-09-01', '2026-06-30', 1);
      const employee = db.prepare('INSERT INTO employees (full_name, full_name_arabic, employee_number, national_id, job_title, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
      employee.run('Khalid Al-Otaibi', 'خالد العتيبي', 'EMP-001', '1067890123456', 'School Principal', '+966 50 111 2233', 'active');
      employee.run('Fatimah Al-Zahrani', 'فاطمة الزهراني', 'EMP-002', '1078901234567', 'Registrar', '+966 55 222 3344', 'active');
      const teacher = db.prepare('INSERT INTO teachers (full_name, full_name_arabic, employee_code, national_id, subject, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
      teacher.run('Adel Khamis', 'عادل خميس', 'TCH-001', '1023456789012', 'Arabic Language', '+966 50 123 4567', 'active');
      teacher.run('Sara Al-Mutairi', 'سارة المطيري', 'TCH-002', '1056789012345', 'Science', '+966 56 456 7890', 'active');
      const student = db.prepare('INSERT INTO students (full_name, full_name_arabic, student_number, national_id, grade, class_name, guardian_name, guardian_phone, enrollment_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      student.run('Abdulaziz Saud Alqahtani', 'عبدالعزيز سعود القحطاني', 'AB-2025-001', '1123456789', 'Grade 7', '7A', 'Saeed Alqahtani', '+966 50 111 2222', '2025-09-01', 'active');
      student.run('Sara Al-Harbi', 'سارة الحربي', 'AB-2025-014', '1234567890', 'Grade 8', '8A', 'Noura Al-Harbi', '+966 55 333 4444', '2025-09-01', 'active');
      const book = db.prepare('INSERT INTO books (title, author, isbn, category, language, copies, available_copies, lost_copies, damaged_copies, total_copies, shelf, date_added) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      book.run('Our Planet', 'David Attenborough', '9780521536608', 'Science', 'English', 5, 3, 1, 1, 5, 'A-12', '2025-09-01');
      book.run('Complete ICT IGCSE', 'Paul Culling', '9780981775470', 'Technology', 'English', 8, 6, 0, 0, 8, 'B-04', '2025-09-01');
      book.run('الرياضيات للمرحلة المتوسطة', 'وزارة التعليم', '9789953456789', 'Mathematics', 'Arabic', 12, 10, 0, 0, 12, 'D-01', '2025-09-01');
      const borrower = db.prepare('SELECT id FROM students WHERE student_number = ?').get('AB-2025-001');
      const borrowedBook = db.prepare('SELECT id, available_copies FROM books WHERE isbn = ?').get('9780981775470');
      if (borrower && borrowedBook && borrowedBook.available_copies > 0) {
        db.prepare('INSERT INTO borrows (book_id, student_id, due_date) VALUES (?, ?, ?)').run(borrowedBook.id, borrower.id, '2025-09-15');
        db.prepare('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?').run(borrowedBook.id);
      }
    });
    seed();
  }
  return db;
}

module.exports = { openSchoolDatabase };
