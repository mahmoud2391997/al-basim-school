import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, isNull, or, sql, gte, lte, count, sum } from "drizzle-orm";
import { db, academicYearsTable, attendanceTable, booksTable, borrowsTable, employeesTable, studentsTable, teachersTable } from "@workspace/db";
import { z } from "zod";
import {
  CreateBookBody,
  CreateBookResponse,
  CreateStudentBody,
  CreateStudentResponse,
  CreateTeacherBody,
  CreateTeacherResponse,
  DeleteBookParams,
  DeleteStudentParams,
  DeleteTeacherParams,
  GetAcademicYearsResponse,
  GetBooksQueryParams,
  GetBooksResponse,
  GetDashboardSummaryResponse,
  GetStudentsQueryParams,
  GetStudentsResponse,
  GetTeachersQueryParams,
  GetTeachersResponse,
  CreateEmployeeBody,
  CreateEmployeeResponse,
  DeleteEmployeeParams,
  GetEmployeesQueryParams,
  GetEmployeesResponse,
  UpdateBookBody,
  UpdateBookParams,
  UpdateBookResponse,
  UpdateStudentBody,
  UpdateStudentParams,
  UpdateStudentResponse,
  UpdateTeacherBody,
  UpdateTeacherParams,
  UpdateTeacherResponse,
  UpdateEmployeeBody,
  UpdateEmployeeParams,
  UpdateEmployeeResponse,
  CreateBorrowBody,
  CreateBorrowResponse,
  GetBorrowsQueryParams,
  GetBorrowsResponse,
  ReturnBorrowParams,
  ReturnBorrowResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [students, teachers, books, recent] = await Promise.all([
    db.select({ id: studentsTable.id }).from(studentsTable).where(eq(studentsTable.status, "active")),
    db.select({ id: teachersTable.id }).from(teachersTable).where(eq(teachersTable.status, "active")),
    db.select({ id: booksTable.id }).from(booksTable),
    db.select({
      id: studentsTable.id,
      title: studentsTable.fullName,
      timestamp: studentsTable.createdAt,
    }).from(studentsTable).orderBy(desc(studentsTable.createdAt)).limit(4),
  ]);
  const attendance = await db.select({
    present: sum(sql`case when ${attendanceTable.status} = 'present' then 1 else 0 end`),
    total: count(attendanceTable.id),
  }).from(attendanceTable);
  const attendanceRate = Number(attendance[0]?.total) > 0
    ? Math.round((Number(attendance[0]?.present ?? 0) / Number(attendance[0]?.total)) * 1000) / 10
    : 0;
  res.json(GetDashboardSummaryResponse.parse({
    students: students.length,
    teachers: teachers.length,
    books: books.length,
    attendanceRate,
    recentActivity: recent.map((item) => ({
      id: item.id,
      type: "student",
      title: `New student record: ${item.title}`,
      timestamp: item.timestamp.toISOString(),
    })),
  }));
});

router.get("/students", async (req, res): Promise<void> => {
  const parsed = GetStudentsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, status } = parsed.data;
  const filters = [];
  if (search) filters.push(ilike(studentsTable.fullName, `%${search}%`));
  if (status) filters.push(eq(studentsTable.status, status));
  const rows = await db.select().from(studentsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(studentsTable.createdAt));
  res.json(GetStudentsResponse.parse(rows));
});

router.post("/students", async (req, res): Promise<void> => {
  const parsed = CreateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [student] = await db.insert(studentsTable).values({
    ...parsed.data,
    enrollmentDate: parsed.data.enrollmentDate.toISOString().slice(0, 10),
  }).returning();
  res.status(201).json(CreateStudentResponse.parse(student));
});

router.patch("/students/:id", async (req, res): Promise<void> => {
  const params = UpdateStudentParams.safeParse(req.params);
  const parsed = UpdateStudentBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [student] = await db.update(studentsTable).set({
    ...parsed.data,
    enrollmentDate: parsed.data.enrollmentDate.toISOString().slice(0, 10),
  }).where(eq(studentsTable.id, params.data.id)).returning();
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  res.json(UpdateStudentResponse.parse(student));
});

router.delete("/students/:id", async (req, res): Promise<void> => {
  const params = DeleteStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [student] = await db.delete(studentsTable).where(eq(studentsTable.id, params.data.id)).returning();
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/teachers", async (req, res): Promise<void> => {
  const parsed = GetTeachersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, status } = parsed.data;
  const filters = [];
  if (search) filters.push(ilike(teachersTable.fullName, `%${search}%`));
  if (status) filters.push(eq(teachersTable.status, status));
  const rows = await db.select().from(teachersTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(teachersTable.fullName);
  res.json(GetTeachersResponse.parse(rows));
});

