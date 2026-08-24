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
    CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, academic_year_id INTEGER NOT NULL, full_name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active');
    CREATE TABLE IF NOT EXISTS teachers (id INTEGER PRIMARY KEY AUTOINCREMENT, academic_year_id INTEGER NOT NULL, full_name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active');
    CREATE TABLE IF NOT EXISTS employees (id INTEGER PRIMARY KEY AUTOINCREMENT, full_name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active');
    CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, author TEXT NOT NULL DEFAULT '', total_copies INTEGER NOT NULL DEFAULT 1, available_copies INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, academic_year_id INTEGER NOT NULL, attendance_date TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('present','absent','late','excused')), note TEXT NOT NULL DEFAULT '', UNIQUE(student_id, attendance_date));
    CREATE INDEX IF NOT EXISTS idx_students_year ON students(academic_year_id);
    CREATE INDEX IF NOT EXISTS idx_teachers_year ON teachers(academic_year_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_year_date ON attendance(academic_year_id, attendance_date);
  `);
  return db;
}

module.exports = { openSchoolDatabase };
