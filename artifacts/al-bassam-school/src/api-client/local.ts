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
  borrows: 'borrows', years: 'academic-years', activity: 'activity',
} as const;
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
        attendanceRate: 94,
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

// ── Demo data seeding ──────────────────────────────────────────────────

const demoYears: AcademicYear[] = [
  { id: 1, label: '2025-2026', startDate: '2025-08-25', endDate: '2026-06-20', isCurrent: true },
  { id: 2, label: '2024-2025', startDate: '2024-08-25', endDate: '2025-06-20', isCurrent: false },
];

const demoBooks: Book[] = [
  {
    id: 1, title: 'مختارات من القرآن الكريم', author: 'Anonymous', isbn: '978-603-123456-1', category: 'Religion', language: 'Arabic',
    volume: '1', copies: 5, availableCopies: 4, dateAdded: '2025-09-01', depositNumber: 'D-1001', status: 'available',
    publicationPlace: 'Riyadh', publicationDate: '2020', generalNumber: 'G-001', specialNumber: 'S-001',
    description: 'أشهر السور والأجزاء المقررة على الطلاب', coverImage: '', shelf: 'A1', lostCopies: 0, damagedCopies: 1,
  },
  {
    id: 2, title: 'The Prophet', author: 'Kahlil Gibran', isbn: '978-603-123456-2', category: 'Literature', language: 'English',
    volume: '1', copies: 3, availableCopies: 3, dateAdded: '2025-09-02', depositNumber: 'D-1002', status: 'available',
    publicationPlace: 'New York', publicationDate: '1923', generalNumber: 'G-002', specialNumber: 'S-002',
    description: 'مجموعة قصص شعرية فلسفية', coverImage: '', shelf: 'B2', lostCopies: 0, damagedCopies: 0,
  },
  {
    id: 3, title: 'رياض الأطفال', author: 'Muhammad Ali', isbn: '978-603-123456-3', category: 'Education', language: 'Arabic',
    volume: '1', copies: 8, availableCopies: 6, dateAdded: '2025-09-03', depositNumber: 'D-1003', status: 'available',
    publicationPlace: 'Cairo', publicationDate: '2019', generalNumber: 'G-003', specialNumber: 'S-003',
    description: 'دليل تعليمي لمناهج رياض الأطفال', coverImage: '', shelf: 'C3', lostCopies: 1, damagedCopies: 1,
  },
  {
    id: 4, title: 'Chemistry Fundamentals', author: 'Ahmad Hassan', isbn: '978-603-123456-4', category: 'Science', language: 'English',
    volume: '2', copies: 4, availableCopies: 4, dateAdded: '2025-09-04', depositNumber: 'D-1004', status: 'available',
    publicationPlace: 'London', publicationDate: '2021', generalNumber: 'G-004', specialNumber: 'S-004',
    description: 'أساسيات الكيمياء العامة', coverImage: '', shelf: 'D4', lostCopies: 0, damagedCopies: 0,
  },
  {
    id: 5, title: 'Math Made Easy', author: 'Sara Ali', isbn: '978-603-123456-5', category: 'Mathematics', language: 'English',
    volume: '3', copies: 6, availableCopies: 5, dateAdded: '2025-09-05', depositNumber: 'D-1005', status: 'available',
    publicationPlace: 'Dubai', publicationDate: '2022', generalNumber: 'G-005', specialNumber: 'S-005',
    description: 'الرياضيات المبسطة للمرحلة المتوسطة', coverImage: '', shelf: 'E5', lostCopies: 0, damagedCopies: 1,
  },
  {
    id: 6, title: 'المدخل إلى الفيزياء', author: 'خالد عبدالله', isbn: '978-603-123456-6', category: 'Science', language: 'Arabic',
    volume: '1', copies: 7, availableCopies: 7, dateAdded: '2025-09-06', depositNumber: 'D-1006', status: 'available',
    publicationPlace: 'Riyadh', publicationDate: '2023', generalNumber: 'G-006', specialNumber: 'S-006',
    description: 'مدخل مبسط إلى مبادئ الفيزياء', coverImage: '', shelf: 'D4', lostCopies: 0, damagedCopies: 0,
  },
  {
    id: 7, title: 'Oxford English Grammar', author: 'John Eastwood', isbn: '978-603-123456-7', category: 'Language', language: 'English',
    volume: '1', copies: 10, availableCopies: 9, dateAdded: '2025-09-07', depositNumber: 'D-1007', status: 'available',
    publicationPlace: 'Oxford', publicationDate: '2015', generalNumber: 'G-007', specialNumber: 'S-007',
    description: 'قواعد اللغة الإنجليزية الأساسية', coverImage: '', shelf: 'B2', lostCopies: 0, damagedCopies: 1,
  },
];

