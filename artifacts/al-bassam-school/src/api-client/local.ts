/**
 * localStorage-backed API client for the standalone web version.
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

// ── localStorage helpers ──────────────────────────────────────────────

export type SchoolSystem = 'boys' | 'girls';

const SYSTEM_KEY = 'al-bassam-active-system';
const STORAGE_VERSION = 2;
const LS = {
  students: 'students',
  teachers: 'teachers',
  books: 'books',
  employees: 'employees',
  borrows: 'borrows',
  years: 'academic-years',
  activity: 'activity',
} as const;

function getSystem(): SchoolSystem {
  if (typeof window === 'undefined') return 'boys';
  return localStorage.getItem(SYSTEM_KEY) === 'girls' ? 'girls' : 'boys';
}

export function setActiveSchoolSystem(system: SchoolSystem) {
  localStorage.setItem(SYSTEM_KEY, system);
  window.dispatchEvent(new StorageEvent('storage', { key: SYSTEM_KEY, newValue: system }));
}

export function getActiveSchoolSystem(): SchoolSystem {
  return getSystem();
}

function storageKey(key: string) {
  return `al-bassam:v${STORAGE_VERSION}:${getSystem()}:${key}`;
}

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(storageKey(key));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(data));
    window.dispatchEvent(new StorageEvent('storage', { key: storageKey(key), newValue: JSON.stringify(data) }));
  } catch {
    // Storage can be unavailable or full; keep the in-memory mutation usable.
  }
}

function nextId(key: string): number {
  const counterKey = storageKey(`${key}-next-id`);
  const current = Math.max(1, Number(localStorage.getItem(counterKey) || '1'));
  localStorage.setItem(counterKey, String(current + 1));
  return current;
}

// ── Seed data (runs once) ─────────────────────────────────────────────

const SEED_KEY = 'seeded-v3-gender-scoped';

function seedIfEmpty() {
  if (localStorage.getItem(storageKey(SEED_KEY))) return;

  const years: AcademicYear[] = [
    { id: 1, label: '2024 / 2025', startDate: '2024-09-01', endDate: '2025-06-30', isCurrent: false },
    { id: 2, label: '2025 / 2026', startDate: '2025-09-01', endDate: '2026-06-30', isCurrent: true },
  ];
  write(LS.years, years);
  localStorage.setItem(storageKey(`${LS.years}-next-id`), '3');

  const teachers: Teacher[] = [
    {
      id: 1, fullName: 'Adel Khamis', fullNameArabic: 'عادل خميس', name: 'Adel', surname: 'Khamis',
      username: 'adel.khamis', englishName: 'Adel Khamis', employeeCode: 'TCH-001',
      nationalId: '1012345678', nationality: 'Saudi', gender: 'male', maritalStatus: 'married',
      religion: 'Islam', phone: '+966501234567', email: 'adel@school.com', address: 'Riyadh',
      area: 'Al Olaya', country: 'Saudi Arabia', height: 175, weight: 78, branch: 'Main',
      academicLevel: 'Secondary', subject: 'Mathematics', weeklyClasses: 18, isEmployee: false,
      status: 'active',
    },
    {
      id: 2, fullName: 'Nora Al-Harbi', fullNameArabic: 'نورة الحربي', name: 'Nora', surname: 'Al-Harbi',
      username: 'nora.harbi', englishName: 'Nora Al-Harbi', employeeCode: 'TCH-002',
      nationalId: '1098765432', nationality: 'Saudi', gender: 'female', maritalStatus: 'single',
      religion: 'Islam', phone: '+966551234567', email: 'nora@school.com', address: 'Jeddah',
      area: 'Al Andalus', country: 'Saudi Arabia', height: 162, weight: 55, branch: 'Main',
      academicLevel: 'Intermediate', subject: 'English', weeklyClasses: 20, isEmployee: false,
      status: 'active',
    },
  ];
  const scopedTeachers = teachers.filter((teacher) =>
    getSystem() === 'boys' ? teacher.gender === 'male' : teacher.gender === 'female',
  );
  write(LS.teachers, scopedTeachers);
  localStorage.setItem(storageKey(`${LS.teachers}-next-id`), String(scopedTeachers.length + 1));

  const students: Student[] = [
    { id: 1, fullName: 'Sara Al-Harbi', fullNameArabic: 'سارة الحربي', gender: 'female', studentNumber: 'AB-2024-014', nationalId: '1023456789', grade: 'Grade 8', className: '8A', guardianName: 'Khalid Al-Harbi', guardianPhone: '+966501112233', status: 'active', enrollmentDate: '2024-09-01' },
    { id: 2, fullName: 'Omar Al-Qahtani', fullNameArabic: 'عمر القحطاني', gender: 'male', studentNumber: 'AB-2024-015', nationalId: '1023456790', grade: 'Grade 7', className: '7B', guardianName: 'Noura Al-Qahtani', guardianPhone: '+966502223344', status: 'active', enrollmentDate: '2024-09-01' },
    { id: 3, fullName: 'Lina Saeed', fullNameArabic: 'لينا سعيد', gender: 'female', studentNumber: 'AB-2025-003', nationalId: '1055566677', grade: 'Grade 9', className: '9A', guardianName: 'Ahmed Saeed', guardianPhone: '+966503334455', status: 'active', enrollmentDate: '2023-09-01' },
  ];
  const scopedStudents = students.filter((student) =>
    getSystem() === 'boys' ? student.gender === 'male' : student.gender === 'female',
  );
  write(LS.students, scopedStudents);
  localStorage.setItem(storageKey(`${LS.students}-next-id`), String(scopedStudents.length + 1));

  const books: Book[] = [
    { id: 1, title: 'Complete ICT IGCSE', author: 'Paul Culling', isbn: '9780981775470', category: 'Technology', language: 'English', volume: '1', copies: 8, availableCopies: 5, lostCopies: 0, damagedCopies: 0, dateAdded: '2024-09-15', depositNumber: 'DEP-001', status: 'available', publicationPlace: 'London', publicationDate: '2020', generalNumber: 'GN-001', specialNumber: '', description: '', coverImage: '', shelf: 'B-04' },
    { id: 2, title: 'Our Planet', author: 'David Attenborough', isbn: '9780521536608', category: 'Science', language: 'English', volume: '', copies: 5, availableCopies: 3, lostCopies: 1, damagedCopies: 1, dateAdded: '2024-10-01', depositNumber: 'DEP-002', status: 'available', publicationPlace: 'Cambridge', publicationDate: '2021', generalNumber: 'GN-002', specialNumber: '', description: '', coverImage: '', shelf: 'A-12' },
    { id: 3, title: 'The University Murderers', author: 'Richard MacAndrew', isbn: '9780521184954', category: 'Literature', language: 'English', volume: '', copies: 3, availableCopies: 2, lostCopies: 0, damagedCopies: 0, dateAdded: '2024-10-10', depositNumber: 'DEP-003', status: 'available', publicationPlace: 'Cambridge', publicationDate: '2019', generalNumber: 'GN-003', specialNumber: '', description: '', coverImage: '', shelf: 'C-07' },
  ];
  write(LS.books, books);
  localStorage.setItem(storageKey(`${LS.books}-next-id`), '4');

  const employees: Employee[] = [
    { id: 1, fullName: 'Khalid Al-Otaibi', fullNameArabic: 'خالد العتيبي', employeeNumber: 'EMP-001', nationalId: '1065432109', jobTitle: 'Administrator', phone: '+966561234567', status: 'active' },
    { id: 2, fullName: 'Fatimah Al-Zahrani', fullNameArabic: 'فاطمة الزهراني', employeeNumber: 'EMP-002', nationalId: '1054321098', jobTitle: 'Librarian', phone: '+966571234567', status: 'active' },
    { id: 3, fullName: 'Nasser Al-Dosari', fullNameArabic: 'ناصر الدوسري', employeeNumber: 'EMP-003', nationalId: '1043210987', jobTitle: 'Accountant', phone: '+966581234567', status: 'active' },
  ];
  write(LS.employees, employees);
  localStorage.setItem(storageKey(`${LS.employees}-next-id`), '4');

  write(LS.activity, [
    { id: 1, type: 'student', title: 'New student enrolled', timestamp: new Date().toISOString() },
    { id: 2, type: 'library', title: 'Book "Our Planet" added', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, type: 'teacher', title: 'Teacher profile updated', timestamp: new Date(Date.now() - 7200000).toISOString() },
  ] as DashboardSummary['recentActivity']);

  localStorage.setItem(storageKey(SEED_KEY), '1');
}

// Run seed immediately on module load
seedIfEmpty();

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
