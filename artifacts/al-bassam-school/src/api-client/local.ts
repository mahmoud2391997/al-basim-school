/**
 * In-memory API client for the standalone web version.
 * Exports the exact same interface as the generated api.ts so App.tsx
 * can import from '@workspace/api-client-react' unchanged.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  MutationFunction,
  QueryFunction,
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';

import { recordActionNotification } from "../utils/action-notifications";
import type {
  AcademicYear,
  Book,
  BookInput,
  Borrow,
  BorrowInput,
  DashboardSummary,
  Employee,
  EmployeeInput,
  GetBooksParams,
  GetBorrowsParams,
  GetEmployeesParams,
  GetStudentsParams,
  GetTeachersParams,
  Student,
  StudentInput,
  Teacher,
  TeacherInput,
} from './generated/api.schemas';

// ── Web client backed by localStorage ──────────────────────────────────
// The web app keeps its data in localStorage so it survives refreshes and
// is isolated per school system (boys/girls). The desktop app owns durable
// storage through its native API (SQLite) instead of this module.

export type SchoolSystem = 'boys' | 'girls';

const LS = {
  students: 'students', teachers: 'teachers', books: 'books', employees: 'employees',
  borrows: 'borrows', years: 'academic-years', activity: 'activity', classes: 'classes',
} as const;

export function getSavedClassNames(): string[] {
  return read<string>(LS.classes).filter(Boolean).sort((a, b) => a.localeCompare(b));
}

export function saveClassName(name: string): string[] {
  const normalized = name.trim();
  if (!normalized) return getSavedClassNames();
  const classes = Array.from(new Set([...getSavedClassNames(), normalized]));
  write(LS.classes, classes);
  return classes.sort((a, b) => a.localeCompare(b));
}
const STORE_PREFIX = 'al-bassam:web:';
let activeSystem: SchoolSystem = 'boys';

function getSystem(): SchoolSystem { return activeSystem; }
export function setActiveSchoolSystem(system: SchoolSystem) {
  activeSystem = system;
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('school-system-change'));
}
export function getActiveSchoolSystem(): SchoolSystem { return getSystem(); }
function storageKey(key: string) { return `${STORE_PREFIX}${getSystem()}:${key}`; }
function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(key));
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}
function write<T>(key: string, data: T[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey(key), JSON.stringify(data));
  window.dispatchEvent(new Event('school-data-change'));
  const labels: Record<string, [string, string]> = {
    students: ["Student data updated", "تم تحديث بيانات الطلاب"], teachers: ["Teacher data updated", "تم تحديث بيانات المعلمين"], employees: ["Employee data updated", "تم تحديث بيانات الموظفين"], books: ["Book data updated", "تم تحديث بيانات الكتب"], borrows: ["Borrowing data updated", "تم تحديث بيانات الإعارات"],
  };
  if (labels[key]) recordActionNotification(labels[key][0], labels[key][1], key === LS.books || key === LS.borrows ? "/library" : `/${key}`);
}
function nextId(key: string): number {
  const existing = read<{ id: number }>(key);
  const max = existing.reduce((highest, item) => Math.max(highest, Number(item.id) || 0), 0);
  return max + 1;
}
/** Write raw records into a collection for the given school system, preserving any existing data. */
function seedCollection<T>(system: SchoolSystem, key: keyof typeof LS, records: T[]) {
  const storageKey = `${STORE_PREFIX}${system}:${LS[key]}`;
  const existing = (() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  })();
  if (existing.length) return;
  window.localStorage.setItem(storageKey, JSON.stringify(records));
}

/**
 * Remove all web demo data for every school system and clear the "seeded"
 * flag so the demo data is re-persisted on the next login. User-created data
 * in the web store is also cleared, since it lives in the same collections.
 */
export function resetDemoData(): void {
  const collections = Object.values(LS);
  (["boys", "girls"] as SchoolSystem[]).forEach((system) => {
    collections.forEach((collection) => {
      window.localStorage.removeItem(`${STORE_PREFIX}${system}:${collection}`);
    });
  });
  window.localStorage.removeItem("al-bassam:web-seeded");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("school-data-change"));
  }
}

/**
 * Seed the web (localStorage) store with demo data the first time it is
 * used, so a freshly-installed release has content to show. Runs on login.
 * Existing collections are never overwritten (seedCollection preserves
 * whatever the user has already created), and the "seeded" flag makes the
 * whole pass a no-op on subsequent launches. Call resetDemoData() to wipe
 * everything and re-seed on the next login.
 */