router.post("/teachers", async (req, res): Promise<void> => {
  const parsed = CreateTeacherBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { password, isEmployee, fullName, fullNameArabic, ...rest } = parsed.data;
  const [teacher] = await db.insert(teachersTable).values({
    ...rest,
    fullName: fullName || [rest.name, rest.surname].filter(Boolean).join(" "),
    fullNameArabic: fullNameArabic || [rest.name, rest.surname].filter(Boolean).join(" "),
    password: password ?? "",
    isEmployee: isEmployee ?? true,
    status: rest.status ?? "active",
  }).returning();
  const { password: _omit, ...safe } = teacher;
  void _omit;
  res.status(201).json(CreateTeacherResponse.parse(safe));
});

router.patch("/teachers/:id", async (req, res): Promise<void> => {
  const params = UpdateTeacherParams.safeParse(req.params);
  const parsed = UpdateTeacherBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { password, isEmployee, fullName, fullNameArabic, ...rest } = parsed.data;
  const [teacher] = await db.update(teachersTable).set({
    ...rest,
    ...(fullName || rest.name || rest.surname
      ? { fullName: fullName || [rest.name, rest.surname].filter(Boolean).join(" ") }
      : {}),
    ...(fullNameArabic ? { fullNameArabic } : {}),
    ...(password !== undefined ? { password } : {}),
    ...(isEmployee !== undefined ? { isEmployee } : {}),
    status: rest.status ?? "active",
  }).where(eq(teachersTable.id, params.data.id)).returning();
  if (!teacher) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }
  const { password: _omit, ...safe } = teacher;
  void _omit;
  res.json(UpdateTeacherResponse.parse(safe));
});

router.delete("/teachers/:id", async (req, res): Promise<void> => {
  const params = DeleteTeacherParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [teacher] = await db.delete(teachersTable).where(eq(teachersTable.id, params.data.id)).returning();
  if (!teacher) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/employees", async (req, res): Promise<void> => {
  const parsed = GetEmployeesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, status } = parsed.data;
  const filters = [];
  if (search) filters.push(or(ilike(employeesTable.fullName, `%${search}%`), ilike(employeesTable.jobTitle, `%${search}%`), ilike(employeesTable.employeeNumber, `%${search}%`)));
  if (status) filters.push(eq(employeesTable.status, status));
  const rows = await db.select().from(employeesTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(employeesTable.employeeNumber);
  res.json(GetEmployeesResponse.parse(rows));
});

router.post("/employees", async (req, res): Promise<void> => {
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [employee] = await db.insert(employeesTable).values({
    ...parsed.data,
    status: parsed.data.status ?? "active",
  }).returning();
  res.status(201).json(CreateEmployeeResponse.parse(employee));
});

router.patch("/employees/:id", async (req, res): Promise<void> => {
  const params = UpdateEmployeeParams.safeParse(req.params);
  const parsed = UpdateEmployeeBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [employee] = await db.update(employeesTable).set({
    ...parsed.data,
    status: parsed.data.status ?? "active",
  }).where(eq(employeesTable.id, params.data.id)).returning();
  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.json(UpdateEmployeeResponse.parse(employee));
});

router.delete("/employees/:id", async (req, res): Promise<void> => {
  const params = DeleteEmployeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [employee] = await db.delete(employeesTable).where(eq(employeesTable.id, params.data.id)).returning();
  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/library/books", async (req, res): Promise<void> => {
  const parsed = GetBooksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, category } = parsed.data;
  const filters = [];
  if (search) filters.push(or(ilike(booksTable.title, `%${search}%`), ilike(booksTable.author, `%${search}%`), ilike(booksTable.isbn, `%${search}%`)));
  if (category) filters.push(eq(booksTable.category, category));
  const rows = await db.select().from(booksTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(booksTable.title);
  res.json(GetBooksResponse.parse(rows));
});

router.post("/library/books", async (req, res): Promise<void> => {
  const parsed = CreateBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const copies = parsed.data.copies ?? 1;
  const [book] = await db.insert(booksTable).values({
    ...parsed.data,
    category: parsed.data.category ?? "",
    author: parsed.data.author ?? "",
    language: parsed.data.language ?? "Arabic",
    status: parsed.data.status ?? "available",
    dateAdded: parsed.data.dateAdded
      ? new Date(parsed.data.dateAdded).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    copies,
    availableCopies: copies,
  }).returning();
  res.status(201).json(CreateBookResponse.parse(book));
});

