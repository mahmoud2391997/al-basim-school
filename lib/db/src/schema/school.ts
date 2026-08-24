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
  nationalId: text("national_id").notNull().default(""),
  subject: text("subject").notNull(),
  phone: text("phone").notNull(),
  status: text("status").notNull().default("active"),
});

export const employeesTable = pgTable("employees", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  fullName: text("full_name").notNull(),
  fullNameArabic: text("full_name_arabic").notNull(),
  employeeNumber: text("employee_number").notNull().unique(),
  nationalId: text("national_id").notNull().default(""),
  jobTitle: text("job_title").notNull(),
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

export const borrowsTable = pgTable("borrows", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bookId: integer("book_id").notNull().references(() => booksTable.id, { onDelete: "cascade" }),
  studentId: integer("student_id").notNull().references(() => studentsTable.id, { onDelete: "cascade" }),
  borrowedAt: timestamp("borrowed_at", { withTimezone: true }).notNull().defaultNow(),
  dueDate: date("due_date", { mode: "string" }),
  returnedAt: timestamp("returned_at", { withTimezone: true }),
});

export const insertAcademicYearSchema = createInsertSchema(academicYearsTable);
export const insertStudentSchema = createInsertSchema(studentsTable);
export const insertTeacherSchema = createInsertSchema(teachersTable);
export const insertEmployeeSchema = createInsertSchema(employeesTable);
export const insertBookSchema = createInsertSchema(booksTable);
export const insertBorrowSchema = createInsertSchema(borrowsTable);

export type InsertAcademicYear = z.infer<typeof insertAcademicYearSchema>;
export type AcademicYear = typeof academicYearsTable.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Teacher = typeof teachersTable.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employeesTable.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof booksTable.$inferSelect;
export type InsertBorrow = z.infer<typeof insertBorrowSchema>;
export type Borrow = typeof borrowsTable.$inferSelect;