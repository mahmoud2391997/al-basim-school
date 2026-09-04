import { useState, useMemo, useEffect } from "react";
import {
  Search,
  BookOpen,
  GraduationCap,
  UsersRound,
  Briefcase,
  Clock3,
  LayoutDashboard,
  Library,
  Settings2,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  X,
} from "lucide-react";
import {
  useGetBooks,
  useGetStudents,
  useGetTeachers,
  useGetEmployees,
  useGetBorrows,
  getGetBooksQueryKey,
  getGetStudentsQueryKey,
  getGetTeachersQueryKey,
  getGetEmployeesQueryKey,
  getGetBorrowsQueryKey,
} from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: (en: string, ar: string) => string;
  language: "en" | "ar";
  onNavigate: (path: string) => void;
}

export function GlobalSearchDialog({
  open,
  onOpenChange,
  t,
  language,
  onNavigate,
}: GlobalSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "books" | "students" | "teachers" | "employees" | "borrows" | "pages"
  >("all");

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedCategory("all");
    }
  }, [open]);

  const booksQuery = useGetBooks(undefined, {
    query: { queryKey: getGetBooksQueryKey(undefined), enabled: open },
  });
  const studentsQuery = useGetStudents(undefined, {
    query: { queryKey: getGetStudentsQueryKey(undefined), enabled: open },
  });
  const teachersQuery = useGetTeachers(undefined, {
    query: { queryKey: getGetTeachersQueryKey(undefined), enabled: open },
  });
  const employeesQuery = useGetEmployees(undefined, {
    query: { queryKey: getGetEmployeesQueryKey(undefined), enabled: open },
  });
  const borrowsQuery = useGetBorrows(undefined, {
    query: { queryKey: getGetBorrowsQueryKey(undefined), enabled: open },
  });

  const books = Array.isArray(booksQuery.data) ? booksQuery.data : [];
  const students = Array.isArray(studentsQuery.data) ? studentsQuery.data : [];
  const teachers = Array.isArray(teachersQuery.data) ? teachersQuery.data : [];
  const employees = Array.isArray(employeesQuery.data) ? employeesQuery.data : [];
  const borrows = Array.isArray(borrowsQuery.data) ? borrowsQuery.data : [];

  const pages = useMemo(
    () => [
      {
        title: t("Overview", "نظرة عامة"),
        subtitle: t("Main system dashboard", "لوحة التحكم الرئيسية"),
        path: "/",
        icon: LayoutDashboard,
      },
      {
        title: t("Book Catalogue", "فهرس الكتب"),
        subtitle: t("Browse and manage books", "تصفح وإدارة كتب المكتبة"),
        path: "/library",
        icon: Library,
      },
      {
        title: t("Book Categories", "تصنيفات الكتب"),
        subtitle: t("View collections by shelf and category", "عرض المجموعات حسب الرف والتصنيف"),
        path: "/library/categories",
        icon: Layers,
      },
      {
        title: t("Active Borrows", "الإعارات النشطة"),
        subtitle: t("Manage active loans and issue returns", "إدارة الإعارات الحالية وعمليات الإرجاع"),
        path: "/library/borrows",
        icon: BookOpen,
      },
      {
        title: t("Borrow History", "سجل الإعارات"),
        subtitle: t("Historical records of all borrowings", "سجلات تاريخية لكافة عمليات الاستعارة"),
        path: "/library/history",
        icon: Clock3,
      },
      {
        title: t("Library Analytics & Reports", "تقارير وتحليلات المكتبة"),
        subtitle: t("Statistical charts and Excel exports", "الرسوم البيانية وتصدير التقارير إلى Excel"),
        path: "/library/analytics",
        icon: FileSpreadsheet,
      },
      {
        title: t("Student Directory", "دليل الطلاب"),
        subtitle: t("Enrolled students and grades", "سجلات الطلاب المقيدين والصفوف"),
        path: "/students",
        icon: GraduationCap,
      },
      {
        title: t("Teacher Directory", "دليل المعلمين"),
        subtitle: t("Faculty members and teaching subjects", "أعضاء هيئة التدريس والمواد الدراسية"),
        path: "/teachers",
        icon: UsersRound,
      },
      {
        title: t("Staff & Employees", "الهيئة الإدارية والموظفون"),
        subtitle: t("Administrative and operational staff", "الموظفون الإداريون والتشغيليون"),
        path: "/employees",
        icon: Briefcase,
      },
      {
        title: t("Settings", "الإعدادات"),
        subtitle: t("Academic years, backup and system options", "السنوات الدراسية والنسخ الاحتياطي وإعدادات النظام"),
        path: "/settings",
        icon: Settings2,
      },
    ],
    [t],
  );

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filteredPages = pages.filter(
      (p) =>
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q),
    );

    const filteredBooks = books.filter(
      (b) =>
        !q ||
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.isbn?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q) ||
        b.shelf?.toLowerCase().includes(q),
    );

    const filteredStudents = students.filter(
      (s) =>
        !q ||
        s.fullName?.toLowerCase().includes(q) ||
        s.fullNameArabic?.toLowerCase().includes(q) ||
        s.studentNumber?.toLowerCase().includes(q) ||
        s.nationalId?.toLowerCase().includes(q) ||
        s.grade?.toLowerCase().includes(q) ||
        s.className?.toLowerCase().includes(q),
    );

    const filteredTeachers = teachers.filter(
      (tc) =>
        !q ||
        tc.name?.toLowerCase().includes(q) ||
        tc.surname?.toLowerCase().includes(q) ||
        tc.fullName?.toLowerCase().includes(q) ||
        tc.fullNameArabic?.toLowerCase().includes(q) ||
        tc.employeeCode?.toLowerCase().includes(q) ||
        tc.subject?.toLowerCase().includes(q),
    );

    const filteredEmployees = employees.filter(
      (e) =>
        !q ||
        e.fullName?.toLowerCase().includes(q) ||
        e.fullNameArabic?.toLowerCase().includes(q) ||
        e.employeeNumber?.toLowerCase().includes(q) ||
        e.jobTitle?.toLowerCase().includes(q) ||
        e.nationalId?.toLowerCase().includes(q),
    );

    const filteredBorrows = borrows.filter(
      (br) =>
        !q ||
        br.borrowerName?.toLowerCase().includes(q) ||
        br.bookTitle?.toLowerCase().includes(q) ||
        br.bookBarcode?.toLowerCase().includes(q),
    );

    return {
      pages: filteredPages,
      books: filteredBooks,
      students: filteredStudents,
      teachers: filteredTeachers,
      employees: filteredEmployees,
      borrows: filteredBorrows,
      totalCount:
        filteredPages.length +
        filteredBooks.length +
        filteredStudents.length +
        filteredTeachers.length +
        filteredEmployees.length +
        filteredBorrows.length,
    };
  }, [query, pages, books, students, teachers, employees, borrows]);

  const handleSelect = (path: string) => {
    onOpenChange(false);
    onNavigate(path);
  };

  const handleRecordSelect = (path: string, recordId: number) => {
    handleSelect(`${path}?focus=${encodeURIComponent(recordId)}&at=${Date.now()}`);
  };

  const hasAnyResults = searchResults.totalCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl p-0 gap-0 overflow-y-auto overflow-x-hidden border-border bg-card shadow-2xl"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        <DialogTitle className="sr-only">{t("Search Workspace", "البحث في مساحة العمل")}</DialogTitle>

        {/* Top Search Bar */}
        <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-3.5">
          <Search size={18} className="shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              "Search books, students, teachers, employees, borrows, or pages...",
              "ابحث عن الكتب، الطلاب، المعلمين، الموظفين، الإعارات، أو الصفحات...",
            )}
            autoFocus
            className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/60"
            data-testid="input-global-search"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label={t("Clear search", "مسح البحث")}
            >
              <X size={16} />
            </button>
          )}
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/25 px-4 py-2 overflow-x-auto text-xs scrollbar-none">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              selectedCategory === "all"
                ? "bg-[#263064] text-[#FCFBF0]"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t("All Results", "كل النتائج")}
          </button>
          <button
            onClick={() => setSelectedCategory("books")}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              selectedCategory === "books"
                ? "bg-[#263064] text-[#FCFBF0]"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            📚 {t("Books", "الكتب")} ({searchResults.books.length})
          </button>
          <button
            onClick={() => setSelectedCategory("students")}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              selectedCategory === "students"
                ? "bg-[#263064] text-[#FCFBF0]"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            🎓 {t("Students", "الطلاب")} ({searchResults.students.length})
          </button>
          <button
            onClick={() => setSelectedCategory("teachers")}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              selectedCategory === "teachers"
                ? "bg-[#263064] text-[#FCFBF0]"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            👨‍🏫 {t("Teachers", "المعلمون")} ({searchResults.teachers.length})
          </button>
          <button
            onClick={() => setSelectedCategory("borrows")}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              selectedCategory === "borrows"
                ? "bg-[#263064] text-[#FCFBF0]"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            📖 {t("Borrows", "الإعارات")} ({searchResults.borrows.length})
          </button>
          <button
            onClick={() => setSelectedCategory("employees")}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              selectedCategory === "employees"
                ? "bg-[#263064] text-[#FCFBF0]"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            💼 {t("Employees", "الموظفون")} ({searchResults.employees.length})
          </button>
          <button
            onClick={() => setSelectedCategory("pages")}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              selectedCategory === "pages"
                ? "bg-[#263064] text-[#FCFBF0]"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            🧭 {t("Navigation", "الصفحات")} ({searchResults.pages.length})
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {!hasAnyResults ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Search size={36} className="mb-2 opacity-40" />
              <p className="text-sm font-semibold text-foreground">
                {t("No matches found", "لم يتم العثور على نتائج")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t(
                  "Try searching with a different term, title, barcode, or name.",
                  "يرجى تجربة كلمة بحث مختلفة أو باركود أو اسم آخر.",
                )}
              </p>
            </div>
          ) : (
            <>
              {/* Pages Section */}
              {(selectedCategory === "all" || selectedCategory === "pages") &&
                searchResults.pages.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      🧭 {t("Navigation & Modules", "التنقل والأقسام")}
                    </div>
                    <div className="mt-1 space-y-1">
                      {searchResults.pages.slice(0, 5).map((page) => {
                        const Icon = page.icon;
                        return (
                          <button
                            key={page.path}
                            onClick={() => handleSelect(page.path)}
                            className="flex w-full items-center justify-between rounded-lg p-2.5 text-start transition-colors hover:bg-muted/60"
                            data-testid={`search-item-page-${page.path.replaceAll("/", "-")}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#263064]/10 text-[#263064]">
                                <Icon size={16} />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-foreground">
                                  {page.title}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {page.subtitle}
                                </div>
                              </div>
                            </div>
                            <ArrowRight
                              size={14}
                              className={`text-muted-foreground ${language === "ar" ? "rotate-180" : ""}`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Books Section */}
              {(selectedCategory === "all" || selectedCategory === "books") &&
                searchResults.books.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      📚 {t("Books & Catalogue", "كتب المكتبة")} ({searchResults.books.length})
                    </div>
                    <div className="mt-1 space-y-1">
                      {searchResults.books.slice(0, 8).map((book) => {
                        const available = book.availableCopies ?? book.copies;
                        return (
                          <button
                            key={book.id}
                            onClick={() => handleRecordSelect("/library", book.id)}
                            className="flex w-full items-center justify-between rounded-lg p-2.5 text-start transition-colors hover:bg-muted/60"
                            data-testid={`search-item-book-${book.id}`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#DBB46C]/20 text-[#EC9F42]">
                                <BookOpen size={16} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-xs font-bold text-foreground">
                                  {book.title}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                  {book.author && <span>{book.author}</span>}
                                  {book.category && (
                                    <span className="rounded bg-muted px-1 py-0.2">
                                      {book.category}
                                    </span>
                                  )}
                                  {book.isbn && (
                                    <span className="font-mono" dir="ltr">
                                      {book.isbn}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  available > 0
                                    ? "bg-[#32B77E]/15 text-[#32B77E]"
                                    : "bg-[#B92327]/10 text-[#B92327]"
                                }`}
                              >
                                {available}/{book.copies} {t("avail", "متاح")}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Students Section */}
              {(selectedCategory === "all" || selectedCategory === "students") &&
                searchResults.students.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      🎓 {t("Students", "الطلاب")} ({searchResults.students.length})
                    </div>
                    <div className="mt-1 space-y-1">
                      {searchResults.students.slice(0, 6).map((student) => (
                        <button
                          key={student.id}
                          onClick={() => handleRecordSelect("/students", student.id)}
                          className="flex w-full items-center justify-between rounded-lg p-2.5 text-start transition-colors hover:bg-muted/60"
                          data-testid={`search-item-student-${student.id}`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#263064]/10 text-[#263064]">
                              <GraduationCap size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-bold text-foreground">
                                {student.fullNameArabic || student.fullName}
                                {student.fullName && student.fullNameArabic && (
                                  <span className="ms-2 text-[11px] font-normal text-muted-foreground">
                                    ({student.fullName})
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {student.grade} · {student.className} · ID:{" "}
                                <span className="font-mono">{student.studentNumber}</span>
                              </div>
                            </div>
                          </div>
                          <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {student.grade}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Borrows Section */}
              {(selectedCategory === "all" || selectedCategory === "borrows") &&
                searchResults.borrows.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      📖 {t("Borrow Records", "سجلات الإعارة")} ({searchResults.borrows.length})
                    </div>
                    <div className="mt-1 space-y-1">
                      {searchResults.borrows.slice(0, 6).map((borrow) => (
                        <button
                          key={borrow.id}
                          onClick={() =>
                            handleRecordSelect(
                              borrow.returnedAt ? "/library/history" : "/library/borrows",
                              borrow.id,
                            )
                          }
                          className="flex w-full items-center justify-between rounded-lg p-2.5 text-start transition-colors hover:bg-muted/60"
                          data-testid={`search-item-borrow-${borrow.id}`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#14BAC6]/15 text-[#14BAC6]">
                              <Clock3 size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-bold text-foreground">
                                {borrow.bookTitle || t("Book", "الكتاب")}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {t("Borrower", "المستعير")}: {borrow.borrowerName} ·{" "}
                                {borrow.dueDate && (
                                  <span>
                                    {t("Due", "الاسترجاع")}:{" "}
                                    {new Date(borrow.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              borrow.returnedAt
                                ? "bg-[#32B77E]/10 text-[#32B77E]"
                                : "bg-[#DBB46C]/20 text-[#EC9F42]"
                            }`}
                          >
                            {borrow.returnedAt
                              ? t("Returned", "مُرجع")
                              : t("Active", "نشطة")}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Teachers Section */}
              {(selectedCategory === "all" || selectedCategory === "teachers") &&
                searchResults.teachers.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      👨‍🏫 {t("Teachers", "المعلمون")} ({searchResults.teachers.length})
                    </div>
                    <div className="mt-1 space-y-1">
                      {searchResults.teachers.slice(0, 6).map((teacher) => (
                        <button
                          key={teacher.id}
                          onClick={() => handleRecordSelect("/teachers", teacher.id)}
                          className="flex w-full items-center justify-between rounded-lg p-2.5 text-start transition-colors hover:bg-muted/60"
                          data-testid={`search-item-teacher-${teacher.id}`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#32B77E]/15 text-[#32B77E]">
                              <UsersRound size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-bold text-foreground">
                                {teacher.fullNameArabic || teacher.fullName || `${teacher.name} ${teacher.surname}`}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {teacher.subject || t("Teacher", "معلم")} · Code:{" "}
                                <span className="font-mono">{teacher.employeeCode}</span>
                              </div>
                            </div>
                          </div>
                          {teacher.subject && (
                            <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {teacher.subject}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Employees Section */}
              {(selectedCategory === "all" || selectedCategory === "employees") &&
                searchResults.employees.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      💼 {t("Employees & Staff", "الموظفون")} ({searchResults.employees.length})
                    </div>
                    <div className="mt-1 space-y-1">
                      {searchResults.employees.slice(0, 6).map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => handleRecordSelect("/employees", emp.id)}
                          className="flex w-full items-center justify-between rounded-lg p-2.5 text-start transition-colors hover:bg-muted/60"
                          data-testid={`search-item-employee-${emp.id}`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#14BAC6]/15 text-[#14BAC6]">
                              <Briefcase size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-bold text-foreground">
                                {emp.fullNameArabic || emp.fullName}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {emp.jobTitle} · No:{" "}
                                <span className="font-mono">{emp.employeeNumber}</span>
                              </div>
                            </div>
                          </div>
                          <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {emp.jobTitle}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>{t("Navigate:", "التنقل:")}</span>
            <kbd className="rounded border border-border bg-card px-1 py-0.5 font-mono text-[9px]">
              ↑
            </kbd>
            <kbd className="rounded border border-border bg-card px-1 py-0.5 font-mono text-[9px]">
              ↓
            </kbd>
            <kbd className="rounded border border-border bg-card px-1 py-0.5 font-mono text-[9px]">
              ↵
            </kbd>
          </div>
          <span>{searchResults.totalCount} {t("results", "نتيجة")}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