router.patch("/library/books/:id", async (req, res): Promise<void> => {
  const params = UpdateBookParams.safeParse(req.params);
  const parsed = UpdateBookBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [existing] = await db.select().from(booksTable).where(eq(booksTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Book not found" });
    return;
  }
  const borrowed = existing.copies - existing.availableCopies;
  const copies = parsed.data.copies ?? existing.copies;
  const availableCopies = Math.max(0, copies - borrowed);
  const { dateAdded: incomingDateAdded, ...bookRest } = parsed.data;
  const [book] = await db.update(booksTable).set({
    ...bookRest,
    ...(parsed.data.category !== undefined ? { category: parsed.data.category } : {}),
    ...(incomingDateAdded !== undefined
      ? { dateAdded: new Date(incomingDateAdded).toISOString().slice(0, 10) }
      : {}),
    copies,
    availableCopies,
  }).where(eq(booksTable.id, params.data.id)).returning();
  res.json(UpdateBookResponse.parse(book));
});

router.delete("/library/books/:id", async (req, res): Promise<void> => {
  const params = DeleteBookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [book] = await db.delete(booksTable).where(eq(booksTable.id, params.data.id)).returning();
  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/library/borrows", async (req, res): Promise<void> => {
  const parsed = GetBorrowsQueryParams.safeParse(req.query);
  const filters = [];
  if (parsed.success && parsed.data.active) filters.push(isNull(borrowsTable.returnedAt));
  const rows = await db.select({
    id: borrowsTable.id,
    bookId: borrowsTable.bookId,
    studentId: borrowsTable.studentId,
    borrowedAt: borrowsTable.borrowedAt,
    dueDate: borrowsTable.dueDate,
    returnedAt: borrowsTable.returnedAt,
    bookTitle: booksTable.title,
    bookBarcode: booksTable.isbn,
    studentName: studentsTable.fullName,
  }).from(borrowsTable)
    .innerJoin(booksTable, eq(borrowsTable.bookId, booksTable.id))
    .innerJoin(studentsTable, eq(borrowsTable.studentId, studentsTable.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(borrowsTable.borrowedAt));
  res.json(GetBorrowsResponse.parse(rows.map((row) => ({
    ...row,
    dueDate: row.dueDate ? new Date(row.dueDate) : null,
  }))));
});

router.post("/library/borrows", async (req, res): Promise<void> => {
  const parsed = CreateBorrowBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, parsed.data.bookId));
  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }
  if (book.availableCopies <= 0) {
    res.status(409).json({ error: "No copies of this book are currently available" });
    return;
  }
  const [borrow] = await db.insert(borrowsTable).values({
    bookId: parsed.data.bookId,
    studentId: parsed.data.studentId,
    dueDate: parsed.data.dueDate ? parsed.data.dueDate.toISOString().slice(0, 10) : null,
  }).returning();
  await db.update(booksTable).set({ availableCopies: book.availableCopies - 1 }).where(eq(booksTable.id, book.id));
  res.status(201).json(CreateBorrowResponse.parse(borrow));
});

router.patch("/library/borrows/:id/return", async (req, res): Promise<void> => {
  const params = ReturnBorrowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [existing] = await db.select().from(borrowsTable).where(eq(borrowsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Borrow not found" });
    return;
  }
  if (existing.returnedAt) {
    res.status(409).json({ error: "This borrow was already returned" });
    return;
  }
  const returnedAt = new Date();
  const [borrow] = await db.update(borrowsTable).set({ returnedAt }).where(eq(borrowsTable.id, params.data.id)).returning();
  await db.update(booksTable).set({
    availableCopies: sql`LEAST(${booksTable.copies}, ${booksTable.availableCopies} + 1)`,
  }).where(eq(booksTable.id, existing.bookId));
  res.json(ReturnBorrowResponse.parse(borrow));
});

const attendanceInput = z.object({
  studentId: z.coerce.number().int().positive(),
  academicYearId: z.coerce.number().int().positive(),
  attendanceDate: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),
  status: z.enum(["present", "absent", "late", "excused"]),
  note: z.string().trim().max(500).optional(),
});

router.get("/attendance", async (req, res): Promise<void> => {
  const query = z.object({
    academicYearId: z.coerce.number().int().positive(),
    studentId: z.coerce.number().int().positive().optional(),
    from: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/).optional(),
    to: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/).optional(),
  }).safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: "Invalid attendance filters" }); return; }
  const filters = [eq(attendanceTable.academicYearId, query.data.academicYearId)];
  if (query.data.studentId) filters.push(eq(attendanceTable.studentId, query.data.studentId));
  if (query.data.from) filters.push(gte(attendanceTable.attendanceDate, query.data.from));
  if (query.data.to) filters.push(lte(attendanceTable.attendanceDate, query.data.to));
  res.json(await db.select().from(attendanceTable).where(and(...filters)).orderBy(desc(attendanceTable.attendanceDate)));
});

router.post("/attendance", async (req, res): Promise<void> => {
  const parsed = attendanceInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid attendance record" }); return; }
  const [student] = await db.select({ id: studentsTable.id }).from(studentsTable).where(eq(studentsTable.id, parsed.data.studentId));
  if (!student) { res.status(404).json({ error: "Student not found" }); return; }
  const [record] = await db.insert(attendanceTable).values(parsed.data).returning();
  res.status(201).json(record);
});

router.get("/academic-years", async (_req, res): Promise<void> => {
  const rows = await db.select().from(academicYearsTable).orderBy(desc(academicYearsTable.startDate));
  res.json(GetAcademicYearsResponse.parse(rows.map((row) => ({
    ...row,
    isCurrent: row.isCurrent === "true",
  }))));
});

export default router;