const demoStudentsBoys: Student[] = [
  { id: 1, fullName: 'Ahmed Mohammed Al-Sayed', fullNameArabic: 'أحمد محمد السيد', studentNumber: 'S-2025-001', nationalId: '1052047810', grade: 'Grade 6', className: '6A', guardianName: 'Mohammed Al-Sayed', guardianPhone: '0550000001', status: 'active', enrollmentDate: '2025-08-25' },
  { id: 2, fullName: 'Omar Khaled Ibrahim', fullNameArabic: 'عمر خالد إبراهيم', studentNumber: 'S-2025-002', nationalId: '1052047820', grade: 'Grade 6', className: '6B', guardianName: 'Khaled Ibrahim', guardianPhone: '0550000002', status: 'active', enrollmentDate: '2025-08-25' },
  { id: 3, fullName: 'Yousef Abdullah Nasser', fullNameArabic: 'يوسف عبدالله ناصر', studentNumber: 'S-2025-003', nationalId: '1052047830', grade: 'Grade 7', className: '7A', guardianName: 'Abdullah Nasser', guardianPhone: '0550000003', status: 'active', enrollmentDate: '2025-08-25' },
  { id: 4, fullName: 'Fahad Ali Hassan', fullNameArabic: 'فهد علي حسن', studentNumber: 'S-2025-004', nationalId: '1052047840', grade: 'Grade 7', className: '7B', guardianName: 'Ali Hassan', guardianPhone: '0550000004', status: 'active', enrollmentDate: '2025-08-26' },
  { id: 5, fullName: 'Abdulrahman Saleh Mahmoud', fullNameArabic: 'عبدالرحمن صالح محمود', studentNumber: 'S-2025-005', nationalId: '1052047850', grade: 'Grade 8', className: '8A', guardianName: 'Saleh Mahmoud', guardianPhone: '0550000005', status: 'active', enrollmentDate: '2025-08-26' },
  { id: 6, fullName: 'Naif Sultan Ali', fullNameArabic: 'نايف سلطان علي', studentNumber: 'S-2025-006', nationalId: '1052047860', grade: 'Grade 8', className: '8B', guardianName: 'Sultan Ali', guardianPhone: '0550000006', status: 'active', enrollmentDate: '2025-08-27' },
  { id: 7, fullName: 'Turki Abdullah Saleh', fullNameArabic: 'تركي عبدالله صالح', studentNumber: 'S-2025-007', nationalId: '1052047870', grade: 'Grade 5', className: '5A', guardianName: 'Abdullah Saleh', guardianPhone: '0550000007', status: 'active', enrollmentDate: '2025-08-27' },
  { id: 8, fullName: 'Saad Mohammed Fahad', fullNameArabic: 'سعد محمد فهد', studentNumber: 'S-2025-008', nationalId: '1052047880', grade: 'Grade 5', className: '5B', guardianName: 'Mohammed Fahad', guardianPhone: '0550000008', status: 'active', enrollmentDate: '2025-08-28' },
];

