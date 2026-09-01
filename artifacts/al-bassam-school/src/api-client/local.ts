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
  items.push(student);
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
      items.push(teacher);
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
      items.push(employee);
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
      items.push(book);
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
      items.push(borrow);
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
