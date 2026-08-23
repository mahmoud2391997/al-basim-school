import { createInsertSchema } from "drizzle-zod";
import { date, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const academicYearsTable = pgTable("academic_years", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  label: text("label").notNull().unique(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  isCurrent: text("is_current").notNull().default("false"),
});

export const studentsTable = pgTable("students", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  fullName: text("full_name").notNull(),
  fullNameArabic: text("full_name_arabic").notNull(),
  studentNumber: text("student_number").notNull().unique(),
  nationalId: text("national_id").notNull(),
  grade: text("grade").notNull(),
  className: text("class_name").notNull(),
  guardianName: text("guardian_name").notNull().default(""),
  guardianPhone: text("guardian_phone").notNull().default(""),
  status: text("status").notNull().default("active"),
  enrollmentDate: date("enrollment_date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const teachersTable = pgTable("teachers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  fullName: text("full_name").notNull(),
  fullNameArabic: text("full_name_arabic").notNull(),
  employeeNumber: text("employee_number").notNull().unique(),
  subject: text("subject").notNull(),
  phone: text("phone").notNull(),
  status: text("status").notNull().default("active"),
});

export const booksTable = pgTable("books", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  isbn: text("isbn").notNull().default(""),
  category: text("category").notNull(),
  copies: integer("copies").notNull().default(1),
  availableCopies: integer("available_copies").notNull().default(1),
  language: text("language").notNull().default("Arabic"),
  shelf: text("shelf").notNull().default(""),
});

export const insertAcademicYearSchema = createInsertSchema(academicYearsTable);
export const insertStudentSchema = createInsertSchema(studentsTable);
export const insertTeacherSchema = createInsertSchema(teachersTable);
export const insertBookSchema = createInsertSchema(booksTable);

export type InsertAcademicYear = z.infer<typeof insertAcademicYearSchema>;
export type AcademicYear = typeof academicYearsTable.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Teacher = typeof teachersTable.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof booksTable.$inferSelect;