const demoStudentsGirls: Student[] = [
  { id: 1, fullName: 'Sara Ahmed Mansour', fullNameArabic: 'سارة أحمد منصور', studentNumber: 'G-2025-001', nationalId: '2105847810', grade: 'Grade 6', className: '6A', guardianName: 'Ahmed Mansour', guardianPhone: '0550000021', status: 'active', enrollmentDate: '2025-08-25' },
  { id: 2, fullName: 'Lina Khaled Omar', fullNameArabic: 'لينا خالد عمر', studentNumber: 'G-2025-002', nationalId: '2105847820', grade: 'Grade 7', className: '7A', guardianName: 'Khaled Omar', guardianPhone: '0550000022', status: 'active', enrollmentDate: '2025-08-25' },
  { id: 3, fullName: 'Noura Abdullah Ibrahim', fullNameArabic: 'نورة عبدالله إبراهيم', studentNumber: 'G-2025-003', nationalId: '2105847830', grade: 'Grade 8', className: '8A', guardianName: 'Abdullah Ibrahim', guardianPhone: '0550000023', status: 'active', enrollmentDate: '2025-08-26' },
];

const demoTeachers: Teacher[] = [
  {
    id: 1, fullName: 'Mohammed Abdullah Al-Harbi', fullNameArabic: 'محمد عبدالله الحربي', name: 'Mohammed', surname: 'Al-Harbi',
    username: 'm.harbi', englishName: 'Mohammed Alharbi', employeeCode: 'T-001', nationalId: '1034500011', nationality: 'Saudi',
    gender: 'male', maritalStatus: 'married', religion: 'Islam', phone: '0551112221', email: 'm.harbi@albassam.edu.sa',
    address: 'Riyadh - Olaya', area: 'االعليا', country: 'Saudi Arabia', height: 175, weight: 78, branch: 'Boys',
    academicLevel: 'Secondary', subject: 'Mathematics', weeklyClasses: 18, isEmployee: false, status: 'active',
  },
  {
    id: 2, fullName: 'Abdullah Saleh Al-Otaibi', fullNameArabic: 'عبدالله صالح العتيبي', name: 'Abdullah', surname: 'Al-Otaibi',
    username: 'a.otaibi', englishName: 'Abdullah Alotaibi', employeeCode: 'T-002', nationalId: '1034500012', nationality: 'Saudi',
    gender: 'male', maritalStatus: 'single', religion: 'Islam', phone: '0551112222', email: 'a.otaibi@albassam.edu.sa',
    address: 'Riyadh - King Fahd', area: 'شارع الملك فهد', country: 'Saudi Arabia', height: 180, weight: 82, branch: 'Boys',
    academicLevel: 'Primary', subject: 'Science', weeklyClasses: 20, isEmployee: false, status: 'active',
  },
  {
    id: 3, fullName: 'Fatima Ali Al-Zahrani', fullNameArabic: 'فاطمة علي الزهراني', name: 'Fatima', surname: 'Al-Zahrani',
    username: 'f.zahrani', englishName: 'Fatima Alzahrani', employeeCode: 'T-003', nationalId: '2104500013', nationality: 'Saudi',
    gender: 'female', maritalStatus: 'married', religion: 'Islam', phone: '0551112223', email: 'f.zahrani@albassam.edu.sa',
    address: 'Riyadh - Nuzha', area: 'النزهة', country: 'Saudi Arabia', height: 160, weight: 55, branch: 'Girls',
    academicLevel: 'Intermediate', subject: 'Arabic', weeklyClasses: 18, isEmployee: false, status: 'active',
  },
  {
    id: 4, fullName: 'Nasser Abdullah Al-Qahtani', fullNameArabic: 'ناصر عبدالله القحطاني', name: 'Nasser', surname: 'Al-Qahtani',
    username: 'n.qahtani', englishName: 'Nasser Alqahtani', employeeCode: 'T-004', nationalId: '1034500014', nationality: 'Saudi',
    gender: 'male', maritalStatus: 'married', religion: 'Islam', phone: '0551112224', email: 'n.qahtani@albassam.edu.sa',
    address: 'Riyadh - Malaz', area: 'الملز', country: 'Saudi Arabia', height: 172, weight: 74, branch: 'Boys',
    academicLevel: 'Secondary', subject: 'English', weeklyClasses: 18, isEmployee: false, status: 'active',
  },
];

