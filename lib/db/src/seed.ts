import { db, academicYearsTable, booksTable, employeesTable, studentsTable, teachersTable } from "./index";

export async function seedDatabase() {
  const [yearCount] = await db.select({ id: academicYearsTable.id }).from(academicYearsTable).limit(1);
  if (yearCount) return false;

  await db.insert(academicYearsTable).values([
    { label: "2024-2025", startDate: "2024-09-01", endDate: "2025-06-30", isCurrent: "false" },
    { label: "2025-2026", startDate: "2025-09-01", endDate: "2026-06-30", isCurrent: "true" },
  ]);

  await db.insert(employeesTable).values([
    {
      fullName: "Khalid Al-Otaibi",
      fullNameArabic: "خالد العتيبي",
      employeeNumber: "EMP-001",
      nationalId: "1067890123456",
      jobTitle: "School Principal",
      phone: "+966 50 111 2233",
      status: "active",
    },
    {
      fullName: "Fatimah Al-Zahrani",
      fullNameArabic: "فاطمة الزهراني",
      employeeNumber: "EMP-002",
      nationalId: "1078901234567",
      jobTitle: "Registrar",
      phone: "+966 55 222 3344",
      status: "active",
    },
    {
      fullName: "Nasser Al-Dosari",
      fullNameArabic: "ناصر الدوسري",
      employeeNumber: "EMP-003",
      nationalId: "1089012345678",
      jobTitle: "Accountant",
      phone: "+966 54 333 4455",
      status: "active",
    },
  ]);

  await db.insert(teachersTable).values([
    {
      fullName: "Adel Khamis",
      fullNameArabic: "عادل خميس",
      employeeNumber: "TCH-001",
      nationalId: "1023456789012",
      subject: "Arabic Language",
      phone: "+966 50 123 4567",
      status: "active",
    },
    {
      fullName: "Ahmad Al Hares",
      fullNameArabic: "أحمد الحارث",
      employeeNumber: "TCH-002",
      nationalId: "1034567890123",
      subject: "English Language",
      phone: "+966 55 234 5678",
      status: "active",
    },
    {
      fullName: "Ahmed Sami",
      fullNameArabic: "أحمد سامي",
      employeeNumber: "TCH-003",
      nationalId: "1045678901234",
      subject: "Mathematics",
      phone: "+966 54 345 6789",
      status: "active",
    },
    {
      fullName: "Sara Al-Mutairi",
      fullNameArabic: "سارة المطيري",
      employeeNumber: "TCH-004",
      nationalId: "1056789012345",
      subject: "Science",
      phone: "+966 56 456 7890",
      status: "active",
    },
  ]);

  await db.insert(studentsTable).values([
    {
      fullName: "Abdulaziz Saud Saeed Alqahtani",
      fullNameArabic: "عبدالعزيز سعود سعيد القحطاني",
      studentNumber: "AB-2025-001",
      nationalId: "1123456789",
      grade: "Grade 7",
      className: "7A",
      guardianName: "Saeed Alqahtani",
      guardianPhone: "+966 50 111 2222",
      status: "active",
      enrollmentDate: "2025-09-01",
    },
    {
      fullName: "Sara Al-Harbi",
      fullNameArabic: "سارة الحربي",
      studentNumber: "AB-2025-014",
      nationalId: "1234567890",
      grade: "Grade 8",
      className: "8A",
      guardianName: "Noura Al-Harbi",
      guardianPhone: "+966 55 333 4444",
      status: "active",
      enrollmentDate: "2025-09-01",
    },
    {
      fullName: "Omar Al-Faisal",
      fullNameArabic: "عمر الفيصل",
      studentNumber: "AB-2025-022",
      nationalId: "1345678901",
      grade: "Grade 9",
      className: "9B",
      guardianName: "Khalid Al-Faisal",
      guardianPhone: "+966 54 555 6666",
      status: "active",
      enrollmentDate: "2025-09-01",
    },
  ]);

  await db.insert(booksTable).values([
    {
      title: "Our Planet",
      author: "David Attenborough",
      isbn: "9780521536608",
      category: "Science",
      copies: 5,
      availableCopies: 4,
      language: "English",
      shelf: "A-12",
    },
    {
      title: "Complete ICT IGCSE",
      author: "Paul Culling",
      isbn: "9780981775470",
      category: "Technology",
      copies: 8,
      availableCopies: 6,
      language: "English",
      shelf: "B-04",
    },
    {
      title: "The University Murderers",
      author: "Richard MacAndrew",
      isbn: "9780521184954",
      category: "Literature",
      copies: 3,
      availableCopies: 2,
      language: "English",
      shelf: "C-07",
    },
    {
      title: "الرياضيات للمرحلة المتوسطة",
      author: "وزارة التعليم",
      isbn: "9789953456789",
      category: "Mathematics",
      copies: 12,
      availableCopies: 10,
      language: "Arabic",
      shelf: "D-01",
    },
  ]);

  return true;
}