export function seedDemoData(): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem("al-bassam:web-seeded") === "1") return;
  window.localStorage.setItem("al-bassam:web-seeded", "1");

  const isoFromNow = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

  const classes = ["5A", "5B", "6A", "6B", "7A", "7B", "8A", "8B"];

  const students: Student[] = [
    { id: 1, fullName: "Ahmed Khaled Alshammari", fullNameArabic: "أحمد خالد الشمري", studentNumber: "S1001", nationalId: "2981101234567", grade: "5", className: "5A", guardianName: "خالد الشمري", guardianPhone: "0501112233", status: "active", enrollmentDate: "2024-09-01" },
    { id: 2, fullName: "Sara Mohammed Alotaibi", fullNameArabic: "سارة محمد العتيبي", studentNumber: "S1002", nationalId: "2981107654321", grade: "5", className: "5A", guardianName: "محمد العتيبي", guardianPhone: "0553334444", status: "active", enrollmentDate: "2024-09-01" },
    { id: 3, fullName: "Yousef Abdullah Alqahtani", fullNameArabic: "يوسف عبدالله القحطاني", studentNumber: "S1003", nationalId: "2981202345678", grade: "5", className: "5B", guardianName: "عبدالله القحطاني", guardianPhone: "0566667777", status: "active", enrollmentDate: "2024-09-01" },
    { id: 4, fullName: "Layan Fahad Aldosari", fullNameArabic: "ليان فهد الدوسري", studentNumber: "S1004", nationalId: "2981208765432", grade: "5", className: "5B", guardianName: "فهد الدوسري", guardianPhone: "0509990000", status: "active", enrollmentDate: "2024-09-01" },
    { id: 5, fullName: "Abdulrahman Saud Alharbi", fullNameArabic: "عبدالرحمن سعود الحربي", studentNumber: "S2001", nationalId: "2991301234567", grade: "6", className: "6A", guardianName: "سعود الحربي", guardianPhone: "0533334444", status: "active", enrollmentDate: "2023-09-01" },
    { id: 6, fullName: "Nour Ali Alghamdi", fullNameArabic: "نور علي الغامدي", studentNumber: "S2002", nationalId: "2991307654321", grade: "6", className: "6A", guardianName: "علي الغامدي", guardianPhone: "0522221111", status: "active", enrollmentDate: "2023-09-01" },
    { id: 7, fullName: "Khalid Nasser Alzahrani", fullNameArabic: "خالد ناصر الزهراني", studentNumber: "S2003", nationalId: "2991402345678", grade: "6", className: "6B", guardianName: "ناصر الزهراني", guardianPhone: "0555556666", status: "active", enrollmentDate: "2023-09-01" },
    { id: 8, fullName: "Fatima Hassan Almaliki", fullNameArabic: "فاطمة حسن المالكي", studentNumber: "S2004", nationalId: "2991409876543", grade: "6", className: "6B", guardianName: "حسن المالكي", guardianPhone: "0567778888", status: "active", enrollmentDate: "2023-09-01" },
    { id: 9, fullName: "Mohammed Ibrahim Alanazi", fullNameArabic: "محمد إبراهيم العنزي", studentNumber: "S3001", nationalId: "3001501234567", grade: "7", className: "7A", guardianName: "إبراهيم العنزي", guardianPhone: "0501234567", status: "active", enrollmentDate: "2023-09-01" },
    { id: 10, fullName: "Reem Saad Alshehri", fullNameArabic: "ريم سعد الشهري", studentNumber: "S3002", nationalId: "3001507654321", grade: "7", className: "7A", guardianName: "سعد الشهري", guardianPhone: "0559876543", status: "active", enrollmentDate: "2023-09-01" },
    { id: 11, fullName: "Abdullah Majed Alsubaie", fullNameArabic: "عبدالله ماجد السبيعي", studentNumber: "S3003", nationalId: "3001602345678", grade: "7", className: "7B", guardianName: "ماجد السبيعي", guardianPhone: "0563216547", status: "active", enrollmentDate: "2022-09-01" },
    { id: 12, fullName: "Jamila Sultan Almutairi", fullNameArabic: "جميلة سلطان المطيري", studentNumber: "S3004", nationalId: "3001609876543", grade: "7", className: "7B", guardianName: "سلطان المطيري", guardianPhone: "0506543210", status: "active", enrollmentDate: "2022-09-01" },
    { id: 13, fullName: "Omar Khaled Alobaidi", fullNameArabic: "عمر خالد العبيد", studentNumber: "S4001", nationalId: "3011701234567", grade: "8", className: "8A", guardianName: "خالد العبيد", guardianPhone: "0552223333", status: "active", enrollmentDate: "2022-09-01" },
    { id: 14, fullName: "Amal Yasser Almubarak", fullNameArabic: "أمل ياسر المبارك", studentNumber: "S4002", nationalId: "3011707654321", grade: "8", className: "8A", guardianName: "ياسر المبارك", guardianPhone: "0564445555", status: "active", enrollmentDate: "2022-09-01" },
    { id: 15, fullName: "Ziad Bandar Alajmi", fullNameArabic: "زياد بندر العجمي", studentNumber: "S4003", nationalId: "3011802345678", grade: "8", className: "8B", guardianName: "بندر العجمي", guardianPhone: "0501119999", status: "active", enrollmentDate: "2022-09-01" },
    { id: 16, fullName: "Noura Adel Altwaijri", fullNameArabic: "نورة عادل الطويل", studentNumber: "S4004", nationalId: "3011809876543", grade: "8", className: "8B", guardianName: "عادل الطويل", guardianPhone: "0558887777", status: "active", enrollmentDate: "2022-09-01" },
  ];

  const teachers: Teacher[] = [
    {
      id: 1, fullName: "Khalid Mohammed Aldosari", fullNameArabic: "خالد محمد الدوسري", name: "خالد", surname: "الدوسري", username: "khalid.aldosari", englishName: "Khalid Aldosari", employeeCode: "T1001", nationalId: "2800101234567", nationality: "سعودي", gender: "male", maritalStatus: "married", religion: "مسلم", phone: "0501234567", email: "khalid.aldosari@albassam.edu.sa", address: "حي النرجس، الرياض", area: "الرياض", country: "السعودية", height: 178, weight: 82, branch: "main", academicLevel: "بكالوريوس", subject: "رياضيات", weeklyClasses: 18, isEmployee: false, status: "active" },
    {
      id: 2, fullName: "Hind Saad Alqahtani", fullNameArabic: "هند سعد القحطاني", name: "هند", surname: "القحطاني", username: "hind.alqahtani", englishName: "Hind Alqahtani", employeeCode: "T1002", nationalId: "2870202345678", nationality: "سعودية", gender: "female", maritalStatus: "single", religion: "مسلمة", phone: "0555556666", email: "hind.alqahtani@albassam.edu.sa", address: "حي الروضة، الرياض", area: "الرياض", country: "السعودية", height: 162, weight: 58, branch: "main", academicLevel: "ماجستير", subject: "لغة إنجليزية", weeklyClasses: 16, isEmployee: false, status: "active" },
    {
      id: 3, fullName: "Fahad Abdullah Alanazi", fullNameArabic: "فهد عبدالله العنزي", name: "فهد", surname: "العنزي", username: "fahad.alanazi", englishName: "Fahad Alanazi", employeeCode: "T1003", nationalId: "2850303456789", nationality: "سعودي", gender: "male", maritalStatus: "married", religion: "مسلم", phone: "0566667777", email: "fahad.alanazi@albassam.edu.sa", address: "حي العليا، الرياض", area: "الرياض", country: "السعودية", height: 181, weight: 88, branch: "main", academicLevel: "بكالوريوس", subject: "علوم", weeklyClasses: 16, isEmployee: false, status: "active" },
    {
      id: 4, fullName: "Noura Ibrahim Alzahrani", fullNameArabic: "نورة إبراهيم الزهراني", name: "نورة", surname: "الزهراني", username: "noura.alzahrani", englishName: "Noura Alzahrani", employeeCode: "T1004", nationalId: "2840404567890", nationality: "سعودية", gender: "female", maritalStatus: "married", religion: "مسلمة", phone: "0507778888", email: "noura.alzahrani@albassam.edu.sa", address: "حي الياسمين، الرياض", area: "الرياض", country: "السعودية", height: 160, weight: 55, branch: "main", academicLevel: "دكتوراه", subject: "لغة عربية", weeklyClasses: 18, isEmployee: false, status: "active" },
  ];

  const employees: Employee[] = [
    { id: 1, fullName: "Saleh Nasser Almutairi", fullNameArabic: "صالح ناصر المطيري", employeeNumber: "E1001", nationalId: "2850505678901", jobTitle: "مدير شؤون الطلاب", phone: "0501112223", status: "active" },
    { id: 2, fullName: "Maha Abdullah Alsubaihi", fullNameArabic: "مها عبدالله السبيعي", employeeNumber: "E1002", nationalId: "2870606789012", jobTitle: "أمين المصادر التعليمية", phone: "0552223334", status: "active" },
    { id: 3, fullName: "Nasser Hamad Alharbi", fullNameArabic: "ناصر حمد الحربي", employeeNumber: "E1003", nationalId: "2830707890123", jobTitle: "محاسب", phone: "0563334445", status: "active" },
  ];

  const books: Book[] = [
    { id: 1, title: "رحلة إلى القمر", author: "جول فيرن", isbn: "9786030000001", category: "أدب وقصص", language: "Arabic", volume: "1", copies: 4, availableCopies: 3, dateAdded: "2024-08-20", depositNumber: "B1001", status: "available", publicationPlace: "القاهرة", publicationDate: "2019", generalNumber: "G1001", specialNumber: "S1001", description: "رواية مغامرات شهيرة ترافق القراء في رحلة خيالية إلى القمر.", coverImage: "", shelf: "A1" },
    { id: 2, title: "قصة الحضارة", author: "ويل ديورانت", isbn: "9786030000002", category: "تاريخ", language: "Arabic", volume: "1", copies: 3, availableCopies: 2, dateAdded: "2024-08-20", depositNumber: "B1002", status: "available", publicationPlace: "بيروت", publicationDate: "2015", generalNumber: "G1002", specialNumber: "S1002", description: "سلسلة تاريخية موسوعية تستعرض حضارات العالم عبر العصور.", coverImage: "", shelf: "B2" },
    { id: 3, title: "موسوعة العلوم للشباب", author: "مجموعة مؤلفين", isbn: "9786030000003", category: "علوم", language: "Arabic", volume: "2", copies: 5, availableCopies: 4, dateAdded: "2024-08-25", depositNumber: "B1003", status: "available", publicationPlace: "الرياض", publicationDate: "2018", generalNumber: "G1003", specialNumber: "S1003", description: "موسوعة مبسطة تغطي الفضاء والأرض والفيزياء والكيمياء.", coverImage: "", shelf: "C3" },
    { id: 4, title: "لغز الأهرامات", author: "أحمد عبدالله", isbn: "9786030000004", category: "أدب وقصص", language: "Arabic", volume: "1", copies: 3, availableCopies: 2, dateAdded: "2024-09-01", depositNumber: "B1004", status: "available", publicationPlace: "الرياض", publicationDate: "2020", generalNumber: "G1004", specialNumber: "S1004", description: "قصة تحري يكتشف خلالها طلاب قصصًا عن الحضارة المصرية القديمة.", coverImage: "", shelf: "A2" },
    { id: 5, title: "الخوارزمي وعلم الجبر", author: "جمال الدين", isbn: "9786030000005", category: "علوم", language: "Arabic", volume: "1", copies: 4, availableCopies: 3, dateAdded: "2024-09-05", depositNumber: "B1005", status: "available", publicationPlace: "الكويت", publicationDate: "2017", generalNumber: "G1005", specialNumber: "S1005", description: "سيرة محمد بن موسى الخوارزمي ومساهماته في تأسيس علم الجبر.", coverImage: "", shelf: "C1" },
    { id: 6, title: "حكايات من التراث", author: "محمد الأنصاري", isbn: "9786030000006", category: "أدب وقصص", language: "Arabic", volume: "1", copies: 3, availableCopies: 2, dateAdded: "2024-09-10", depositNumber: "B1006", status: "available", publicationPlace: "جدة", publicationDate: "2019", generalNumber: "G1006", specialNumber: "S1006", description: "مجموعة قصصية من الموروث الشعبي العربي بأسلوب عصري جذاب.", coverImage: "", shelf: "A3" },
    { id: 7, title: "الأندلس تاريخ وحضارة", author: "سعد العجمي", isbn: "9786030000007", category: "تاريخ", language: "Arabic", volume: "1", copies: 4, availableCopies: 3, dateAdded: "2024-09-15", depositNumber: "B1007", status: "available", publicationPlace: "الرياض", publicationDate: "2016", generalNumber: "G1007", specialNumber: "S1007", description: "لمحة تاريخية عن الحضارة الأندلسية وإسهاماتها العلمية والثقافية.", coverImage: "", shelf: "B1" },
    { id: 8, title: "معجم الأخطاء الشائعة", author: "عبدالعزيز الحربي", isbn: "9786030000008", category: "لغة عربية", language: "Arabic", volume: "1", copies: 3, availableCopies: 2, dateAdded: "2024-09-20", depositNumber: "B1008", status: "available", publicationPlace: "جدة", publicationDate: "2018", generalNumber: "G1008", specialNumber: "S1008", description: "دليل عملي لتصحيح الأخطاء الشائعة في التحدث والكتابة بالعربية.", coverImage: "", shelf: "D4" },
    { id: 9, title: "دليل النجاح الدراسي", author: "هدى الناصر", isbn: "9786030000009", category: "تنمية ذاتية", language: "Arabic", volume: "1", copies: 2, availableCopies: 1, dateAdded: "2024-10-01", depositNumber: "B1009", status: "available", publicationPlace: "الرياض", publicationDate: "2021", generalNumber: "G1009", specialNumber: "S1009", description: "خطوات عملية لتنظيم الوقت ورفع التحصيل الدراسي للطلاب.", coverImage: "", shelf: "E2" },
    { id: 10, title: "مغامرة الكتاب المفقود", author: "منى السالم", isbn: "9786030000010", category: "أدب وقصص", language: "Arabic", volume: "1", copies: 3, availableCopies: 3, dateAdded: "2024-10-05", depositNumber: "B1010", status: "available", publicationPlace: "الدمام", publicationDate: "2022", generalNumber: "G1010", specialNumber: "S1010", description: "قصة تتبع مجموعة طلاب أثر كتاب قديم نادر داخل مكتبة المدرسة.", coverImage: "", shelf: "A4" },
  ];

  const borrows: Borrow[] = [
    { id: 1, bookId: 1, studentId: 1, borrowerType: "student", borrowerId: 1, borrowedAt: isoFromNow(-2), dueDate: isoFromNow(12), bookTitle: "رحلة إلى القمر", bookBarcode: "B1001", borrowerName: "أحمد خالد الشمري" },
    { id: 2, bookId: 2, studentId: 2, borrowerType: "student", borrowerId: 2, borrowedAt: isoFromNow(-3), dueDate: isoFromNow(11), bookTitle: "قصة الحضارة", bookBarcode: "B1002", borrowerName: "سارة محمد العتيبي" },
    { id: 3, bookId: 3, studentId: 3, borrowerType: "student", borrowerId: 3, borrowedAt: isoFromNow(-4), dueDate: isoFromNow(10), bookTitle: "موسوعة العلوم للشباب", bookBarcode: "B1003", borrowerName: "يوسف عبدالله القحطاني" },
    { id: 4, bookId: 4, studentId: 4, borrowerType: "student", borrowerId: 4, borrowedAt: isoFromNow(-5), dueDate: isoFromNow(9), bookTitle: "لغز الأهرامات", bookBarcode: "B1004", borrowerName: "ليان فهد الدوسري" },
    { id: 5, bookId: 5, studentId: 5, borrowerType: "student", borrowerId: 5, borrowedAt: isoFromNow(-6), dueDate: isoFromNow(8), bookTitle: "الخوارزمي وعلم الجبر", bookBarcode: "B1005", borrowerName: "عبدالرحمن سعود الحربي" },
    { id: 6, bookId: 6, studentId: 6, borrowerType: "student", borrowerId: 6, borrowedAt: isoFromNow(-7), dueDate: isoFromNow(7), bookTitle: "حكايات من التراث", bookBarcode: "B1006", borrowerName: "نور علي الغامدي" },
    { id: 7, bookId: 7, studentId: 7, borrowerType: "student", borrowerId: 7, borrowedAt: isoFromNow(-8), dueDate: isoFromNow(6), bookTitle: "الأندلس تاريخ وحضارة", bookBarcode: "B1007", borrowerName: "خالد ناصر الزهراني" },
    { id: 8, bookId: 8, studentId: 8, borrowerType: "student", borrowerId: 8, borrowedAt: isoFromNow(-9), dueDate: isoFromNow(5), bookTitle: "معجم الأخطاء الشائعة", bookBarcode: "B1008", borrowerName: "فاطمة حسن المالكي" },
    { id: 9, bookId: 9, studentId: 9, borrowerType: "student", borrowerId: 9, borrowedAt: isoFromNow(-24), dueDate: isoFromNow(-4), bookTitle: "دليل النجاح الدراسي", bookBarcode: "B1009", borrowerName: "محمد إبراهيم العنزي" },
    { id: 10, bookId: 3, studentId: 10, borrowerType: "student", borrowerId: 10, borrowedAt: isoFromNow(-20), dueDate: isoFromNow(-6), returnedAt: isoFromNow(-7), condition: "good", bookTitle: "موسوعة العلوم للشباب", bookBarcode: "B1003", borrowerName: "ريم سعد الشهري" },
    { id: 11, bookId: 5, studentId: 11, borrowerType: "student", borrowerId: 11, borrowedAt: isoFromNow(-16), dueDate: isoFromNow(-2), returnedAt: isoFromNow(-4), condition: "good", bookTitle: "الخوارزمي وعلم الجبر", bookBarcode: "B1005", borrowerName: "عبدالله ماجد السبيعي" },
    { id: 12, bookId: 7, studentId: 12, borrowerType: "student", borrowerId: 12, borrowedAt: isoFromNow(-12), dueDate: isoFromNow(2), returnedAt: isoFromNow(-6), condition: "good", bookTitle: "الأندلس تاريخ وحضارة", bookBarcode: "B1007", borrowerName: "جميلة سلطان المطيري" },
    { id: 13, bookId: 10, studentId: 13, borrowerType: "student", borrowerId: 13, borrowedAt: isoFromNow(-10), dueDate: isoFromNow(4), returnedAt: isoFromNow(-3), condition: "good", bookTitle: "مغامرة الكتاب المفقود", bookBarcode: "B1010", borrowerName: "عمر خالد العبيد" },
    { id: 14, bookId: 1, studentId: 14, borrowerType: "student", borrowerId: 14, borrowedAt: isoFromNow(-8), dueDate: isoFromNow(6), returnedAt: isoFromNow(-1), condition: "good", bookTitle: "رحلة إلى القمر", bookBarcode: "B1001", borrowerName: "أمل ياسر المبارك" },
  ];

  const academicYears: AcademicYear[] = [
    { id: 1, label: "2026 / 2027", startDate: "2026-09-01", endDate: "2027-06-30", isCurrent: true },
  ];

  (["boys", "girls"] as SchoolSystem[]).forEach((system) => {
    seedCollection(system, "students", students);
    seedCollection(system, "teachers", teachers);
    seedCollection(system, "employees", employees);
    seedCollection(system, "books", books);
    seedCollection(system, "borrows", borrows);
    seedCollection(system, "years", academicYears);
    seedCollection(system, "classes", classes);
  });

  window.dispatchEvent(new Event("school-data-change"));
}