const demoEmployees: Employee[] = [
  { id: 1, fullName: 'Khaled Saad Al-Dosari', fullNameArabic: 'خالد سعد الدوسري', employeeNumber: 'EMP-001', nationalId: '1042200111', jobTitle: 'School Secretary', phone: '0552223331', status: 'active' },
  { id: 2, fullName: 'Mansour Ibrahim Al-Shammari', fullNameArabic: 'منصور إبراهيم الشمري', employeeNumber: 'EMP-002', nationalId: '1042200112', jobTitle: 'Accountant', phone: '0552223332', status: 'active' },
  { id: 3, fullName: 'Hassan Mohammed Al-Ghamdi', fullNameArabic: 'حسن محمد الغامدي', employeeNumber: 'EMP-003', nationalId: '1042200113', jobTitle: 'Librarian', phone: '0552223333', status: 'active' },
];

const demoBorrows: Borrow[] = [
  { id: 1, bookId: 1, studentId: 1, borrowerType: 'student', borrowerId: 1, borrowedAt: '2026-08-20T08:30:00.000Z', dueDate: '2026-09-03', returnedAt: undefined, bookTitle: 'مختارات من القرآن الكريم', bookBarcode: '978-603-123456-1', borrowerName: 'Ahmed Mohammed Al-Sayed' },
  { id: 2, bookId: 3, studentId: 2, borrowerType: 'student', borrowerId: 2, borrowedAt: '2026-08-21T09:00:00.000Z', dueDate: '2026-09-04', returnedAt: undefined, bookTitle: 'رياض الأطفال', bookBarcode: '978-603-123456-3', borrowerName: 'Omar Khaled Ibrahim' },
  { id: 3, bookId: 5, studentId: 5, borrowerType: 'student', borrowerId: 5, borrowedAt: '2026-08-24T10:15:00.000Z', dueDate: '2026-09-07', returnedAt: undefined, bookTitle: 'Math Made Easy', bookBarcode: '978-603-123456-5', borrowerName: 'Abdulrahman Saleh Mahmoud' },
  { id: 4, bookId: 2, studentId: 2, borrowerType: 'student', borrowerId: 2, borrowedAt: '2026-08-10T08:00:00.000Z', dueDate: '2026-08-24', returnedAt: '2026-08-22T14:00:00.000Z', bookTitle: 'The Prophet', bookBarcode: '978-603-123456-2', borrowerName: 'Omar Khaled Ibrahim', condition: 'good' },
];

/**
 * Populate the web store with a realistic set of demo records for both
 * school systems. Only writes to collections that are still empty so it is
 * safe to call on every boot without overwriting user data.
 */
export function seedDemoData(): void {
  seedCollection('boys', 'years', demoYears);
  seedCollection('girls', 'years', demoYears);
  seedCollection('boys', 'books', demoBooks);
  seedCollection('girls', 'books', demoBooks);
  seedCollection('boys', 'students', demoStudentsBoys);
  seedCollection('girls', 'students', demoStudentsGirls);
  seedCollection('boys', 'teachers', demoTeachers);
  seedCollection('girls', 'teachers', demoTeachers);
  seedCollection('boys', 'employees', demoEmployees);
  seedCollection('girls', 'employees', demoEmployees);
  seedCollection('boys', 'borrows', demoBorrows);
  seedCollection('girls', 'borrows', demoBorrows);
}
