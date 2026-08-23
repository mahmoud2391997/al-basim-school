import { Router, type IRouter } from "express";
import { and, desc, eq, ilike } from "drizzle-orm";
import { db, academicYearsTable, booksTable, studentsTable, teachersTable } from "@workspace/db";
import {
  CreateBookBody,
  CreateBookResponse,
  CreateStudentBody,
  CreateStudentResponse,
  DeleteStudentParams,
  GetAcademicYearsResponse,
  GetBooksQueryParams,
  GetBooksResponse,
  GetDashboardSummaryResponse,
  GetStudentsQueryParams,
  GetStudentsResponse,
  GetTeachersResponse,
  UpdateStudentBody,
  UpdateStudentParams,
  UpdateStudentResponse,
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
  res.json(GetDashboardSummaryResponse.parse({
    students: students.length,
    teachers: teachers.length,
    books: books.length,
    attendanceRate: 94.2,
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

router.get("/teachers", async (_req, res): Promise<void> => {
  const rows = await db.select().from(teachersTable).orderBy(teachersTable.fullName);
  res.json(GetTeachersResponse.parse(rows));
});

router.get("/library/books", async (req, res): Promise<void> => {
  const parsed = GetBooksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, category } = parsed.data;
  const filters = [];
  if (search) filters.push(ilike(booksTable.title, `%${search}%`));
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
  const [book] = await db.insert(booksTable).values({
    ...parsed.data,
    availableCopies: parsed.data.copies,
  }).returning();
  res.status(201).json(CreateBookResponse.parse(book));
});

router.get("/academic-years", async (_req, res): Promise<void> => {
  const rows = await db.select().from(academicYearsTable).orderBy(desc(academicYearsTable.startDate));
  res.json(GetAcademicYearsResponse.parse(rows.map((row) => ({
    ...row,
    isCurrent: row.isCurrent === "true",
  }))));
});

export default router;