// ── withQueryKey helper (matches generated api.ts) ────────────────────

const withQueryKey = <T extends object, K>(query: T, queryKey: K): T & { queryKey: K } => {
  const result = { queryKey } as T & { queryKey: K };
  for (const key of Object.keys(query)) {
    if (key === 'queryKey') continue;
    Object.defineProperty(result, key, {
      enumerable: true,
      configurable: true,
      get: () => (query as Record<string, unknown>)[key],
    });
  }
  return result;
};

// ── Query key functions ───────────────────────────────────────────────

export const getGetAcademicYearsQueryKey = () => ['/api/academic-years', getSystem()] as const;
export const getGetDashboardSummaryQueryKey = () => ['/api/dashboard/summary', getSystem()] as const;
export const getGetStudentsQueryKey = (params?: GetStudentsParams) =>
  ['/api/students', getSystem(), ...(params ? [params] : [])] as const;
export const getGetTeachersQueryKey = (params?: GetTeachersParams) =>
  ['/api/teachers', getSystem(), ...(params ? [params] : [])] as const;
export const getGetBooksQueryKey = (params?: GetBooksParams) =>
  ['/api/library/books', getSystem(), ...(params ? [params] : [])] as const;
export const getGetEmployeesQueryKey = (params?: GetEmployeesParams) =>
  ['/api/employees', getSystem(), ...(params ? [params] : [])] as const;
