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
    CREATE TABLE IF NOT EXISTS academic_years (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, is_current INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, academic_year_id INTEGER NOT NULL DEFAULT 1, full_name TEXT NOT NULL, full_name_arabic TEXT NOT NULL DEFAULT '', student_number TEXT NOT NULL DEFAULT '', national_id TEXT NOT NULL DEFAULT '', grade TEXT NOT NULL DEFAULT '', class_name TEXT NOT NULL DEFAULT '', guardian_name TEXT NOT NULL DEFAULT '', guardian_phone TEXT NOT NULL DEFAULT '', enrollment_date TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'active');
    CREATE TABLE IF NOT EXISTS teachers (id INTEGER PRIMARY KEY AUTOINCREMENT, academic_year_id INTEGER NOT NULL DEFAULT 1, full_name TEXT NOT NULL, full_name_arabic TEXT NOT NULL DEFAULT '', name TEXT NOT NULL DEFAULT '', surname TEXT NOT NULL DEFAULT '', employee_code TEXT NOT NULL DEFAULT '', national_id TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', subject TEXT NOT NULL DEFAULT '', weekly_classes INTEGER NOT NULL DEFAULT 0, is_employee INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'active');
    CREATE TABLE IF NOT EXISTS employees (id INTEGER PRIMARY KEY AUTOINCREMENT, full_name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active');
    CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, author TEXT NOT NULL DEFAULT '', isbn TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT '', language TEXT NOT NULL DEFAULT 'Arabic', total_copies INTEGER NOT NULL DEFAULT 1, available_copies INTEGER NOT NULL DEFAULT 1, shelf TEXT NOT NULL DEFAULT '', date_added TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, academic_year_id INTEGER NOT NULL, attendance_date TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('present','absent','late','excused')), note TEXT NOT NULL DEFAULT '', UNIQUE(student_id, attendance_date));
    CREATE INDEX IF NOT EXISTS idx_students_year ON students(academic_year_id);
    CREATE INDEX IF NOT EXISTS idx_teachers_year ON teachers(academic_year_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_year_date ON attendance(academic_year_id, attendance_date);
  `);
  const migrations = [
    ['students', 'full_name_arabic TEXT NOT NULL DEFAULT \'\''], ['students', 'student_number TEXT NOT NULL DEFAULT \'\''], ['students', 'national_id TEXT NOT NULL DEFAULT \'\''], ['students', 'grade TEXT NOT NULL DEFAULT \'\''], ['students', 'class_name TEXT NOT NULL DEFAULT \'\''], ['students', 'guardian_name TEXT NOT NULL DEFAULT \'\''], ['students', 'guardian_phone TEXT NOT NULL DEFAULT \'\''], ['students', 'enrollment_date TEXT NOT NULL DEFAULT \'\''],
    ['teachers', 'full_name_arabic TEXT NOT NULL DEFAULT \'\''], ['teachers', 'name TEXT NOT NULL DEFAULT \'\''], ['teachers', 'surname TEXT NOT NULL DEFAULT \'\''], ['teachers', 'employee_code TEXT NOT NULL DEFAULT \'\''], ['teachers', 'national_id TEXT NOT NULL DEFAULT \'\''], ['teachers', 'phone TEXT NOT NULL DEFAULT \'\''], ['teachers', 'email TEXT NOT NULL DEFAULT \'\''], ['teachers', 'subject TEXT NOT NULL DEFAULT \'\''], ['teachers', 'weekly_classes INTEGER NOT NULL DEFAULT 0'], ['teachers', 'is_employee INTEGER NOT NULL DEFAULT 1'],
    ['books', 'isbn TEXT NOT NULL DEFAULT \'\''], ['books', 'category TEXT NOT NULL DEFAULT \'\''], ['books', 'language TEXT NOT NULL DEFAULT \'Arabic\''], ['books', 'shelf TEXT NOT NULL DEFAULT \'\''], ['books', 'date_added TEXT NOT NULL DEFAULT \'\''],
  ];
  for (const [table, column] of migrations) {
    try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${column}`); } catch (error) { if (!String(error.message).includes('duplicate column name')) throw error; }
  }
  return db;
}

module.exports = { openSchoolDatabase };