export const getGetBorrowsQueryKey = (params?: GetBorrowsParams) =>
  ['/api/library/borrows', getSystem(), ...(params ? [params] : [])] as const;

// ── Query hooks ───────────────────────────────────────────────────────

export function useGetAcademicYears<TData = AcademicYear[], TError = Error>(
  options?: { query?: UseQueryOptions<AcademicYear[], TError, TData> },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = {
    queryKey: getGetAcademicYearsQueryKey(),
    queryFn: () => read<AcademicYear>(LS.years),
    ...options?.query,
  };
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return withQueryKey(query, queryOptions.queryKey);
}

export function useGetDashboardSummary<TData = DashboardSummary, TError = Error>(
  options?: { query?: UseQueryOptions<DashboardSummary, TError, TData> },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = {
    queryKey: getGetDashboardSummaryQueryKey(),
    queryFn: (): DashboardSummary => {
      const students = read<Student>(LS.students);
      const teachers = read<Teacher>(LS.teachers);
      const books = read<Book>(LS.books);
      const activity = read<DashboardSummary['recentActivity'][0]>(LS.activity);
      return {
        students: students.filter((s) => s.status === 'active').length,
        teachers: teachers.filter((t) => t.status === 'active').length,
        books: books.reduce((sum, b) => sum + (b.copies || 0), 0),
        availableBooks: books.reduce((sum, b) => sum + (b.availableCopies ?? b.copies ?? 0), 0),
        borrowedBooks: books.reduce((sum, b) => sum + ((b.copies || 0) - (b.availableCopies ?? b.copies ?? 0)), 0),
        employees: read<Employee>(LS.employees).filter((e) => e.status === 'active').length,
        attendanceRate: 0,
        recentActivity: activity.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 10),
      };
    },
    ...options?.query,
  };
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return withQueryKey(query, queryOptions.queryKey);
}

export function useGetStudents<TData = Student[], TError = Error>(
  params?: GetStudentsParams,
  options?: { query?: UseQueryOptions<Student[], TError, TData> },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = {
    queryKey: getGetStudentsQueryKey(params),
    queryFn: (): Student[] => {
      let items = read<Student>(LS.students);
      if (params?.status) items = items.filter((s) => s.status === params.status);
      if (params?.search) {
        const q = params.search.toLowerCase();
        items = items.filter(
          (s) =>
            s.fullName.toLowerCase().includes(q) ||
            s.fullNameArabic.includes(params.search!) ||
            s.studentNumber.toLowerCase().includes(q),
        );
      }
      return items;
    },
    ...options?.query,
  };
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return withQueryKey(query, queryOptions.queryKey);
}

export function useGetTeachers<TData = Teacher[], TError = Error>(
  params?: GetTeachersParams,
  options?: { query?: UseQueryOptions<Teacher[], TError, TData> },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = {
    queryKey: getGetTeachersQueryKey(params),
    queryFn: (): Teacher[] => {
      let items = read<Teacher>(LS.teachers);
      if (params?.status) items = items.filter((t) => t.status === params.status);
      if (params?.search) {
        const q = params.search.toLowerCase();
        items = items.filter(
          (t) =>
            t.fullName.toLowerCase().includes(q) ||
            t.fullNameArabic.includes(params.search!) ||
            t.username.toLowerCase().includes(q),
        );
      }
      return items;
    },
    ...options?.query,
  };
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return withQueryKey(query, queryOptions.queryKey);
}

export function useGetBooks<TData = Book[], TError = Error>(
  params?: GetBooksParams,
  options?: { query?: UseQueryOptions<Book[], TError, TData> },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = {
    queryKey: getGetBooksQueryKey(params),
    queryFn: (): Book[] => {
      let items = read<Book>(LS.books);
      if (params?.category) items = items.filter((b) => b.category === params.category);
      if (params?.search) {
        const q = params.search.toLowerCase();
        items = items.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            b.category.toLowerCase().includes(q) ||
            b.description.toLowerCase().includes(q) ||
            b.isbn.toLowerCase().includes(q),
        );
      }
      return items;
    },
    ...options?.query,
  };
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return withQueryKey(query, queryOptions.queryKey);
}

export function useGetEmployees<TData = Employee[], TError = Error>(
  params?: GetEmployeesParams,
  options?: { query?: UseQueryOptions<Employee[], TError, TData> },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = {
    queryKey: getGetEmployeesQueryKey(params),
    queryFn: (): Employee[] => {
      let items = read<Employee>(LS.employees);
      if (params?.status) items = items.filter((e) => e.status === params.status);
      return items;
    },
    ...options?.query,
  };
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return withQueryKey(query, queryOptions.queryKey);
}

export function useGetBorrows<TData = Borrow[], TError = Error>(
  params?: GetBorrowsParams,
  options?: { query?: UseQueryOptions<Borrow[], TError, TData> },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = {
    queryKey: getGetBorrowsQueryKey(params),
    queryFn: (): Borrow[] => {
      let items = read<Borrow>(LS.borrows);
      if (params?.active !== undefined) {
        items = params.active ? items.filter((b) => !b.returnedAt) : items.filter((b) => !!b.returnedAt);
      }
      return items;
    },
    ...options?.query,
  };
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return withQueryKey(query, queryOptions.queryKey);
}

// ── Plain data functions (mirror the generated api exports) ───────────

export async function getStudents(
  params?: GetStudentsParams,
  _options?: unknown,
): Promise<Student[]> {
  let items = read<Student>(LS.students);
  if (params?.status) items = items.filter((s) => s.status === params.status);
  if (params?.search) {
    const q = params.search.toLowerCase();
    items = items.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.fullNameArabic.includes(params.search!) ||
        s.studentNumber.toLowerCase().includes(q),
    );
  }
  return items;
}

export async function getTeachers(
  params?: GetTeachersParams,
  _options?: unknown,
): Promise<Teacher[]> {
  let items = read<Teacher>(LS.teachers);
  if (params?.status) items = items.filter((t) => t.status === params.status);
  if (params?.search) {
    const q = params.search.toLowerCase();
    items = items.filter(
      (t) =>
        t.fullName.toLowerCase().includes(q) ||
        t.fullNameArabic.includes(params.search!) ||
        t.username.toLowerCase().includes(q),
    );
  }
  return items;
}

export async function getEmployees(
  params?: GetEmployeesParams,
  _options?: unknown,
): Promise<Employee[]> {
  let items = read<Employee>(LS.employees);
  if (params?.status) items = items.filter((e) => e.status === params.status);
  return items;
}

export async function getBooks(
  params?: GetBooksParams,
  _options?: unknown,
): Promise<Book[]> {
  let items = read<Book>(LS.books);
  if (params?.category) items = items.filter((b) => b.category === params.category);
  if (params?.search) {
    const q = params.search.toLowerCase();
    items = items.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q),
    );
  }
  return items;
}

export async function getBorrows(
  params?: GetBorrowsParams,
  _options?: unknown,
): Promise<Borrow[]> {
  let items = read<Borrow>(LS.borrows);
  if (params?.active !== undefined) {
    items = params.active ? items.filter((b) => !b.returnedAt) : items.filter((b) => !!b.returnedAt);
  }
  return items;
}

export async function getAcademicYears(
  _options?: unknown,
): Promise<AcademicYear[]> {
  return read<AcademicYear>(LS.years);
}

// ── Mutation hooks ────────────────────────────────────────────────────

function makeMutation<TInput, TResult>(
  mutationKey: string,
  fn: (input: TInput) => TResult,
): { useMutate: (opts?: any) => UseMutationResult<TResult, Error, TInput, unknown>; fn: typeof fn } {
  const useMutate = (options?: { mutation?: UseMutationOptions<TResult, Error, TInput, unknown> }) =>
    useMutation<TResult, Error, TInput, unknown>({
      mutationKey: [mutationKey],
      mutationFn: async (input) => fn(input),
      ...options?.mutation,
    });
  return { useMutate, fn };
}

const studentMutations = makeMutation<{ data: StudentInput }, Student>('createStudent', ({ data }) => {
  const items = read<Student>(LS.students);
  const id = nextId(LS.students);
  const student: Student = {
    ...data,
    id,
    status: 'active',
    fullName: data.fullName,
    fullNameArabic: data.fullNameArabic,
  };
  items.unshift(student);
  write(LS.students, items);
  return student;
});

export const useCreateStudent = studentMutations.useMutate;

const updateStudentFn = (_opts?: any) =>
  useMutation<Student, Error, { id: number; data: StudentInput }, unknown>({
    mutationKey: ['updateStudent'],
    mutationFn: async ({ id, data }) => {
      const items = read<Student>(LS.students);
      const idx = items.findIndex((s) => s.id === id);
      if (idx === -1) throw new Error('Student not found');
      items[idx] = { ...items[idx], ...data };
      write(LS.students, items);
      return items[idx];
    },
  });

export const useUpdateStudent = updateStudentFn;

const deleteStudentFn = (_opts?: any) =>
  useMutation<void, Error, { id: number }, unknown>({
    mutationKey: ['deleteStudent'],
    mutationFn: async ({ id }) => {
      const items = read<Student>(LS.students);
      write(LS.students, items.filter((s) => s.id !== id));
    },
  });

export const useDeleteStudent = deleteStudentFn;

// Teacher mutations
const createTeacherFn = (_opts?: any) =>
  useMutation<Teacher, Error, { data: TeacherInput }, unknown>({
    mutationKey: ['createTeacher'],
    mutationFn: async ({ data }) => {
      const items = read<Teacher>(LS.teachers);
      const id = nextId(LS.teachers);
      const fullName = [data.name, data.surname].filter(Boolean).join(' ') || data.employeeCode || '';
      const teacher: Teacher = {
        id,
        name: data.name ?? '',
        surname: data.surname ?? '',
        username: data.username ?? '',
        englishName: data.englishName ?? '',
        employeeCode: data.employeeCode ?? '',
        nationalId: data.nationalId ?? '',
        nationality: data.nationality ?? '',
        gender: data.gender ?? '',
        maritalStatus: data.maritalStatus ?? '',
        religion: data.religion ?? '',
        phone: data.phone ?? '',
        email: data.email ?? '',
        address: data.address ?? '',
        area: data.area ?? '',
        country: data.country ?? '',
        height: data.height ?? 0,
        weight: data.weight ?? 0,
        branch: data.branch ?? '',
        academicLevel: data.academicLevel ?? '',
        subject: data.subject ?? '',
        weeklyClasses: data.weeklyClasses ?? 0,
        isEmployee: data.isEmployee ?? false,
        fullName,
        fullNameArabic: data.fullNameArabic ?? fullName,
        status: 'active',
      };
      items.unshift(teacher);
      write(LS.teachers, items);
      return teacher;
    },
  });

export const useCreateTeacher = createTeacherFn;

const updateTeacherFn = (_opts?: any) =>
  useMutation<Teacher, Error, { id: number; data: TeacherInput }, unknown>({
    mutationKey: ['updateTeacher'],
    mutationFn: async ({ id, data }) => {
      const items = read<Teacher>(LS.teachers);
      const idx = items.findIndex((t) => t.id === id);
      if (idx === -1) throw new Error('Teacher not found');
      const merged = { ...items[idx], ...data };
      merged.fullName = [merged.name, merged.surname].filter(Boolean).join(' ') || merged.employeeCode;
      items[idx] = merged;
      write(LS.teachers, items);
      return items[idx];
    },
  });

export const useUpdateTeacher = updateTeacherFn;

const deleteTeacherFn = (_opts?: any) =>
  useMutation<void, Error, { id: number }, unknown>({
    mutationKey: ['deleteTeacher'],
    mutationFn: async ({ id }) => {
      const items = read<Teacher>(LS.teachers);
      write(LS.teachers, items.filter((t) => t.id !== id));
    },
  });

export const useDeleteTeacher = deleteTeacherFn;

// Employee mutations
const createEmployeeFn = (_opts?: any) =>
  useMutation<Employee, Error, { data: EmployeeInput }, unknown>({
    mutationKey: ['createEmployee'],
    mutationFn: async ({ data }) => {
      const items = read<Employee>(LS.employees);
      const id = nextId(LS.employees);
      const employee: Employee = { ...data, id, status: data.status ?? 'active' };
      items.unshift(employee);
      write(LS.employees, items);
      return employee;
    },
  });

export const useCreateEmployee = createEmployeeFn;

const updateEmployeeFn = (_opts?: any) =>
  useMutation<Employee, Error, { id: number; data: EmployeeInput }, unknown>({
    mutationKey: ['updateEmployee'],
    mutationFn: async ({ id, data }) => {
      const items = read<Employee>(LS.employees);
      const idx = items.findIndex((e) => e.id === id);
      if (idx === -1) throw new Error('Employee not found');
      items[idx] = { ...items[idx], ...data };
      write(LS.employees, items);
      return items[idx];
    },
  });

export const useUpdateEmployee = updateEmployeeFn;

const deleteEmployeeFn = (_opts?: any) =>
  useMutation<void, Error, { id: number }, unknown>({
    mutationKey: ['deleteEmployee'],
    mutationFn: async ({ id }) => {
      const items = read<Employee>(LS.employees);
      write(LS.employees, items.filter((e) => e.id !== id));
    },
  });

export const useDeleteEmployee = deleteEmployeeFn;

// Book mutations
const createBookFn = (_opts?: any) =>
  useMutation<Book, Error, { data: BookInput }, unknown>({
    mutationKey: ['createBook'],
    mutationFn: async ({ data }) => {
      const items = read<Book>(LS.books);
      const id = nextId(LS.books);
      const book: Book = {
        id,
        title: data.title,
        author: data.author ?? '',
        isbn: data.isbn ?? '',
        category: data.category ?? '',
        language: (data.language as Book['language']) ?? 'Arabic',
        volume: data.volume ?? '',
        copies: data.copies ?? 1,
        availableCopies: data.copies ?? 1,
        dateAdded: data.dateAdded ?? new Date().toISOString().slice(0, 10),
        depositNumber: data.depositNumber ?? '',
        status: (data.status as Book['status']) ?? 'available',
        publicationPlace: data.publicationPlace ?? '',
        publicationDate: data.publicationDate ?? '',
        generalNumber: data.generalNumber ?? '',
        specialNumber: data.specialNumber ?? '',
        description: data.description ?? '',
        coverImage: data.coverImage ?? '',
        shelf: data.shelf ?? '',
      };
      items.unshift(book);
      write(LS.books, items);
      return book;
    },
  });

export const useCreateBook = createBookFn;

const updateBookFn = (_opts?: any) =>
  useMutation<Book, Error, { id: number; data: BookInput }, unknown>({
    mutationKey: ['updateBook'],
    mutationFn: async ({ id, data }) => {
      const items = read<Book>(LS.books);
      const idx = items.findIndex((b) => b.id === id);
      if (idx === -1) throw new Error('Book not found');
      const current = items[idx];
      const activeBorrowedCopies = read<Borrow>(LS.borrows).filter(
        (borrow) => borrow.bookId === id && !borrow.returnedAt,
      ).length;
      const nextCopies = data.copies === undefined ? current.copies : Number(data.copies);
      if (!Number.isInteger(nextCopies) || nextCopies < 1) {
        throw new Error('Total copies must be a positive whole number');
      }
      if (nextCopies < activeBorrowedCopies) {
        throw new Error('Total copies cannot be less than active borrowed copies');
      }
      items[idx] = {
        ...current,
        ...data,
        copies: nextCopies,
        availableCopies: nextCopies - activeBorrowedCopies - (current.lostCopies ?? 0) - (current.damagedCopies ?? 0),
      } as Book;
      if (items[idx].availableCopies < 0) throw new Error('Total copies cannot be less than unavailable copies');
      write(LS.books, items);
      return items[idx];
    },
  });

export const useUpdateBook = updateBookFn;

const deleteBookFn = (_opts?: any) =>
  useMutation<void, Error, { id: number }, unknown>({
    mutationKey: ['deleteBook'],
    mutationFn: async ({ id }) => {
      const items = read<Book>(LS.books);
      write(LS.books, items.filter((b) => b.id !== id));
    },
  });

export const useDeleteBook = deleteBookFn;

// Borrow mutations
const createBorrowFn = (_opts?: any) =>
  useMutation<Borrow, Error, { data: BorrowInput }, unknown>({
    mutationKey: ['createBorrow'],
    mutationFn: async ({ data }) => {
      const items = read<Borrow>(LS.borrows);
      const id = nextId(LS.borrows);
      const books = read<Book>(LS.books);
      const book = books.find((b) => b.id === data.bookId);
      if (!book) throw new Error('Book not found');
      const availableCopies = book.availableCopies ?? book.copies;
      if (availableCopies < 1) throw new Error('No copies are available for borrowing');
      let borrowerName = '';
      if (data.borrowerType === 'student') {
        const students = read<Student>(LS.students);
        const student = students.find((s) => s.id === data.borrowerId);
        borrowerName = student?.fullName ?? '';
      } else if (data.borrowerType === 'teacher') {
        const teachers = read<Teacher>(LS.teachers);
        const teacher = teachers.find((t) => t.id === data.borrowerId);
        borrowerName = teacher?.fullName ?? '';
      } else if (data.borrowerType === 'employee') {
        const employees = read<Employee>(LS.employees);
        const employee = employees.find((e) => e.id === data.borrowerId);
        borrowerName = employee?.fullName ?? '';
      }
      const borrow: Borrow = {
        id,
        bookId: data.bookId,
        borrowerType: data.borrowerType,
        borrowerId: data.borrowerId,
        studentId: data.borrowerType === "student" ? data.borrowerId : null,
        borrowerName,
        bookTitle: book?.title ?? '',
        bookBarcode: book?.isbn ?? '',
        borrowedAt: new Date().toISOString(),
        dueDate: data.dueDate,
        returnedAt: undefined,
      };
      items.unshift(borrow);
      book.availableCopies = Math.max(0, availableCopies - 1);
      book.status = 'available';
      write(LS.books, books);
      write(LS.borrows, items);
      return borrow;
    },
  });

export const useCreateBorrow = createBorrowFn;

const returnBorrowFn = (_opts?: any) =>
  useMutation<Borrow, Error, { id: number; data?: { condition?: string | null } }, unknown>({
    mutationKey: ['returnBorrow'],
    mutationFn: async ({ id, data }) => {
      const items = read<Borrow>(LS.borrows);
      const idx = items.findIndex((b) => b.id === id);
      if (idx === -1) throw new Error('Borrow not found');
      const books = read<Book>(LS.books);
      const book = books.find((b) => b.id === items[idx].bookId);
      const condition = data?.condition === 'damaged' || data?.condition === 'lost' ? data.condition : 'good';
      items[idx].returnedAt = new Date().toISOString();
      items[idx].condition = condition as any;
      if (book) {
        if (condition === 'good') book.availableCopies = Math.min(book.copies, (book.availableCopies ?? 0) + 1);
        else if (condition === 'damaged') book.damagedCopies = (book.damagedCopies ?? 0) + 1;
        else book.lostCopies = (book.lostCopies ?? 0) + 1;
        write(LS.books, books);
      }
      write(LS.borrows, items);
      return items[idx];
    },
  });

export const useReturnBorrow = returnBorrowFn;

const markBookConditionFn = (_opts?: any) =>
  useMutation<Book, Error, { id: number; data: { action: 'lost' | 'damaged' | 'fixed' | 'found' } }, unknown>({
    mutationKey: ['markBookCondition'],
    mutationFn: async ({ id, data }) => {
      const items = read<Book>(LS.books);
      const idx = items.findIndex((b) => b.id === id);
      if (idx === -1) throw new Error('Book not found');
      const book = items[idx];
      const avail = book.availableCopies ?? 0;
      const lost = book.lostCopies ?? 0;
      const damaged = book.damagedCopies ?? 0;
      if (data.action === 'lost') {
        if (avail < 1) throw new Error('No copy is on the shelf to mark as lost');
        book.availableCopies = avail - 1; book.lostCopies = lost + 1;
      } else if (data.action === 'damaged') {
        if (avail < 1) throw new Error('No copy is on the shelf to mark as damaged');
        book.availableCopies = avail - 1; book.damagedCopies = damaged + 1;
      } else if (data.action === 'found') {
        if (lost < 1) throw new Error('There are no lost copies to restore');
        book.availableCopies = avail + 1; book.lostCopies = lost - 1;
      } else if (data.action === 'fixed') {
        if (damaged < 1) throw new Error('There are no damaged copies to restore');
        book.availableCopies = avail + 1; book.damagedCopies = damaged - 1;
      } else {
        throw new Error('Invalid condition action');
      }
      write(LS.books, items);
      return book;
    },
  });

export const useMarkBookCondition = markBookConditionFn;

// Stubs for unused exports
export const getHealthCheckQueryKey = () => ['/api/healthz'] as const;
export const useHealthCheck = (opts?: any) =>
  useQuery({ queryKey: getHealthCheckQueryKey(), queryFn: () => ({ status: 'ok' }), ...opts?.query });

export const setBaseUrl = () => {};
export const setAuthTokenGetter = () => {};
