import {
  createContext,
  type FormEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Barcode,
  Bell,
  BookOpen,
  Briefcase,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  Filter,
  FileSpreadsheet,
  GraduationCap,
  Languages,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  UsersRound,
  X,
} from "lucide-react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Link,
  Route,
  Router as WouterRouter,
  Switch,
  useLocation,
} from "wouter";
import {
  type Book,
  type BookInput,
  type Borrow,
  type DashboardSummary,
  type Employee,
  type EmployeeInput,
  type Student,
  type StudentInput,
  type Teacher,
  type TeacherInput,
  getGetAcademicYearsQueryKey,
  getGetBorrowsQueryKey,
  getGetBooksQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetEmployeesQueryKey,
  getGetStudentsQueryKey,
  getGetTeachersQueryKey,
  useCreateBook,
  useCreateBorrow,
  useCreateEmployee,
  useCreateStudent,
  useCreateTeacher,
  useDeleteBook,
  useDeleteEmployee,
  useDeleteStudent,
  useDeleteTeacher,
  useGetAcademicYears,
  useGetBooks,
  useGetBorrows,
  useGetDashboardSummary,
  useGetEmployees,
  useGetStudents,
  useGetTeachers,
  useReturnBorrow,
  useUpdateBook,
  useUpdateEmployee,
  useUpdateStudent,
  useUpdateTeacher,
  setAuthTokenGetter,
} from "@workspace/api-client-react";
import { getBooks } from "@workspace/api-client-react";
import { ErrorBoundary } from "@/components/error-boundary";
import { ImportDialog } from "@/components/import-dialog";
import { ExportMenu } from "@/components/export-menu";
import { downloadTemplate } from "@/utils/import-export";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function useDesktopLocation() {
  const readLocation = () => window.location.hash.slice(1) || "/";
  const [location, setLocation] = useState(readLocation);

  useEffect(() => {
    const onHashChange = () => setLocation(readLocation());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (nextLocation: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      window.history.replaceState(null, "", `#${nextLocation}`);
      setLocation(nextLocation);
    } else {
      window.location.hash = nextLocation;
    }
  };

  return [location, navigate] as [string, (path: string, ...args: any[]) => any];
}

const fallbackSummary = {
  students: 0,
  teachers: 0,
  books: 0,
  availableBooks: 0,
  borrowedBooks: 0,
  employees: 0,
  attendanceRate: 0,
  recentActivity: [],
};

type Language = "en" | "ar";
type Translation = {
  lang: Language;
  setLanguage: (lang: Language) => void;
  t: (english: string, arabic: string) => string;
};
const LanguageContext = createContext<Translation>({
  lang: "en",
  setLanguage: () => undefined,
  t: (english) => english,
});
const useT = () => useContext(LanguageContext);

function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() =>
    localStorage.getItem("al-bassam-language") === "en" ? "en" : "ar",
  );
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.body.dataset.language = language;
    localStorage.setItem("al-bassam-language", language);
  }, [language]);
  const t = useCallback(
    (english: string, arabic: string) => (language === "ar" ? arabic : english),
    [language],
  );
  return (
    <LanguageContext.Provider value={{ lang: language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex min-w-0 justify-center ${compact ? "mx-auto" : "flex-1"}`}
      data-testid="brand-logo"
    >
      <div
        className={`flex items-center justify-center overflow-hidden rounded-lg bg-[#FCFBF0] shadow-[0_0_0_1px_rgba(219,180,108,.45),0_3px_12px_rgba(0,0,0,.28)] ${compact ? "h-14 w-14 shrink-0" : "h-14 w-[176px] max-w-full px-2"}`}
      >
        <img
          src={
            compact ? "/al-bassam-logo-mark.png" : "/al-bassam-logo-trim.png"
          }
          alt="Al-Bassam School"
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  );
}

const navItems = [
  {
    href: "/",
    label: "Overview",
    arabic: "نظرة عامة",
    icon: LayoutDashboard,
    tabs: [],
  },
  {
    href: "/employees",
    label: "Employees",
    arabic: "الموظفون",
    icon: Briefcase,
    tabs: [
      { label: "Teachers", arabic: "المعلمون", href: "/teachers" },
      { label: "Staff records", arabic: "سجلات الموظفين", href: "/employees" },
    ],
  },
  {
    href: "/students",
    label: "Students",
    arabic: "الطلاب",
    icon: GraduationCap,
    tabs: [
      { label: "Student records", arabic: "سجلات الطلاب", href: "/students" },
      {
        label: "Student distribution",
        arabic: "توزيع الطلاب",
        href: "/students/distribution",
      },
    ],
  },
  {
    href: "/library",
    label: "Library",
    arabic: "المكتبة",
    icon: Library,
    tabs: [
      { label: "Books", arabic: "الكتب", href: "/library" },
      {
        label: "Categories",
        arabic: "تصنيفات الكتب",
        href: "/library/categories",
      },
      { label: "Borrows", arabic: "الاستعارات", href: "/library/borrows" },
      { label: "Index", arabic: "الفهرس", href: "/library/index" },
      { label: "Analytics", arabic: "التحليلات", href: "/library/analytics" },
    ],
  },
];

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("al-bassam-sidebar-collapsed") === "1",
  );
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const toggleCollapsed = () =>
    setCollapsed((value) => {
      localStorage.setItem("al-bassam-sidebar-collapsed", value ? "0" : "1");
      return !value;
    });
  const { lang: language, setLanguage, t } = useT();
  const sidebarWidth = collapsed ? 64 : 208;
  const text = t;

  return (
    <div
      className={`app-noise min-h-[100dvh] bg-background text-foreground ${language === "ar" ? "font-arabic" : ""}`}
    >
      <aside
        style={{ width: sidebarWidth }}
        className={`fixed inset-y-0 z-40 flex flex-col transition-[width] duration-300 bg-sidebar text-sidebar-foreground transition-transform duration-300 md:translate-x-0 ${language === "ar" ? "right-0" : "left-0"} ${mobileOpen ? "translate-x-0" : language === "ar" ? "translate-x-full" : "-translate-x-full"}`}
        dir={language === "ar" ? "rtl" : "ltr"}
        data-testid="sidebar-navigation"
      >
        <div className="flex h-[88px] shrink-0 items-center border-b border-sidebar-border px-1">
          <LogoMark compact={collapsed} />
          <button
            onClick={() => setMobileOpen(false)}
            className={`${language === "ar" ? "mr-auto" : "ml-auto"} rounded-md p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-[#FCFBF0] md:hidden`}
            data-testid="button-close-mobile-menu"
            aria-label={text(
              "Close menu",
              "\u0625\u063A\u0644\u0627\u0642\u0020\u0627\u0644\u0642\u0627\u0626\u0645\u0629",
            )}
          >
            <X size={18} />
          </button>
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto pt-7 ${collapsed ? "px-2" : "px-4"}`}>
          <div
            className={`mb-3 flex items-center ${collapsed ? "justify-center px-0" : "justify-between gap-1 px-1"}`}
          >
            {!collapsed && (
              <p className="truncate px-2 text-[10px] font-bold uppercase tracking-[.2em] text-sidebar-foreground/45">
                {text(
                  "Workspace",
                  "\u0645\u0633\u0627\u062D\u0629 \u0627\u0644\u0639\u0645\u0644",
                )}
              </p>
            )}
            <button
              onClick={toggleCollapsed}
              className="rounded-md bg-white p-1.5 text-[#263064] shadow-[0_0_0_1px_rgba(219,180,108,.45)] transition-colors hover:bg-white/85"
              data-testid="button-collapse-sidebar"
              aria-label={text(
                collapsed ? "Open sidebar" : "Collapse sidebar",
                collapsed
                  ? "\u0641\u062A\u062D \u0627\u0644\u0634\u0631\u064A\u0637 \u0627\u0644\u062C\u0627\u0646\u0628\u064A"
                  : "\u0637\u064A \u0627\u0644\u0634\u0631\u064A\u0637 \u0627\u0644\u062C\u0627\u0646\u0628\u064A",
              )}
              title={text(
                collapsed ? "Open" : "Collapse",
                collapsed ? "\u0641\u062A\u062D" : "\u0637\u064A",
              )}
            >
              {collapsed ? (
                language === "ar" ? (
                  <ChevronLeft size={16} />
                ) : (
                  <ChevronRight size={16} />
                )
              ) : language === "ar" ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
            </button>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const groupHrefs = [
                item.href,
                ...item.tabs.map((tab) => tab.href),
              ];
              const active =
                item.href === "/"
                  ? location === "/"
                  : groupHrefs.some(
                      (href) =>
                        location === href || location.startsWith(`${href}/`),
                    );
              const Icon = item.icon;
              return (
                <div key={item.href}>
                  <div className="flex items-center gap-1">
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`group flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-3 transition-all hover:bg-sidebar-accent ${active ? "nav-active bg-sidebar-accent text-[#FCFBF0]" : "text-sidebar-foreground/65"}`}
                      data-testid={`link-nav-${item.label.toLowerCase()}`}
                    >
                      <Icon
                        size={18}
                        strokeWidth={active ? 2.2 : 1.8}
                        className={
                          active
                            ? "text-[#14BAC6]"
                            : "group-hover:text-[#14BAC6]"
                        }
                      />
                      {!collapsed && (
                        <span className="flex-1 truncate text-sm font-medium">
                          {text(item.label, item.arabic)}
                        </span>
                      )}
                    </Link>
                    {!collapsed && item.tabs.length > 0 && (
                      <button
                        onClick={() =>
                          setExpandedGroups((current) => ({
                            ...current,
                            [item.href]: !(current[item.href] ?? active),
                          }))
                        }
                        className="rounded-md p-2 text-sidebar-foreground/45 hover:bg-sidebar-accent hover:text-[#FCFBF0]"
                        aria-label={text(
                          "Toggle sub-tabs",
                          "توسيع أو طي التبويبات الفرعية",
                        )}
                        title={text(
                          "Toggle sub-tabs",
                          "توسيع أو طي التبويبات الفرعية",
                        )}
                        data-testid={`button-toggle-tabs-${item.label.toLowerCase()}`}
                      >
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${(expandedGroups[item.href] ?? active) ? "" : "-rotate-90"}`}
                        />
                      </button>
                    )}
                  </div>
                  {!collapsed &&
                    item.tabs.length > 0 &&
                    (expandedGroups[item.href] ?? active) && (
                      <div
                        className={`mt-1 space-y-0.5 border-sidebar-border pb-1 ${language === "ar" ? "mr-9 border-r-2 border-r-[#14BAC6]/40 pr-3" : "ml-9 border-l-2 border-l-[#14BAC6]/40 pl-3"}`}
                      >
                        {item.tabs.map((tab) => (
                          <Link
                            key={tab.href}
                            href={tab.href}
                            className={`block rounded-md px-3 py-2 text-[11px] transition-colors ${location === tab.href ? "bg-sidebar-accent/70 font-semibold text-[#FCFBF0]" : "text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-[#FCFBF0]"}`}
                            data-testid={`link-nav-tab-${tab.href.replaceAll("/", "-")}`}
                          >
                            {text(tab.label, tab.arabic)}
                          </Link>
                        ))}
                        </div>
                    )}
                    </div>
                  );
                })}
          </nav>
          {!collapsed && (
            <p className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-sidebar-foreground/45">
              {text("Administration", "الإدارة")}
            </p>
          )}
          <Link
            href="/settings"
            onClick={() => setMobileOpen(false)}
            className={`group flex items-center gap-3 rounded-lg px-3 py-3 transition-all hover:bg-sidebar-accent ${location === "/settings" ? "nav-active bg-sidebar-accent text-[#FCFBF0]" : "text-sidebar-foreground/65"}`}
            data-testid="link-nav-settings"
          >
            <Settings2
              size={18}
              className={
                location === "/settings"
                  ? "text-[#14BAC6]"
                  : "group-hover:text-[#14BAC6]"
              }
            />
            {!collapsed && (
              <span className="flex-1 truncate text-sm font-medium">
                {text("Settings", "الإعدادات")}
              </span>
            )}
          </Link>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("school-auth-token") || ""}`,
                },
              });
              localStorage.removeItem("school-auth-token");
              window.location.reload();
            }}
            className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-[#B92327] transition-colors hover:bg-[#B92327]/10 ${collapsed ? "justify-center" : ""}`}
            data-testid="button-logout"
            aria-label={text(
              "Log out",
              "\u062A\u0633\u062C\u064A\u0644\u0020\u0627\u0644\u062E\u0631\u0648\u062C",
            )}
            title={text(
              "Log out",
              "\u062A\u0633\u062C\u064A\u0644\u0020\u0627\u0644\u062E\u0631\u0648\u062C",
            )}
          >
            <LogOut size={17} />
            {!collapsed &&
              text(
                "Log out",
                "\u062A\u0633\u062C\u064A\u0644\u0020\u0627\u0644\u062E\u0631\u0648\u062C",
              )}
          </button>
        </div>
        <div className={`mt-auto ${collapsed ? "px-2 pb-4" : "p-5"}`}>
          <div
            className={`${collapsed ? "mt-3 justify-center" : "mt-5"} flex items-center gap-3${collapsed ? "" : " border-t border-sidebar-border pt-5"}`}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DBB46C] text-xs font-bold text-[#263064]">
              LA
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-[#FCFBF0]">
                  {text(
                    "Library Admin",
                    "آمين المكتبة",
                  )}
                </div>
                <div className="truncate text-[10px] text-sidebar-foreground/45">
                  {text(
                    "Library office",
                    "مكتب المكتبة",
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
      {mobileOpen && (
        <button
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-[#263064]/50 md:hidden"
          aria-label={text(
            "Close navigation overlay",
            "\u0625\u063A\u0644\u0627\u0642\u0020\u062A\u0631\u0627\u0643\u0628\u0020\u0627\u0644\u062A\u0646\u0642\u0644",
          )}
          data-testid="button-mobile-overlay"
        />
      )}
      <main
        style={{ ["--sidebar-w" as string]: `${sidebarWidth}px` }}
        className={`min-h-[100dvh] transition-[padding] duration-300 ${language === "ar" ? "md:pr-[var(--sidebar-w)]" : "md:pl-[var(--sidebar-w)]"}`}
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden"
              data-testid="button-open-mobile-menu"
              aria-label={text("Open navigation menu", "فتح قائمة التنقل")}
            >
              <Menu size={21} />
            </button>
            <div className="hidden text-xs text-muted-foreground sm:block">
              <span className="font-medium text-foreground">
                Al-Bassam School
              </span>
              <span className="mx-2 text-border">/</span>
              <span>
                {(() => {
                  if (location === "/settings") return "Settings";
                  const parent = navItems.find(
                    (item) =>
                      item.href !== "/" &&
                      (location === item.href ||
                        location.startsWith(`${item.href}/`)),
                  );
                  if (!parent) return "Workspace";
                  const tab = parent.tabs.find(
                    (entry) => entry.href === location,
                  );
                  return tab
                    ? `${parent.label} / ${text(tab.label, tab.arabic)}`
                    : parent.label;
                })()}
              </span>
            </div>
            <span className="ar hidden text-[11px] text-muted-foreground sm:block">
              البسام
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div
              className="flex items-center rounded-lg border border-border bg-card p-0.5 text-[10px] font-semibold"
              dir="ltr"
            >
              <button
                onClick={() => setLanguage("en")}
                className={`rounded-md px-2 py-1 transition-colors ${language === "en" ? "bg-[#263064] text-[#FCFBF0]" : "text-muted-foreground"}`}
                data-testid="button-language-en"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("ar")}
                className={`rounded-md px-2 py-1 transition-colors ${language === "ar" ? "bg-[#263064] text-[#FCFBF0]" : "text-muted-foreground"}`}
                data-testid="button-language-ar"
              >
                ع
              </button>
            </div>
            <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground md:flex">
              <Search size={14} />
              <span>
                {text(
                  "Search workspace",
                  "\u0627\u0628\u062D\u062B\u0020\u0641\u064A\u0020\u0645\u0633\u0627\u062D\u0629\u0020\u0627\u0644\u0639\u0645\u0644",
                )}
              </span>
              <kbd className="ml-4 rounded border border-border px-1.5 py-0.5 font-mono text-[9px]">
                ⌘ K
              </kbd>
            </div>
            <button
              className="relative rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-card hover:text-primary"
              data-testid="button-notifications"
              aria-label={text(
                "View notifications",
                "\u0639\u0631\u0636\u0020\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A",
              )}
            >
              <Bell size={18} />
              <span
                className={`absolute top-2 h-1.5 w-1.5 rounded-full bg-[#DBB46C] ${language === "ar" ? "left-2" : "right-2"}`}
              />
            </button>
            <div className="hidden h-7 w-px bg-border sm:block" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#14BAC6]/10 text-[10px] font-bold text-[#14BAC6]">
                LA
              </div>
              <span className="hidden text-xs font-semibold sm:block">
                Library Admin
              </span>
              <ChevronDown
                size={14}
                className="hidden text-muted-foreground sm:block"
              />
            </div>
          </div>
        </header>
        <div className="px-5 py-7 sm:px-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const locale =
    typeof document !== "undefined" && document.documentElement.lang === "ar"
      ? "ar"
      : "en";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function PageHeading({
  eyebrow,
  eyebrowAr,
  title,
  arabic,
  description,
  descriptionAr,
  action,
}: {
  eyebrow: string;
  eyebrowAr?: string;
  title: string;
  arabic: string;
  description: string;
  descriptionAr?: string;
  action?: ReactNode;
}) {
  const { t } = useT();
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {t(eyebrow, eyebrowAr ?? eyebrow)}
        </div>
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-3xl font-bold tracking-[-.04em] text-[#263064] sm:text-[40px]">
            {t(title, arabic)}
          </h1>
          <span
            className={`text-sm text-muted-foreground ${t("en", "ar") === "ar" ? "" : "ar"}`}
          >
            {t(arabic, title)}
          </span>
        </div>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          {t(description, descriptionAr ?? description)}
        </p>
      </div>
      {action}
    </div>
  );
}

function LoadingCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          className="h-[126px] rounded-xl border border-border bg-card p-5"
          key={index}
        >
          <div className="skeleton mb-4 h-3 w-20 rounded" />
          <div className="skeleton h-8 w-28 rounded" />
          <div className="skeleton mt-3 h-2 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const { t, language } = useT();
  if (pageCount <= 1 && totalItems <= 8) return null;
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  return (
    <div className="flex flex-col gap-3 border-t border-border px-5 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span>
          {t(
            `Showing ${from}–${to} of ${totalItems}`,
            `عرض ${from}–${to} من ${totalItems}`,
          )}
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-md border border-border bg-card px-2 py-1 text-xs"
        >
          <option value={8}>8 / page</option>
          <option value={16}>16 / page</option>
          <option value={24}>24 / page</option>
          <option value={50}>50 / page</option>
        </select>
      </div>
      <div className="flex items-center gap-1" dir={language === "ar" ? "rtl" : "ltr"}>
        {language === "ar" ? (
          <>
            <button
              disabled={page === pageCount}
              onClick={() => onPageChange(page + 1)}
              className="rounded-md border border-border p-1 disabled:opacity-40"
              aria-label={t("Next page", "الصفحة التالية")}
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-muted-foreground/70">
              {page} / {pageCount}
            </span>
            <button
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-md border border-border p-1 disabled:opacity-40"
              aria-label={t("Previous page", "الصفحة السابقة")}
            >
              <ChevronRight size={14} />
            </button>
          </>
        ) : (
          <>
            <button
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-md border border-border p-1 disabled:opacity-40"
              aria-label={t("Previous page", "الصفحة السابقة")}
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-muted-foreground/70">
              {page} / {pageCount}
            </span>
            <button
              disabled={page === pageCount}
              onClick={() => onPageChange(page + 1)}
              className="rounded-md border border-border p-1 disabled:opacity-40"
              aria-label={t("Next page", "الصفحة التالية")}
            >
              <ChevronRight size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function usePagination<T>(items: T[], initialPageSize = 8) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  useEffect(() => setPage(1), [items, pageSize]);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  return {
    page: currentPage,
    pageItems: items.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    ),
    pageCount,
    totalItems: items.length,
    pageSize,
    setPage,
    setPageSize,
  };
}

function ErrorState({
  label,
  labelAr,
  onRetry,
}: {
  label: string;
  labelAr?: string;
  onRetry: () => void;
}) {
  const { t } = useT();
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[#B92327]/25 bg-[#FCFBF0] px-6 py-16 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#B92327]/10 text-[#B92327]">
        <AlertTriangle size={19} />
      </div>
      <h3 className="font-semibold text-[#B92327]">
        {t(`Could not load ${label}`, `تعذّر تحميل ${labelAr ?? label}`)}
      </h3>
      <p className="mt-1 text-sm text-[#B92327]/70">
        {t(
          "The workspace will try again when you ask it to.",
          "ستحاول مساحة العمل مجددًا بمجرد طلب ذلك.",
        )}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="mt-5 border-[#B92327]/35 bg-transparent text-[#B92327]"
        data-testid={`button-retry-${label.toLowerCase().replaceAll(" ", "-")}`}
      >
        <RefreshCw size={14} /> {t("Try again", "حاول مجددًا")}
      </Button>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  detail,
  action,
}: {
  icon: typeof BookOpen;
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Icon size={25} strokeWidth={1.6} />
      </div>
      <h3 className="font-semibold text-[#263064]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{detail}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function StatCard({
  label,
  arabic,
  value,
  icon: Icon,
  tone,
  note,
}: {
  label: string;
  arabic: string;
  value: string | number;
  icon: typeof UsersRound;
  tone: "navy" | "teal" | "gold" | "sky";
  note: string;
}) {
  const { t } = useT();
  const tones = {
    navy: "bg-[#263064] text-[#FCFBF0]",
    teal: "bg-[#14BAC6]/10 text-[#14BAC6]",
    gold: "bg-[#DBB46C]/20 text-[#EC9F42]",
    sky: "bg-[#14BAC6]/10 text-[#14BAC6]",
  };
  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 soft-shadow transition-transform duration-300 hover:-translate-y-1"
      data-testid={`card-stat-${label.toLowerCase()}`}
    >
      <div
        className={`mb-5 flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}
      >
        <Icon size={18} />
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[.13em] text-muted-foreground">
            {t(label, arabic)}
          </div>
          <div
            className={`mt-0.5 text-[10px] text-muted-foreground/70 ${t("ar", "en") === "ar" ? "" : "ar"}`}
          >
            {t(arabic, label)}
          </div>
        </div>
        <strong className="font-mono text-[29px] tracking-[-.06em] text-[#263064]">
          {value}
        </strong>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {note}
      </div>
      <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full border-[12px] border-primary/5 transition-transform duration-500 group-hover:scale-125" />
    </div>
  );
}

function Dashboard() {
  const [, setLocation] = useLocation();
  const { t } = useT();
  const summaryQuery = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() },
  });
  const summaryData = summaryQuery.data ?? fallbackSummary;
  const summary = {
    students: Number(summaryData.students ?? 0),
    teachers: Number(summaryData.teachers ?? 0),
    books: Number(summaryData.books ?? 0),
    availableBooks: Number(summaryData.availableBooks ?? 0),
    borrowedBooks: Number(summaryData.borrowedBooks ?? 0),
    employees: Number(summaryData.employees ?? 0),
    attendanceRate: Number(summaryData.attendanceRate ?? 0),
    recentActivity: summaryData.recentActivity ?? [],
  };
  const activity = summary.recentActivity ?? [];
  const activityIcon = (type: string) =>
    type === "library" ? (
      <Library size={15} />
    ) : type === "teacher" ? (
      <UsersRound size={15} />
    ) : type === "student" ? (
      <GraduationCap size={15} />
    ) : (
      <Activity size={15} />
    );
  return (
    <div className="rise-in">
      <PageHeading
        eyebrow="School pulse · 01"
        eyebrowAr="نبض المدرسة · 01"
        title={t("Good morning, admin.", "صباح الخير، آمين المكتبة.")}
        arabic={t("صباح الخير", "Good morning")}
        description={t(
          "A composed view of the people, places and pages moving through Al-Bassam today.",
          "نظرة هادئة على الأشخاص والأماكن والصفحات المتحركة في البسام اليوم.",
        )}
        action={
          <Button
            onClick={() => setLocation("/students")}
            className="h-11 rounded-lg bg-[#263064] px-5 text-sm text-[#FCFBF0] hover:bg-[#263064]/85"
            data-testid="button-open-students"
          >
            <ArrowUpRight size={16} />{" "}
            {t("Open student records", "فتح سجلات الطلاب")}
          </Button>
        }
      />
      {summaryQuery.isLoading ? (
        <LoadingCards />
      ) : summaryQuery.isError ? (
        <ErrorState
          label="dashboard data"
          labelAr="بيانات لوحة التحكم"
          onRetry={() => summaryQuery.refetch()}
        />
      ) : (
        <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Students"
            arabic="الطلاب"
            value={summary.students.toLocaleString()}
            icon={GraduationCap}
            tone="navy"
            note={t("Active enrolment", "التحاق نشط")}
          />
          <StatCard
            label="Teachers"
            arabic="المعلمون"
            value={summary.teachers.toLocaleString()}
            icon={UsersRound}
            tone="teal"
            note={t("Faculty directory", "دليل أعضاء هيئة التدريس")}
          />
          <StatCard
            label="Employees"
            arabic="الموظفون"
            value={summary.employees.toLocaleString()}
            icon={Briefcase}
            tone="sky"
            note={t("Staff members", "أعضاء الهيئة الإدارية")}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total books"
            arabic="إجمالي الكتب"
            value={summary.books.toLocaleString()}
            icon={BookOpen}
            tone="gold"
            note={t("All copies in catalogue", "جميع النسخ في الفهرس")}
          />
          <StatCard
            label="Available books"
            arabic="الكتب المتاحة"
            value={summary.availableBooks.toLocaleString()}
            icon={BookOpen}
            tone="teal"
            note={t("Currently on shelf", "موجودة على الرف حالياً")}
          />
          <StatCard
            label="Borrowed books"
            arabic="الكتب المُعارة"
            value={summary.borrowedBooks.toLocaleString()}
            icon={BookOpen}
            tone="navy"
            note={t("On loan", "مستعارة حالياً")}
          />
          <StatCard
            label="Attendance"
            arabic="نسبة الحضور"
            value={`${summary.attendanceRate}%`}
            icon={Activity}
            tone="sky"
            note={t("Average attendance rate", "متوسط نسبة الحضور")}
          />
        </div>
        </>
      )}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className="rounded-xl border border-border bg-card p-6 soft-shadow">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                {t("Recent activity", "النشاط الأخير")}
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-[-.03em] text-[#263064]">
                {t("The school, in motion", "المدرسة في حِركة مستمرة")}
              </h2>
            </div>
            <button
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary"
              data-testid="button-activity-options"
              aria-label={t("Activity options", "خيارات النشاط")}
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
          {summaryQuery.isLoading ? (
            <div className="space-y-5">
              {[1, 2, 3, 4].map((item) => (
                <div className="flex gap-4" key={item}>
                  <div className="skeleton h-9 w-9 rounded-lg" />
                  <div className="flex-1">
                    <div className="skeleton h-3 w-3/5 rounded" />
                    <div className="skeleton mt-2 h-2 w-2/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : activity.length ? (
            <div className="space-y-1">
              {activity.slice(0, 6).map((item) => (
                <div
                  className="group flex items-center gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-secondary/60"
                  key={item.id}
                  data-testid={`activity-item-${item.id}`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    {activityIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#263064]">
                      {item.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock3 size={11} />
                      {formatDate(item.timestamp)}
                    </p>
                  </div>
                  <ArrowUpRight
                    size={14}
                    className="text-border transition-colors group-hover:text-primary"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {t(
                "Your activity stream will appear here.",
                "سيظهر سجل نشاطاتك هنا.",
              )}
            </div>
          )}
        </section>
        <section className="relative overflow-hidden rounded-xl bg-[#14BAC6] p-7 text-[#FCFBF0]">
          <div className="relative z-10">
            <div className="mb-10 flex h-9 w-9 items-center justify-center rounded-lg bg-[#FCFBF0]/15 text-[#DBB46C]">
              <Sparkles size={18} />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[.2em] text-[#14BAC6]/80">
              {t("A note from the library", "ملاحظة من المكتبة")}
            </div>
            <h2 className="mt-3 max-w-xs text-2xl font-bold leading-tight tracking-[-.04em]">
              {t(
                "Small records build a remarkable school.",
                "السجلات الصغيرة تبني مدرسة متميزة.",
              )}
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-6 text-[#FCFBF0]/85">
              {t(
                "Keep today’s details close. The right information, at the right moment, makes room for better teaching.",
                "حافظ على تفاصيل اليوم قريبة؛ فالمعلومة الصحيحة في اللحظة المناسبة تصنع مساحة أفضل للتعليم.",
              )}
            </p>
          </div>
          <div className="absolute -bottom-14 -right-12 h-48 w-48 rounded-full border-[22px] border-[#FCFBF0]/10" />
          <div className="absolute -right-5 top-10 h-24 w-24 rounded-full border border-[#DBB46C]/50" />
        </section>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DBB46C]/40 bg-[#32B77E]/5 px-5 py-4 text-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#32B77E]/15 text-[#14BAC6]">
            <Languages size={15} />
          </div>
          <span className="font-medium text-[#263064]/80">
            {t(
              "Workspace is ready in English and Arabic",
              "مساحة العمل جاهزة بالعربية والإنجليزية",
            )}
          </span>
        </div>
        <span
          className={`text-xs text-[#263064]/65 ${t("ar", "en") === "ar" ? "" : "ar"}`}
        >
          {t(
            "مساحة العمل جاهزة بالعربية والإنجليزية",
            "Workspace is ready in English and Arabic",
          )}
        </span>
      </div>
    </div>
  );
}

type StudentFormValue = StudentInput & { id?: number };
const blankStudent: StudentFormValue = {
  fullName: "",
  fullNameArabic: "",
  studentNumber: "",
  nationalId: "",
  grade: "",
  className: "",
  guardianName: "",
  guardianPhone: "",
  enrollmentDate: new Date().toISOString().slice(0, 10),
};

function StudentDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Student;
  onSaved: (message: string) => void;
}) {
  const [form, setForm] = useState<StudentFormValue>(blankStudent);
  useEffect(() => {
    if (open)
      setForm(
        editing
          ? {
              ...editing,
              enrollmentDate: (editing.enrollmentDate || "").slice(0, 10),
            }
          : blankStudent,
      );
  }, [open, editing]);
  const create = useCreateStudent();
  const update = useUpdateStudent();
  const queryClient = useQueryClient();
  const isEditing = Boolean(editing);
  const set = (key: keyof StudentFormValue, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !form.fullName ||
      !form.fullNameArabic ||
      !form.studentNumber ||
      !form.nationalId ||
      !form.grade ||
      !form.className
    )
      return;
    const data: StudentInput = {
      fullName: form.fullName,
      fullNameArabic: form.fullNameArabic,
      studentNumber: form.studentNumber,
      nationalId: form.nationalId,
      grade: form.grade,
      className: form.className,
      guardianName: form.guardianName,
      guardianPhone: form.guardianPhone,
      enrollmentDate: form.enrollmentDate,
    };
    const done = () => {
      queryClient.invalidateQueries({ queryKey: getGetStudentsQueryKey() });
      onOpenChange(false);
      onSaved(
        isEditing ? "Student record updated" : "Student added to the directory",
      );
    };
    if (isEditing && editing)
      update.mutate({ id: editing.id, data }, { onSuccess: done });
    else create.mutate({ data }, { onSuccess: done });
  };
  const pending = create.isPending || update.isPending;
  const saveError = create.isError || update.isError;
  const { t } = useT();
  const fields: {
    key: keyof StudentFormValue;
    label: string;
    arabic: string;
    placeholder: string;
  }[] = [
    {
      key: "fullName",
      label: "Full name",
      arabic: "الاسم الكامل",
      placeholder: t("e.g. Sara Al-Harbi", "مثال: سارة الحربي"),
    },
    {
      key: "fullNameArabic",
      label: "Arabic name",
      arabic: "الاسم بالعربية",
      placeholder: "مثال: سارة الحربي",
    },
    {
      key: "studentNumber",
      label: "Student number",
      arabic: "رقم الطالب",
      placeholder: "AB-2024-014",
    },
    {
      key: "nationalId",
      label: "National ID",
      arabic: "الهوية الوطنية",
      placeholder: "10xxxxxxxx",
    },
    {
      key: "grade",
      label: "Grade",
      arabic: "الصف",
      placeholder: t("Grade 8", "الصف الثامن"),
    },
    { key: "className", label: "Class", arabic: "الفصل", placeholder: "8A" },
    {
      key: "guardianName",
      label: "Guardian name",
      arabic: "اسم ولي الأمر",
      placeholder: t("Guardian full name", "اسم ولي الأمر الكامل"),
    },
    {
      key: "guardianPhone",
      label: "Guardian phone",
      arabic: "هاتف ولي الأمر",
      placeholder: "+966 5x xxx xxxx",
    },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-border bg-[#FCFBF0] p-0">
        <form onSubmit={submit}>
          <DialogHeader className="border-b border-border bg-card px-6 py-5 text-left">
            <div className="flex items-start justify-between pr-8">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                  {t(
                    isEditing ? "Edit record" : "New enrolment",
                    isEditing ? "تعديل السجل" : "تسجيل جديد",
                  )}
                </div>
                <DialogTitle className="mt-1 text-2xl text-[#263064]">
                  {t(
                    isEditing ? "Update student" : "Add a student",
                    isEditing ? "تحديث بيانات طالب" : "إضافة طالب",
                  )}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {t(
                    "Keep the directory details accurate and easy to find.",
                    "حافظ على دقة تفاصيل الدليل وسهولة الوصول إليها.",
                  )}
                </DialogDescription>
              </div>
              <span
                className={`text-xs text-muted-foreground ${t("ar", "en") === "ar" ? "" : "ar"}`}
              >
                {t("تعديل السجل", "Edit record")}
              </span>
            </div>
          </DialogHeader>
          <div className="grid gap-4 px-6 py-6 sm:grid-cols-2">
            {fields.map((field) => (
              <label className="block" key={field.key}>
                <span className="mb-1.5 flex items-baseline justify-between text-xs font-semibold text-[#263064]">
                  <span>{!['guardianName', 'guardianPhone'].includes(field.key) ? `${t(field.label, field.arabic)} *` : t(field.label, field.arabic)}</span>
                  <span
                    className={`text-[9px] font-normal text-muted-foreground ${t("ar", "en") === "ar" ? "" : "ar"}`}
                  >
                    {t(field.arabic, field.label)}
                  </span>
                </span>
                <input
                  required={
                    !["guardianName", "guardianPhone"].includes(field.key)
                  }
                  value={String(form[field.key] ?? "")}
                  onChange={(event) => set(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/10"
                  data-testid={`input-student-${field.key}`}
                />
              </label>
            ))}
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#263064]">
                {t("Enrollment date", "تاريخ التسجيل")} *
              </span>
              <input
                type="date"
                required
                value={form.enrollmentDate}
                onChange={(event) => set("enrollmentDate", event.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary"
                data-testid="input-student-enrollmentDate"
              />
            </label>
          </div>
          {saveError && (
            <div
              className="mx-6 mb-4 rounded-lg border border-destructive/30 bg-[#B92327]/10 px-4 py-3 text-sm text-destructive"
              data-testid="error-student-dialog"
            >
              {t(
                "Could not save — the student number or national ID may already be in use.",
                "تعذر الحفظ — قد يكون رقم الطالب أو الهوية الوطنية مستخدماً بالفعل.",
              )}
            </div>
          )}
          <DialogFooter className="border-t border-border bg-card px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-student"
            >
              {t("Cancel", "إلغاء")}
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-[#263064] text-[#FCFBF0] hover:bg-[#263064]/85"
              data-testid="button-save-student"
            >
              {pending
                ? t("Saving…", "جارٍ الحفظ…")
                : isEditing
                  ? t("Save changes", "حفظ التغييرات")
                  : t("Add student", "إضافة الطالب")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StudentRow({
  student,
  onEdit,
  onDelete,
}: {
  student: Student;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}) {
  const { t } = useT();
  const statusLabel =
    {
      active: t("active", "نشط"),
      graduated: t("graduated", "متخرج"),
      inactive: t("inactive", "غير نشط"),
    }[student.status] ?? student.status;
  return (
    <div
      className="group grid min-w-[940px] grid-cols-[2fr_1fr_1.15fr_.8fr_1.25fr_1fr_.75fr_88px] items-center border-b border-border/70 px-5 py-3 transition-colors hover:bg-secondary/40"
      data-testid={`row-student-${student.id}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#14BAC6]/10 text-xs font-bold text-[#14BAC6]">
          {student.fullName
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")}
        </div>
        <div>
          <div className="text-sm font-semibold text-[#263064]">
            {student.fullName}
          </div>
          <div className="ar text-[10px] text-muted-foreground">
            {student.fullNameArabic}
          </div>
        </div>
      </div>
      <span
        className="justify-self-center text-center font-mono text-xs text-muted-foreground"
        dir="ltr"
      >
        {student.studentNumber}
      </span>
      <span
        className="justify-self-center text-center font-mono text-xs text-muted-foreground"
        dir="ltr"
      >
        {student.nationalId}
      </span>
      <div>
        <div className="text-xs font-medium text-[#263064]">
          {student.grade}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {student.className}
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        {student.guardianName || t("Not provided", "غير مُدخل")}
        <div className="mt-0.5 text-[10px] rtl:text-right" dir="ltr">
          {student.guardianPhone}
        </div>
      </div>
      <span
        className="justify-self-center text-center font-mono text-xs text-muted-foreground"
        dir="auto"
      >
        {formatDate(student.enrollmentDate)}
      </span>
      <span
        className={`w-fit justify-self-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${student.status === "active" ? "bg-[#32B77E]/15 text-[#32B77E]" : student.status === "graduated" ? "bg-[#DBB46C]/20 text-[#EC9F42]" : "bg-muted text-muted-foreground"}`}
      >
        {statusLabel}
      </span>
      <div className="flex justify-center gap-1 opacity-40 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => onEdit(student)}
          className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-primary"
          data-testid={`button-edit-student-${student.id}`}
          aria-label={`Edit ${student.fullName}`}
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(student)}
          className="rounded-md p-2 text-muted-foreground hover:bg-[#B92327]/10 hover:text-destructive"
          data-testid={`button-delete-student-${student.id}`}
          aria-label={`Delete ${student.fullName}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function StudentsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Student | undefined>();
  const [toast, setToast] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const { t } = useT();
  const query = useGetStudents(
    {
      search: search || undefined,
      status: (status || undefined) as
        "active" | "inactive" | "graduated" | undefined,
    },
    {
      query: {
        queryKey: getGetStudentsQueryKey({
          search: search || undefined,
          status: (status || undefined) as
            "active" | "inactive" | "graduated" | undefined,
        }),
      },
    },
  );
  const deletion = useDeleteStudent();
  const createStudent = useCreateStudent();
  const queryClient = useQueryClient();
  const students = Array.isArray(query.data) ? query.data : [];
  const filtered = useMemo(() => students, [students]);
  const studentPages = usePagination(filtered);
  const openNew = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };
  const edit = (student: Student) => {
    setEditing(student);
    setDialogOpen(true);
  };
  const remove = (student: Student) => {
    if (
      !window.confirm(
        t(
          `Delete ${student.fullName} from the directory?`,
          `حذف ${student.fullName} من الدليل؟`,
        ),
      )
    )
      return;
    deletion.mutate(
      { id: student.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetStudentsQueryKey() });
          setToast(t("Student record deleted", "تم حذف سجل الطالب"));
        },
      },
    );
  };
  return (
    <div className="rise-in">
      <PageHeading
        eyebrow="People · 03"
        eyebrowAr="الأشخاص · 03"
        title="Students"
        arabic="الطلاب"
        description="A clear, current directory for every learner in the Al-Bassam community."
        descriptionAr="دليل واضح ومحدّث لكل متعلم في مجتمع البسام التعليمية."
        action={
          <div className="flex items-center gap-2">
            <ExportMenu entityType="students" data={students} t={t} />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => downloadTemplate("students")}
              data-testid="button-template-students"
            >
              <FileSpreadsheet size={14} /> {t("Template", "القالب")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setImportOpen(true)}
              data-testid="button-import-students"
            >
              <Upload size={14} /> {t("Import", "استيراد")}
            </Button>
            <Button
              onClick={openNew}
              className="h-11 rounded-lg bg-[#263064] px-5 text-[#FCFBF0] hover:bg-[#263064]/85"
              data-testid="button-add-student"
            >
              <Plus size={17} /> {t("Add student", "إضافة طالب")}
            </Button>
          </div>
        }
      />
      {toast && (
        <div
          className="mb-4 flex items-center gap-2 rounded-lg border border-[#32B77E]/35 bg-[#32B77E]/10 px-4 py-3 text-sm text-[#32B77E] rise-in"
          data-testid="status-student-action"
        >
          <Check size={16} />
          {toast}
          <button
            className="ml-auto text-[#32B77E]/60 hover:text-[#32B77E]"
            onClick={() => setToast("")}
            data-testid="button-dismiss-student-toast"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {query.isLoading ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="space-y-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div className="flex gap-4" key={item}>
                <div className="skeleton h-9 w-9 rounded-full" />
                <div className="skeleton h-4 w-48 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : query.isError ? (
        <ErrorState
          label="students"
          labelAr="الطلاب"
          onRetry={() => query.refetch()}
        />
      ) : !filtered.length ? (
        <EmptyState
          icon={GraduationCap}
          title={
            search || status
              ? t(
                  "No students match this view",
                  "لا يوجد طلاب مطابقون لهذا العرض",
                )
              : t("Start your student directory", "ابدأ دليل الطلاب")
          }
          detail={
            search || status
              ? t(
                  "Try another search term or clear the filters.",
                  "جرّب كلمة بحث أخرى أو امسح عوامل التصفية.",
                )
              : t(
                  "Add the first student record to begin building the directory.",
                  "أضف أول سجل طالب لبدء بناء الدليل.",
                )
          }
          action={
            !search && !status ? (
              <Button onClick={openNew} data-testid="button-empty-add-student">
                <Plus size={15} /> {t("Add first student", "إضافة أول طالب")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card soft-shadow">
          <div className="grid min-w-[940px] grid-cols-[2fr_1fr_1.15fr_.8fr_1.25fr_1fr_.75fr_88px] border-b border-border bg-[#263064]/5 px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
            <span>{t("Student", "الطالب")}</span>
            <span className="text-center">{t("Number", "الرقم")}</span>
            <span className="text-center">
              {t("National ID", "الهوية الوطنية")}
            </span>
            <span>{t("Class", "الفصل")}</span>
            <span>{t("Guardian", "ولي الأمر")}</span>
            <span className="text-center">
              {t("Enrolled", "تاريخ التسجيل")}
            </span>
            <span className="text-center">{t("Status", "الحالة")}</span>
            <span />
          </div>
          {studentPages.pageItems.map((student) => (
            <StudentRow
              key={student.id}
              student={student}
              onEdit={edit}
              onDelete={remove}
            />
          ))}
          <Pagination
            page={studentPages.page}
            pageCount={studentPages.pageCount}
            totalItems={studentPages.totalItems}
            pageSize={studentPages.pageSize}
            onPageChange={studentPages.setPage}
            onPageSizeChange={studentPages.setPageSize}
          />
        </div>
      )}
      <StudentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={setToast}
      />
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entityType="students"
        t={t}
        onImport={async (rows) => {
          for (const row of rows) {
            await new Promise<void>((resolve) => {
              createStudent.mutate(
                { data: row as any },
                { onSuccess: () => resolve(), onError: () => resolve() },
              );
            });
          }
          queryClient.invalidateQueries({ queryKey: getGetStudentsQueryKey() });
          setToast(t(`${rows.length} students imported`, `تم استيراد ${rows.length} طالب`));
        }}
      />
    </div>
  );
}

type TeacherFormValue = Partial<TeacherInput> & { id?: number };
const blankTeacher: TeacherFormValue = { status: "active", isEmployee: true };

const teacherSections: {
  title: string;
  titleAr: string;
  fields: {
    key: keyof TeacherInput & string;
    label: string;
    arabic: string;
    placeholder?: string;
    type?: string;
    required?: boolean;
    options?: [string, string, string][];
  }[];
}[] = [
  {
    title: "Account",
    titleAr: "الحساب",
    fields: [
      {
        key: "username",
        label: "Username",
        arabic: "اسم المستخدم",
        placeholder: "teacher01",
      },
      {
        key: "password",
        label: "Password",
        arabic: "كلمة المرور",
        type: "password",
      },
      {
        key: "isEmployee",
        label: "Is an employee",
        arabic: "موظف؟",
        options: [
          ["true", "Yes", "\u0646\u0639\u0645"],
          ["false", "No", "\u0644\u0627"],
        ],
      },
    ],
  },
  {
    title: "Personal information",
    titleAr: "البيانات الشخصية",
    fields: [
      { key: "name", label: "Name", arabic: "الاسم" },
      { key: "surname", label: "Surname", arabic: "اللقب" },
      {
        key: "englishName",
        label: "English name",
        arabic: "الاسم بالانجليزية",
      },
      {
        key: "nationalId",
        label: "National ID",
        arabic: "الهوية الوطنية",
        placeholder: "10xxxxxxxxxx",
      },
      { key: "nationality", label: "Nationality", arabic: "الجنسية" },
      {
        key: "gender",
        label: "Gender",
        arabic: "الجنس",
        options: [
          ["male", "Male", "\u0630\u0643\u0631"],
          ["female", "Female", "\u0623\u0646\u062B\u0649"],
        ],
      },
      {
        key: "maritalStatus",
        label: "Marital status",
        arabic: "الحالة الاجتماعية",
        options: [
          ["single", "Single", "\u0623\u0639\u0632\u0628"],
          ["married", "Married", "\u0645\u062A\u0632\u0648\u062C"],
          ["divorced", "Divorced", "\u0645\u0637\u0644\u0642"],
          ["widowed", "Widowed", "\u0623\u0631\u0645\u0644"],
        ],
      },
      { key: "religion", label: "Religion", arabic: "الديانة" },
      {
        key: "height",
        label: "Height (cm)",
        arabic: "الطول (سم)",
        type: "number",
      },
      {
        key: "weight",
        label: "Weight (kg)",
        arabic: "الوزن (كج)",
        type: "number",
      },
    ],
  },
  {
    title: "Contact",
    titleAr: "بيانات الاتصال",
    fields: [
      {
        key: "phone",
        label: "Phone",
        arabic: "الهاتف",
        placeholder: "+966 5x xxx xxxx",
      },
      {
        key: "email",
        label: "Email",
        arabic: "البريد الالكتروني",
        type: "email",
      },
      { key: "address", label: "Address", arabic: "العنوان" },
      { key: "area", label: "Area", arabic: "المنطقة" },
      { key: "country", label: "Country", arabic: "البلد" },
    ],
  },
  {
    title: "Job information",
    titleAr: "البيانات الوظيفية",
    fields: [
      {
        key: "employeeCode",
        label: "Employee code",
        arabic: "الرقم الوظيفي",
        placeholder: "TCH-014",
      },
      { key: "branch", label: "Branch", arabic: "الفرع" },
      {
        key: "academicLevel",
        label: "Academic level",
        arabic: "المرحلة الدراسية",
      },
      {
        key: "subject",
        label: "Subject",
        arabic: "المادة",
        options: [
          ["Mathematics", "Mathematics", "الرياضيات"],
          ["Arabic", "Arabic", "اللغة العربية"],
          ["English", "English", "اللغة الإنجليزية"],
          ["Science", "Science", "العلوم"],
          ["Social Studies", "Social Studies", "الدراسات الاجتماعية"],
          ["Islamic Studies", "Islamic Studies", "التربية الإسلامية"],
          ["Computer Science", "Computer Science", "علوم الحاسب"],
          ["Physical Education", "Physical Education", "التربية البدنية"],
          ["Art", "Art", "الفنون"],
          ["Music", "Music", "الموسيقى"],
        ],
      },
      {
        key: "weeklyClasses",
        label: "Weekly classes",
        arabic: "الحصص الأسبوعية",
        type: "number",
      },
      {
        key: "status",
        label: "Status",
        arabic: "الحالة",
        options: [
          ["active", "Active", "\u0646\u0634\u0637"],
          [
            "inactive",
            "Inactive",
            "\u063A\u064A\u0631\u0020\u0646\u0634\u0637",
          ],
        ],
      },
    ],
  },
];

function TeacherDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Teacher;
  onSaved: (message: string) => void;
}) {
  const [form, setForm] = useState<TeacherFormValue>(blankTeacher);
  useEffect(() => {
    if (open) {
      setForm(
        editing
          ? ({ ...editing } as TeacherFormValue)
          : blankTeacher,
      );
    }
  }, [open, editing]);
  const create = useCreateTeacher();
  const update = useUpdateTeacher();
  const queryClient = useQueryClient();
  const isEditing = Boolean(editing);
  const set = (key: string, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !String(form.name ?? "").trim() ||
      !String(form.surname ?? "").trim() ||
      !String(form.employeeCode ?? "").trim()
    )
      return;
    const text = (key: keyof TeacherInput) => {
      const v = String(form[key] ?? "").trim();
      return v ? { [key]: v } : {};
    };
    const num = (key: "height" | "weight" | "weeklyClasses") => {
      const v = String(form[key] ?? "").trim();
      return v !== "" && Number(v) >= 0 ? { [key]: Number(v) } : {};
    };
    const data: TeacherInput = {
      name: String(form.name).trim(),
      surname: String(form.surname).trim(),
      employeeCode: String(form.employeeCode).trim(),
      ...text("username"),
      ...text("password"),
      ...text("englishName"),
      ...text("nationalId"),
      ...text("nationality"),
      ...(form.gender ? { gender: form.gender } : {}),
      ...(form.maritalStatus ? { maritalStatus: form.maritalStatus } : {}),
      ...text("religion"),
      ...text("phone"),
      ...text("email"),
      ...text("address"),
      ...text("area"),
      ...text("country"),
      ...num("height"),
      ...num("weight"),
      ...text("branch"),
      ...text("academicLevel"),
      ...text("subject"),
      ...num("weeklyClasses"),
      isEmployee:
        form.isEmployee !== undefined
          ? String(form.isEmployee) === "true"
          : true,
      status: form.status ?? "active",
    };
    const done = () => {
      queryClient.invalidateQueries({ queryKey: getGetTeachersQueryKey() });
      onOpenChange(false);
      onSaved(
        isEditing
          ? t("Teacher record updated", "تم تحديث سجل المعلم")
          : t(
              "Teacher added to the faculty",
              "تمت إضافة المعلم إلى هيئة التدريس",
            ),
      );
    };
    if (isEditing && editing)
      update.mutate({ id: editing.id, data }, { onSuccess: done });
    else create.mutate({ data }, { onSuccess: done });
  };
  const pending = create.isPending || update.isPending;
  const saveError = create.isError || update.isError;
  const { t } = useT();
  const inputCls =
    "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/10";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-3xl overflow-y-auto border-border bg-[#FCFBF0] p-0">
        <form onSubmit={submit}>
          <DialogHeader className="border-b border-border bg-card px-6 py-5 text-left">
            <div className="flex items-start justify-between pr-8">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                  {t(
                    isEditing ? "Edit record" : "New faculty member",
                    isEditing ? "تعديل السجل" : "عضو هيئة تدريس جديد",
                  )}
                </div>
                <DialogTitle className="mt-1 text-2xl text-[#263064]">
                  {t(
                    isEditing ? "Update teacher" : "Add a teacher",
                    isEditing ? "تحديث بيانات معلم" : "إضافة معلم",
                  )}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {t(
                    "Keep the faculty directory accurate and easy to find.",
                    "حافظ على دقة دليل هيئة التدريس وسهولة الوصول إليها.",
                  )}
                </DialogDescription>
              </div>
              <span
                className={`text-xs text-muted-foreground ${t("ar", "en") === "ar" ? "" : "ar"}`}
              >
                {t("تعديل السجل", "Edit record")}
              </span>
            </div>
          </DialogHeader>
          <div className="space-y-6 px-6 py-6">
            {teacherSections.map((section) => (
              <fieldset
                key={section.title}
                className="rounded-xl border border-border bg-card/60 p-4"
              >
                <legend className="ar px-2 text-[11px] font-bold uppercase tracking-[.14em] text-primary">
                  {t(section.title, section.titleAr)}
                </legend>
                <div className="grid gap-4 sm:grid-cols-3">
                  {section.fields.map((field) => (
                    <label className="block" key={field.key}>
                      <span className="mb-1.5 flex items-baseline justify-between text-xs font-semibold text-[#263064]">
                        <span>
                          {field.required
                            ? `${t(field.label, field.arabic)} *`
                            : t(field.label, field.arabic)}
                        </span>
                        {field.type !== "password" && (
                          <span
                            className={`text-[9px] font-normal text-muted-foreground ${t("ar", "en") === "ar" ? "" : "ar"}`}
                          >
                            {t(field.arabic, field.label)}
                          </span>
                        )}
                      </span>
                      {field.options ? (
                        <select
                          value={String(form[field.key] ?? "")}
                          onChange={(event) =>
                            set(field.key, event.target.value)
                          }
                          className={`${inputCls} cursor-pointer appearance-none`}
                          data-testid={`input-teacher-${field.key}`}
                        >
                          {field.options.map(([value, label, ar]) => (
                            <option key={value} value={value}>
                              {t(label, ar)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          required={
                            field.key === "name" ||
                            field.key === "surname" ||
                            field.key === "employeeCode"
                          }
                          type={field.type ?? "text"}
                          min={field.type === "number" ? 0 : undefined}
                          value={String(form[field.key] ?? "")}
                          onChange={(event) =>
                            set(field.key, event.target.value)
                          }
                          placeholder={field.placeholder}
                          className={inputCls}
                          dir={
                            field.key === "email" || field.key === "phone"
                              ? "ltr"
                              : undefined
                          }
                          data-testid={`input-teacher-${field.key}`}
                        />
                      )}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          {saveError && (
            <div
              className="mx-6 mb-4 rounded-lg border border-destructive/30 bg-[#B92327]/10 px-4 py-3 text-sm text-destructive"
              data-testid="error-teacher-dialog"
            >
              {t(
                "Could not save — name, surname and employee code are required, and the employee code must be unique.",
                "تعذر الحفظ — الاسم واللقب والرقم الوظيفي مطلوبة، ويجب أن يكون الرقم الوظيفي فريداً.",
              )}
            </div>
          )}
          <DialogFooter className="border-t border-border bg-card px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-teacher"
            >
              {t("Cancel", "إلغاء")}
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-[#263064] text-[#FCFBF0] hover:bg-[#263064]/85"
              data-testid="button-save-teacher"
            >
              {pending
                ? t("Saving…", "جارٍ الحفظ…")
                : isEditing
                  ? t("Save changes", "حفظ التغييرات")
                  : t("Add teacher", "إضافة المعلم")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function TeacherRow({
  teacher,
  onEdit,
  onDelete,
}: {
  teacher: Teacher;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
}) {
  const { t } = useT();
  const statusLabel =
    teacher.status === "active" ? t("active", "نشط") : t("inactive", "غير نشط");
  return (
    <div
      className="group grid min-w-[900px] grid-cols-[2fr_.9fr_1fr_1.15fr_1fr_.7fr_88px] items-center border-b border-border/70 px-5 py-3 transition-colors hover:bg-secondary/40"
      data-testid={`row-teacher-${teacher.id}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#14BAC6]/10 text-xs font-bold text-[#14BAC6]">
          {teacher.fullName
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")}
        </div>
        <div>
          <div className="text-sm font-semibold text-[#263064]">
            {teacher.fullName}
          </div>
          <div className="ar text-[10px] text-muted-foreground">
            {teacher.fullNameArabic}
          </div>
        </div>
      </div>
      <span
        className="justify-self-center text-center font-mono text-xs text-muted-foreground"
        dir="ltr"
      >
        {teacher.employeeCode}
      </span>
      <div className="text-xs font-medium text-[#263064]">
        {teacher.subject}
      </div>
      <span
        className="justify-self-center text-center font-mono text-xs text-muted-foreground"
        dir="ltr"
      >
        {teacher.nationalId}
      </span>
      <span
        className="justify-self-center text-center text-xs text-muted-foreground"
        dir="ltr"
      >
        {teacher.phone}
      </span>
      <span
        className={`w-fit justify-self-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${teacher.status === "active" ? "bg-[#32B77E]/15 text-[#32B77E]" : "bg-muted text-muted-foreground"}`}
      >
        {statusLabel}
      </span>
      <div className="flex justify-center gap-1 opacity-40 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => onEdit(teacher)}
          className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-primary"
          data-testid={`button-edit-teacher-${teacher.id}`}
          aria-label={`Edit ${teacher.fullName}`}
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(teacher)}
          className="rounded-md p-2 text-muted-foreground hover:bg-[#B92327]/10 hover:text-destructive"
          data-testid={`button-delete-teacher-${teacher.id}`}
          aria-label={`Delete ${teacher.fullName}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

const blankEmployee: EmployeeFormValue = {
  fullName: "",
  fullNameArabic: "",
  employeeNumber: "",
  nationalId: "",
  jobTitle: "",
  phone: "",
  status: "active",
};
type EmployeeFormValue = EmployeeInput & { status?: "active" | "inactive" };

function EmployeeDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Employee;
  onSaved: (message: string) => void;
}) {
  const [form, setForm] = useState<EmployeeFormValue>(blankEmployee);
  useEffect(() => {
    if (open) setForm(editing ? { ...editing } : blankEmployee);
  }, [open, editing]);
  const create = useCreateEmployee();
  const update = useUpdateEmployee();
  const queryClient = useQueryClient();
  const isEditing = Boolean(editing);
  const set = (key: keyof EmployeeFormValue, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !form.fullName ||
      !form.fullNameArabic ||
      !form.employeeNumber ||
      !form.nationalId ||
      !form.jobTitle ||
      !form.phone
    )
      return;
    const data: EmployeeInput = {
      fullName: form.fullName,
      fullNameArabic: form.fullNameArabic,
      employeeNumber: form.employeeNumber,
      nationalId: form.nationalId,
      jobTitle: form.jobTitle,
      phone: form.phone,
      status: form.status,
    };
    const done = () => {
      queryClient.invalidateQueries({ queryKey: getGetEmployeesQueryKey() });
      onOpenChange(false);
      onSaved(
        isEditing
          ? t("Employee record updated", "تم تحديث سجل الموظف")
          : t(
              "Employee added to the staff directory",
              "تمت إضافة الموظف إلى سجل الموظفين",
            ),
      );
    };
    if (isEditing && editing)
      update.mutate({ id: editing.id, data }, { onSuccess: done });
    else create.mutate({ data }, { onSuccess: done });
  };
  const pending = create.isPending || update.isPending;
  const saveError = create.isError || update.isError;
  const { t } = useT();
  const fields: { key: keyof EmployeeInput; label: string; arabic: string }[] =
    [
      { key: "fullName", label: "Full name", arabic: "الاسم الكامل" },
      { key: "fullNameArabic", label: "Arabic name", arabic: "الاسم بالعربية" },
      {
        key: "employeeNumber",
        label: "Employee number",
        arabic: "الرقم الوظيفي",
      },
      { key: "nationalId", label: "National ID", arabic: "الهوية الوطنية" },
      { key: "jobTitle", label: "Job title", arabic: "المسمى الوظيفي" },
      { key: "phone", label: "Phone", arabic: "الهاتف" },
    ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-border bg-[#FCFBF0] p-0">
        <form onSubmit={submit}>
          <DialogHeader className="border-b border-border bg-card px-6 py-5 text-left">
            <div className="flex items-start justify-between pr-8">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                  {t(
                    isEditing ? "Edit record" : "New staff member",
                    isEditing ? "تعديل السجل" : "موظف جديد",
                  )}
                </div>
                <DialogTitle className="mt-1 text-2xl text-[#263064]">
                  {t(
                    isEditing ? "Update employee" : "Add an employee",
                    isEditing ? "تحديث بيانات موظف" : "إضافة موظف",
                  )}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {t(
                    "Keep the staff directory accurate and easy to find.",
                    "حافظ على دقة سجل الموظفين وسهولة الوصول إليه.",
                  )}
                </DialogDescription>
              </div>
              <span
                className={`text-xs text-muted-foreground ${t("ar", "en") === "ar" ? "" : "ar"}`}
              >
                {t("تعديل السجل", "Edit record")}
              </span>
            </div>
          </DialogHeader>
          <div className="grid gap-4 px-6 py-6 sm:grid-cols-2">
            {fields.map((field) => (
              <label className="block" key={field.key}>
                <span className="mb-1.5 flex items-baseline justify-between text-xs font-semibold text-[#263064]">
                  <span>{t(field.label, field.arabic)} *</span>
                  <span
                    className={`text-[9px] font-normal text-muted-foreground ${t("ar", "en") === "ar" ? "" : "ar"}`}
                  >
                    {t(field.arabic, field.label)}
                  </span>
                </span>
                <input
                  required
                  value={String(form[field.key] ?? "")}
                  onChange={(event) => set(field.key, event.target.value)}
                  placeholder={
                    field.key === "employeeNumber" ? "EMP-014" : undefined
                  }
                  className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/10"
                  data-testid={`input-employee-${field.key}`}
                />
              </label>
            ))}
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#263064]">
                {t("Status", "الحالة")}
              </span>
              <select
                value={form.status}
                onChange={(event) => set("status", event.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary"
                data-testid="input-employee-status"
              >
                <option value="active">{t("Active", "نشط")}</option>
                <option value="inactive">{t("Inactive", "غير نشط")}</option>
              </select>
            </label>
          </div>
          {saveError && (
            <div
              className="mx-6 mb-4 rounded-lg border border-destructive/30 bg-[#B92327]/10 px-4 py-3 text-sm text-destructive"
              data-testid="error-employee-dialog"
            >
              {t(
                "Could not save — the employee number or national ID may already be in use.",
                "تعذر الحفظ — قد يكون الرقم الوظيفي أو الهوية الوطنية مستخدماً بالفعل.",
              )}
            </div>
          )}
          <DialogFooter className="border-t border-border bg-card px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-employee"
            >
              {t("Cancel", "إلغاء")}
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-[#263064] text-[#FCFBF0] hover:bg-[#263064]/85"
              data-testid="button-save-employee"
            >
              {pending
                ? t("Saving…", "جارٍ الحفظ…")
                : isEditing
                  ? t("Save changes", "حفظ التغييرات")
                  : t("Add employee", "إضافة الموظف")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmployeeRow({
  employee,
  onEdit,
  onDelete,
}: {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}) {
  const { t } = useT();
  const statusLabel =
    employee.status === "active"
      ? t("active", "نشط")
      : t("inactive", "غير نشط");
  return (
    <div
      className="group grid min-w-[900px] grid-cols-[2fr_.9fr_1fr_1.15fr_1fr_.7fr_88px] items-center border-b border-border/70 px-5 py-3 transition-colors hover:bg-secondary/40"
      data-testid={`row-employee-${employee.id}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DBB46C]/20 text-xs font-bold text-[#EC9F42]">
          {employee.fullName
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")}
        </div>
        <div>
          <div className="text-sm font-semibold text-[#263064]">
            {employee.fullName}
          </div>
          <div className="ar text-[10px] text-muted-foreground">
            {employee.fullNameArabic}
          </div>
        </div>
      </div>
      <span
        className="justify-self-center text-center font-mono text-xs text-muted-foreground"
        dir="ltr"
      >
        {employee.employeeNumber}
      </span>
      <div className="text-xs font-medium text-[#263064]">
        {employee.jobTitle}
      </div>
      <span
        className="justify-self-center text-center font-mono text-xs text-muted-foreground"
        dir="ltr"
      >
        {employee.nationalId}
      </span>
      <span
        className="justify-self-center text-center text-xs text-muted-foreground"
        dir="ltr"
      >
        {employee.phone}
      </span>
      <span
        className={`w-fit justify-self-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${employee.status === "active" ? "bg-[#32B77E]/15 text-[#32B77E]" : "bg-muted text-muted-foreground"}`}
      >
        {statusLabel}
      </span>
      <div className="flex justify-center gap-1 opacity-40 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => onEdit(employee)}
          className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-primary"
          data-testid={`button-edit-employee-${employee.id}`}
          aria-label={`Edit ${employee.fullName}`}
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(employee)}
          className="rounded-md p-2 text-muted-foreground hover:bg-[#B92327]/10 hover:text-destructive"
          data-testid={`button-delete-employee-${employee.id}`}
          aria-label={`Delete ${employee.fullName}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | undefined>();
  const [toast, setToast] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const { t } = useT();
  const query = useGetEmployees(
    { search: search || undefined },
    {
      query: {
        queryKey: getGetEmployeesQueryKey({ search: search || undefined }),
      },
    },
  );
  const deletion = useDeleteEmployee();
  const createEmployee = useCreateEmployee();
  const queryClient = useQueryClient();
  const employees = Array.isArray(query.data) ? query.data : [];
  const filteredEmployees = useMemo(() => employees.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (e.fullName || "").toLowerCase().includes(q) || (e.fullNameArabic || "").toLowerCase().includes(q) || (e.jobTitle || "").toLowerCase().includes(q) || (e.employeeNumber || "").toLowerCase().includes(q);
  }), [employees, search]);
  const employeePages = usePagination(filteredEmployees);
  const openNew = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };
  const edit = (employee: Employee) => {
    setEditing(employee);
    setDialogOpen(true);
  };
  const remove = (employee: Employee) => {
    if (
      !window.confirm(
        t(
          `Delete ${employee.fullName} from the staff directory?`,
          `هل تريد حذف ${employee.fullName} من سجل الموظفين؟`,
        ),
      )
    )
      return;
    deletion.mutate(
      { id: employee.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetEmployeesQueryKey(),
          });
          setToast(t("Employee record deleted", "تم حذف سجل الموظف"));
        },
      },
    );
  };
  return (
    <div className="rise-in" dir={t("ltr", "rtl")}>
      <PageHeading
        eyebrow="Employees · 02"
        eyebrowAr="الموظفون · ٠٢"
        title="Employees"
        arabic="الموظفون"
        description={t(
          "The staff behind the school day — administration, operations and support.",
          "الفريق خلف اليوم الدراسي — الإدارة والتشغيل والدعم.",
        )}
        action={
          <div className="flex items-center gap-2">
            <ExportMenu entityType="employees" data={employees} t={t} />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => downloadTemplate("employees")}
              data-testid="button-template-employees"
            >
              <FileSpreadsheet size={14} /> {t("Template", "القالب")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setImportOpen(true)}
              data-testid="button-import-employees"
            >
              <Upload size={14} /> {t("Import", "استيراد")}
            </Button>
            <Button
              onClick={openNew}
              className="h-11 rounded-lg bg-[#263064] px-5 text-[#FCFBF0] hover:bg-[#263064]/85"
              data-testid="button-add-employee"
            >
              <Plus size={17} /> {t("Add employee", "إضافة موظف")}
            </Button>
          </div>
        }
      />
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:max-w-md">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t(
              "Search by name or job title",
              "ابحث بالاسم أو المسمى الوظيفي",
            )}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            data-testid="input-search-employees"
          />
        </div>
        <button
          onClick={() => query.refetch()}
          className="h-fit rounded-lg border border-border bg-card px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          data-testid="button-refresh-employees"
          aria-label={t("Refresh employees", "تحديث الموظفين")}
        >
          <RefreshCw
            size={16}
            className={query.isFetching ? "animate-spin" : ""}
          />
        </button>
      </div>
      {toast && (
        <div
          className="mb-4 flex items-center gap-2 rounded-lg border border-[#32B77E]/35 bg-[#32B77E]/10 px-4 py-3 text-sm text-[#32B77E] rise-in"
          data-testid="status-employee-action"
        >
          <Check size={16} />
          {toast}
          <button
            className="ml-auto text-[#32B77E]/60 hover:text-[#32B77E]"
            onClick={() => setToast("")}
            data-testid="button-dismiss-employee-toast"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {query.isLoading ? (
        <LoadingCards count={3} />
      ) : query.isError ? (
        <ErrorState
          label="employees"
          labelAr="الموظفون"
          onRetry={() => query.refetch()}
        />
      ) : !employees.length ? (
        <EmptyState
          icon={Briefcase}
          title={
            search
              ? t(
                  "No employees match this view",
                  "لا يوجد موظفون يطابقون هذا البحث",
                )
              : t("The staff directory is quiet", "سجل الموظفين فارغ")
          }
          detail={
            search
              ? t(
                  "Try another search term or clear the filters.",
                  "جرّب مصطلح بحث آخر أو امسح عوامل التصفية.",
                )
              : t(
                  "When employee records are added, they will live here with their roles and contact details.",
                  "عند إضافة سجلات الموظفين، ستظهر هنا مع وظائفهم وبيانات التواصل.",
                )
          }
          action={
            !search ? (
              <Button onClick={openNew} data-testid="button-empty-add-employee">
                <Plus size={15} /> {t("Add employee", "إضافة موظف")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card soft-shadow">
          <div className="grid min-w-[900px] grid-cols-[2fr_.9fr_1fr_1.15fr_1fr_.7fr_88px] border-b border-border bg-[#263064]/5 px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
            <span>{t("Employee", "الموظف")}</span>
            <span className="text-center">
              {t("Employee No", "الرقم الوظيفي")}
            </span>
            <span>{t("Job title", "المسمى الوظيفي")}</span>
            <span className="text-center">
              {t("National ID", "الهوية الوطنية")}
            </span>
            <span className="text-center">{t("Phone", "الهاتف")}</span>
            <span className="text-center">{t("Status", "الحالة")}</span>
            <span />
          </div>
          {employeePages.pageItems.map((employee) => (
            <EmployeeRow
              key={employee.id}
              employee={employee}
              onEdit={edit}
              onDelete={remove}
            />
          ))}
        </div>
      )}
      <Pagination
        page={employeePages.page}
        pageCount={employeePages.pageCount}
        totalItems={employeePages.totalItems}
        pageSize={employeePages.pageSize}
        onPageChange={employeePages.setPage}
        onPageSizeChange={employeePages.setPageSize}
      />
      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={setToast}
      />
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entityType="employees"
        t={t}
        onImport={async (rows) => {
          for (const row of rows) {
            await new Promise<void>((resolve) => {
              createEmployee.mutate(
                { data: row as any },
                { onSuccess: () => resolve(), onError: () => resolve() },
              );
            });
          }
          queryClient.invalidateQueries({ queryKey: getGetEmployeesQueryKey() });
          setToast(t(`${rows.length} employees imported`, `تم استيراد ${rows.length} موظف`));
        }}
      />
    </div>
  );
}

function TeachersPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | undefined>();
  const [toast, setToast] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const { t } = useT();
  const query = useGetTeachers(
    { search: search || undefined },
    {
      query: {
        queryKey: getGetTeachersQueryKey({ search: search || undefined }),
      },
    },
  );
  const deletion = useDeleteTeacher();
  const createTeacher = useCreateTeacher();
  const queryClient = useQueryClient();
  const teachers = Array.isArray(query.data) ? query.data : [];
  const filteredTeachers = useMemo(() => teachers.filter((te) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (te.fullName || "").toLowerCase().includes(q) || (te.fullNameArabic || "").toLowerCase().includes(q) || (te.subject || "").toLowerCase().includes(q) || (te.employeeNumber || "").toLowerCase().includes(q);
  }), [teachers, search]);
  const teacherPages = usePagination(filteredTeachers);
  const openNew = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };
  const edit = (teacher: Teacher) => {
    setEditing(teacher);
    setDialogOpen(true);
  };
  const remove = (teacher: Teacher) => {
    if (
      !window.confirm(
        t(
          `Delete ${teacher.fullName} from the faculty directory?`,
          `هل تريد حذف ${teacher.fullName} من دليل هيئة التدريس؟`,
        ),
      )
    )
      return;
    deletion.mutate(
      { id: teacher.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTeachersQueryKey() });
          setToast(t("Teacher record deleted", "تم حذف سجل المعلم"));
        },
      },
    );
  };
  return (
    <div className="rise-in" dir={t("ltr", "rtl")}>
      <PageHeading
        eyebrow="Employees · 02 · Teachers"
        eyebrowAr="الموظفون · ٠٢ · المعلمون"
        title="Teachers"
        arabic="المعلمون"
        description={t(
          "The faculty directory, arranged for quick context before the next conversation.",
          "دليل هيئة التدريس، مرتبة لسياق سريع قبل المحادثة القادمة.",
        )}
        action={
          <div className="flex items-center gap-2">
            <ExportMenu entityType="teachers" data={teachers} t={t} />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => downloadTemplate("teachers")}
              data-testid="button-template-teachers"
            >
              <FileSpreadsheet size={14} /> {t("Template", "القالب")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setImportOpen(true)}
              data-testid="button-import-teachers"
            >
              <Upload size={14} /> {t("Import", "استيراد")}
            </Button>
            <Button
              onClick={openNew}
              className="h-11 rounded-lg bg-[#263064] px-5 text-[#FCFBF0] hover:bg-[#263064]/85"
              data-testid="button-add-teacher"
            >
              <Plus size={17} /> {t("Add teacher", "إضافة معلم")}
            </Button>
          </div>
        }
      />
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:max-w-md">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t(
              "Search by name or subject",
              "ابحث بالاسم أو المادة",
            )}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            data-testid="input-search-teachers"
          />
        </div>
        <button
          onClick={() => query.refetch()}
          className="h-fit rounded-lg border border-border bg-card px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          data-testid="button-refresh-teachers"
          aria-label={t("Refresh teachers", "تحديث المعلمين")}
        >
          <RefreshCw
            size={16}
            className={query.isFetching ? "animate-spin" : ""}
          />
        </button>
      </div>
      {toast && (
        <div
          className="mb-4 flex items-center gap-2 rounded-lg border border-[#32B77E]/35 bg-[#32B77E]/10 px-4 py-3 text-sm text-[#32B77E] rise-in"
          data-testid="status-teacher-action"
        >
          <Check size={16} />
          {toast}
          <button
            className="ml-auto text-[#32B77E]/60 hover:text-[#32B77E]"
            onClick={() => setToast("")}
            data-testid="button-dismiss-teacher-toast"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {query.isLoading ? (
        <LoadingCards count={3} />
      ) : query.isError ? (
        <ErrorState
          label="teachers"
          labelAr="المعلمون"
          onRetry={() => query.refetch()}
        />
      ) : !teachers.length ? (
        <EmptyState
          icon={UsersRound}
          title={
            search
              ? t(
                  "No teachers match this view",
                  "لا يوجد معلمون يطابقون هذا البحث",
                )
              : t("The faculty directory is quiet", "دليل هيئة التدريس فارغ")
          }
          detail={
            search
              ? t(
                  "Try another search term or clear the filters.",
                  "جرّب مصطلح بحث آخر أو امسح عوامل التصفية.",
                )
              : t(
                  "When teacher records are added, they will live here with their subjects and contact details.",
                  "عند إضافة سجلات المعلمين، ستظهر هنا مع موادهم وبيانات التواصل.",
                )
          }
          action={
            !search ? (
              <Button onClick={openNew} data-testid="button-empty-add-teacher">
                <Plus size={15} /> {t("Add teacher", "إضافة معلم")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card soft-shadow">
          <div className="grid min-w-[900px] grid-cols-[2fr_.9fr_1fr_1.15fr_1fr_.7fr_88px] border-b border-border bg-[#263064]/5 px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
            <span>{t("Teacher", "المعلم")}</span>
            <span className="text-center">
              {t("Employee No", "الرقم الوظيفي")}
            </span>
            <span>{t("Subject", "المادة")}</span>
            <span className="text-center">
              {t("National ID", "الهوية الوطنية")}
            </span>
            <span className="text-center">{t("Phone", "الهاتف")}</span>
            <span className="text-center">{t("Status", "الحالة")}</span>
            <span />
          </div>
          {teacherPages.pageItems.map((teacher) => (
            <TeacherRow
              key={teacher.id}
              teacher={teacher}
              onEdit={edit}
              onDelete={remove}
            />
          ))}
        </div>
      )}
      <Pagination
        page={teacherPages.page}
        pageCount={teacherPages.pageCount}
        totalItems={teacherPages.totalItems}
        pageSize={teacherPages.pageSize}
        onPageChange={teacherPages.setPage}
        onPageSizeChange={teacherPages.setPageSize}
      />
      <TeacherDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={setToast}
      />
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entityType="teachers"
        t={t}
        onImport={async (rows) => {
          for (const row of rows) {
            await new Promise<void>((resolve) => {
              createTeacher.mutate(
                { data: row as any },
                { onSuccess: () => resolve(), onError: () => resolve() },
              );
            });
          }
          queryClient.invalidateQueries({ queryKey: getGetTeachersQueryKey() });
          setToast(t(`${rows.length} teachers imported`, `تم استيراد ${rows.length} معلم`));
        }}
      />
    </div>
  );
}

type BookFormValue = Omit<Partial<BookInput>, "copies"> & {
  copies?: string | number;
  customCategory?: string;
};

function BookDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
  presetBarcode,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Book;
  onSaved: (message: string) => void;
  presetBarcode?: string;
  categories: string[];
}) {
  const today = () => new Date().toISOString().slice(0, 10);
  const blankBook: BookFormValue = {
    title: "",
    author: "",
    isbn: presetBarcode ?? "",
    category: "",
    language: "Arabic",
    copies: "1",
    status: "available",
    dateAdded: today(),
  };
  const [form, setForm] = useState<BookFormValue>(blankBook);
  useEffect(() => {
    if (!open) return;
    if (editing)
      setForm({
        ...editing,
        copies: String(editing.copies),
        dateAdded:
          typeof editing.dateAdded === "string"
            ? editing.dateAdded.slice(0, 10)
            : today(),
      });
    else setForm(blankBook);
  }, [open, editing, presetBarcode]);
  const create = useCreateBook();
  const update = useUpdateBook();
  const queryClient = useQueryClient();
  const isEditing = Boolean(editing);
  const set = (key: string, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!String(form.title ?? "").trim()) return;
    const text = (key: keyof BookInput & string) => {
      const v = String(form[key] ?? "").trim();
      return v ? { [key]: v } : {};
    };
    const data: BookInput = {
      title: String(form.title).trim(),
      ...text("author"),
      ...text("isbn"),
      ...text("category"),
      ...(String(form.customCategory ?? "").trim()
        ? { category: String(form.customCategory).trim() }
        : {}),
      ...(form.language ? { language: form.language } : {}),
      ...text("volume"),
      ...(String(form.copies ?? "").trim() !== "" && Number(form.copies) >= 0
        ? { copies: Number(form.copies) }
        : {}),
      ...(form.status ? { status: form.status } : {}),
      ...(String(form.dateAdded ?? "").trim() !== ""
        ? {
            dateAdded: new Date(String(form.dateAdded))
              .toISOString()
              .slice(0, 10),
          }
        : {}),
      ...text("depositNumber"),
      ...text("publicationPlace"),
      ...text("publicationDate"),
      ...text("generalNumber"),
      ...text("specialNumber"),
      ...text("description"),
      ...text("coverImage"),
      ...text("shelf"),
    };
    const done = () => {
      queryClient.invalidateQueries({ queryKey: getGetBooksQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getGetDashboardSummaryQueryKey(),
      });
      onOpenChange(false);
      onSaved(
        isEditing
          ? t("Book record updated", "تم تحديث بيانات الكتاب")
          : t("Book added to the catalogue", "تمت إضافة الكتاب إلى الفهرس"),
      );
    };
    if (isEditing && editing)
      update.mutate({ id: editing.id, data }, { onSuccess: done });
    else create.mutate({ data }, { onSuccess: done });
  };
  const pending = create.isPending || update.isPending;
  const saveError = create.isError || update.isError;
  const { t } = useT();
  const inputCls =
    "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/10";
  const sections: {
    title: string;
    titleAr: string;
    fields: {
      key: (keyof BookInput & string) | "customCategory";
      label: string;
      arabic: string;
      placeholder?: string;
      type?: string;
      required?: boolean;
      options?: [string, string, string][];
    }[];
  }[] = [
    {
      title: "Catalogue",
      titleAr: "بيانات الفهرسة",
      fields: [
        {
          key: "title",
          label: "Title",
          arabic: "عنوان الكتاب",
          required: true,
        },
        { key: "author", label: "Author", arabic: "المؤلف" },
        {
          key: "isbn",
          label: "Barcode / ISBN",
          arabic: "الباركود",
          placeholder: "Scan or type the barcode",
        },
        {
          key: "category",
          label: "Category",
          arabic: "التصنيف",
          options: categories.map(
            (category) =>
              [category, category, category] as [string, string, string],
          ),
        },
        {
          key: "customCategory",
          label: "New category",
          arabic: "تصنيف جديد",
          placeholder: "Type a new category",
        },
        {
          key: "language",
          label: "Language",
          arabic: "اللغة",
          options: [
            ["Arabic", "Arabic", "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"],
            [
              "English",
              "English",
              "\u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629",
            ],
            [
              "French",
              "French",
              "\u0627\u0644\u0641\u0631\u0646\u0633\u064A\u0629",
            ],
          ],
        },
        { key: "volume", label: "Volume", arabic: "المجلد" },
        { key: "shelf", label: "Shelf", arabic: "الرف" },
      ],
    },
    {
      title: "Copies & status",
      titleAr: "النسخ والحالة",
      fields: [
        { key: "copies", label: "Copies", arabic: "عدد النسخ", type: "number" },
        {
          key: "status",
          label: "Status",
          arabic: "الحالة",
          options: [
            ["available", "Available", "\u0645\u062A\u0627\u062D"],
            ["borrowed", "Borrowed", "\u0645\u0633\u062A\u0639\u0627\u0631"],
            ["lost", "Lost", "\u0645\u0641\u0642\u0648\u062F"],
            ["damaged", "Damaged", "\u062A\u0627\u0644\u0641"],
          ],
        },
        {
          key: "dateAdded",
          label: "Date added",
          arabic: "تاريخ الإضافة",
          type: "date",
        },
      ],
    },
    {
      title: "Publication",
      titleAr: "بيانات النشر",
      fields: [
        {
          key: "publicationPlace",
          label: "Publication place",
          arabic: "مكان النشر",
        },
        {
          key: "publicationDate",
          label: "Publication date",
          arabic: "تاريخ النشر",
          placeholder: "1995 or 1995-03-01",
        },
        {
          key: "depositNumber",
          label: "Deposit number",
          arabic: "رقم الإيداع",
        },
        {
          key: "generalNumber",
          label: "General number",
          arabic: "الرقم العام",
        },
        {
          key: "specialNumber",
          label: "Special number",
          arabic: "الرقم الخاص",
        },
      ],
    },
    {
      title: "Details",
      titleAr: "تفاصيل إضافية",
      fields: [
        { key: "description", label: "Description", arabic: "الوصف" },
        {
          key: "coverImage",
          label: "Cover image URL",
          arabic: "رابط صورة الغلاف",
          type: "url",
        },
      ],
    },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-3xl overflow-y-auto border-border bg-[#FCFBF0] p-0">
        <form onSubmit={submit}>
          <DialogHeader className="border-b border-border bg-card px-6 py-5 text-left">
            <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
              {t(
                "Library catalogue",
                "\u0641\u0647\u0631\u0633\u0020\u0627\u0644\u0645\u0643\u062A\u0628\u0629",
              )}
            </div>
            <DialogTitle className="mt-1 text-2xl text-[#263064]">
              {t(
                isEditing ? "Update book" : "Add a book",
                isEditing
                  ? "\u062A\u062D\u062F\u064A\u062B\u0020\u0628\u064A\u0627\u0646\u0627\u062A\u0020\u0627\u0644\u0643\u062A\u0627\u0628"
                  : "\u0625\u0636\u0627\u0641\u0629\u0020\u0643\u062A\u0627\u0628",
              )}
            </DialogTitle>
            <DialogDescription className="mt-1">
              {t(
                isEditing
                  ? "Keep this record in step with the shelves."
                  : "Give the library a useful new reference.",
                isEditing
                  ? "\u062D\u0627\u0641\u0638\u0020\u0639\u0644\u0649\u0020\u0645\u0637\u0627\u0628\u0642\u0629\u0020\u0647\u0630\u0627\u0020\u0627\u0644\u0633\u062C\u0644\u0020\u0644\u0644\u0631\u0641\u0648\u0641\u002E"
                  : "\u0623\u0637\u0644\u0639\u0020\u0627\u0644\u0645\u0643\u062A\u0628\u0629\u0020\u0639\u0644\u0649\u0020\u0645\u0631\u062C\u0639\u0020\u062C\u062F\u064A\u062F\u0020\u0645\u0641\u064A\u062F\u002E",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 px-6 py-6">
            {sections.map((section) => (
              <fieldset
                key={section.title}
                className="rounded-xl border border-border bg-card/60 p-4"
              >
                <legend className="ar px-2 text-[11px] font-bold uppercase tracking-[.14em] text-primary">
                  {t(section.title, section.titleAr)}
                </legend>
                <div className="grid gap-4 sm:grid-cols-3">
                  {section.fields.map((field) => (
                    <label className="block" key={field.key}>
                      <span className="mb-1.5 flex items-baseline justify-between text-xs font-semibold text-[#263064]">
                        <span>
                          {field.required
                            ? `${t(field.label, field.arabic)} *`
                            : t(field.label, field.arabic)}
                        </span>
                        <span
                          className={`text-[9px] font-normal text-muted-foreground ${t("ar", "en") === "ar" ? "" : "ar"}`}
                        >
                          {t(field.arabic, field.label)}
                        </span>
                      </span>
                      {field.options ? (
                        <select
                          value={String(form[field.key] ?? "")}
                          onChange={(event) =>
                            set(field.key, event.target.value)
                          }
                          className={`${inputCls} cursor-pointer appearance-none`}
                          data-testid={`input-book-${field.key}`}
                        >
                          {field.options.map(([value, label, ar]) => (
                            <option key={value} value={value}>
                              {t(label, ar)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          required={field.key === "title"}
                          type={field.type ?? "text"}
                          min={field.type === "number" ? 0 : undefined}
                          value={String(form[field.key] ?? "")}
                          onChange={(event) =>
                            set(field.key, event.target.value)
                          }
                          placeholder={field.placeholder}
                          className={inputCls}
                          dir={
                            ["isbn", "coverImage"].includes(field.key) ||
                            field.type === "date"
                              ? "ltr"
                              : undefined
                          }
                          data-testid={`input-book-${field.key}`}
                        />
                      )}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          {saveError && (
            <div
              className="mx-6 mb-4 rounded-lg border border-destructive/30 bg-[#B92327]/10 px-4 py-3 text-sm text-destructive"
              data-testid="error-book-dialog"
            >
              {t(
                "Could not save this book. Please check the details and try again.",
                "\u062A\u0639\u0630\u0631\u0020\u062D\u0641\u0638\u0020\u0647\u0630\u0627\u0020\u0627\u0644\u0643\u062A\u0627\u0628\u002E\u0020\u062A\u062D\u0642\u0642\u0020\u0645\u0646\u0020\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A\u0020\u0648\u062D\u0627\u0648\u0644\u0020\u0645\u0631\u0629\u0020\u0623\u062E\u0631\u0649\u002E",
              )}
            </div>
          )}
          <DialogFooter className="border-t border-border bg-card px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-book"
            >
              {t("Cancel", "\u0625\u0644\u063A\u0627\u0621")}
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-[#263064] text-[#FCFBF0] hover:bg-[#263064]/85"
              data-testid="button-save-book"
            >
              {pending
                ? t(
                    "Saving…",
                    "\u062C\u0627\u0631\u064D\u0020\u0627\u0644\u062D\u0641\u0638\u2026",
                  )
                : isEditing
                  ? t(
                      "Save changes",
                      "\u062D\u0641\u0638\u0020\u0627\u0644\u062A\u063A\u064A\u064A\u0631\u0627\u062A",
                    )
                  : t(
                      "Add book",
                      "\u0625\u0636\u0627\u0641\u0629\u0020\u0643\u062A\u0627\u0628",
                    )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function BorrowDialog({
  open,
  onOpenChange,
  book,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book?: Book;
  onSaved: (message: string) => void;
}) {
  const { t } = useT();
  const dueDefault = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().slice(0, 10);
  }, []);
  const [borrowerType, setBorrowerType] = useState<
    "student" | "teacher" | "employee"
  >("student");
  const [borrowerId, setBorrowerId] = useState("");
  const [dueDate, setDueDate] = useState(dueDefault);
  useEffect(() => {
    if (open) {
      setBorrowerType("student");
      setBorrowerId("");
      setDueDate(dueDefault);
    }
  }, [open, dueDefault]);
  const studentsQuery = useGetStudents(undefined, {
    query: { queryKey: getGetStudentsQueryKey(undefined) },
  });
  const students = Array.isArray(studentsQuery.data) ? studentsQuery.data : [];
  const teachersQuery = useGetTeachers(undefined, {
    query: { queryKey: getGetTeachersQueryKey(undefined) },
  });
  const teachers = Array.isArray(teachersQuery.data) ? teachersQuery.data : [];
  const employeesQuery = useGetEmployees(undefined, {
    query: { queryKey: getGetEmployeesQueryKey(undefined) },
  });
  const employees = Array.isArray(employeesQuery.data)
    ? employeesQuery.data
    : [];
  const borrowsQuery = useGetBorrows({ active: true }, {
    query: { queryKey: getGetBorrowsQueryKey({ active: true }) },
  });
  const create = useCreateBorrow();
  const queryClient = useQueryClient();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!book || !borrowerId) return;
    create.mutate(
      {
        data: {
          bookId: book.id,
          borrowerType,
          borrowerId: Number(borrowerId),
          dueDate,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBooksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetBorrowsQueryKey() });
          onOpenChange(false);
          onSaved(t("Borrow recorded", "تم تسجيل الاستعارة"));
        },
      },
    );
  };
  const borrowerOptions = (
    borrowerType === "student"
      ? students
      : borrowerType === "teacher"
        ? teachers
        : employees
  ).filter((borrower) => !borrowsQuery.data?.some(
    (borrow) => borrow.bookId === book?.id && borrow.borrowerType === borrowerType && borrow.borrowerId === borrower.id,
  ));
  const borrowerLabel =
    borrowerType === "student"
      ? t("Student", "الطالب")
      : borrowerType === "teacher"
        ? t("Teacher", "المعلم")
        : t("Employee", "الموظف");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-[#FCFBF0] p-0">
        <form onSubmit={submit}>
          <DialogHeader className="border-b border-border bg-card px-6 py-5 text-left">
            <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
              {t("Library lending", "إعارات المكتبة")}
            </div>
            <DialogTitle className="mt-1 text-2xl text-[#263064]">
              {t("Borrow this book", "استعارة الكتاب")}
            </DialogTitle>
            <DialogDescription className="mt-1">
              {book
                ? `${book.title}${(book.availableCopies ?? 0) > 0 ? ` · ${book.availableCopies ?? 0}/${book.copies} ${t("available", "متاح")}` : ""}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-6 py-6">
            <label className="grid gap-1.5 text-left">
              <span className="text-xs font-semibold text-[#263064]">{t("Borrower type", "نوع المستعير")} *</span>
              <select value={borrowerType} onChange={(event) => { setBorrowerType(event.target.value as typeof borrowerType); setBorrowerId(""); }} className="h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" data-testid="select-borrower-type">
                <option value="student">{t("Student", "الطالب")}</option>
                <option value="teacher">{t("Teacher", "المعلم")}</option>
                <option value="employee">{t("Employee", "الموظف")}</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-left">
              <span className="text-xs font-semibold text-[#263064]">
                {borrowerLabel} *
              </span>
              <select
                required
                value={borrowerId}
                onChange={(event) => setBorrowerId(event.target.value)}
                className="h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                data-testid="input-borrower"
              >
                <option value="">
                  {borrowerOptions.length ? t("Choose a borrower…", "اختر مستعيرًا…") : t("No borrowers registered yet", "لا يوجد مستعيرون مسجلون بعد")}
                </option>
                {borrowerOptions.map((borrower) => (
                  <option value={borrower.id} key={borrower.id}>
                    {borrower.fullName}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-left">
              <span className="text-xs font-semibold text-[#263064]">
                {t("Return by", "موعد الإرجاع")} *
              </span>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="h-10 rounded-lg border border-input bg-card px-3 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                data-testid="input-borrow-dueDate"
              />
            </label>
          </div>
          {create.isError && (
            <div
              className="mx-6 mb-4 rounded-lg border border-destructive/30 bg-[#B92327]/10 px-4 py-3 text-sm text-destructive"
              data-testid="error-borrow-dialog"
            >
              {create.error instanceof Error &&
              create.error.message.includes("available")
                ? t(
                    "No copies of this book are currently available.",
                    "لا توجد نسخ متاحة من هذا الكتاب حاليًا.",
                  )
                : t(
                    "Could not record the borrow. Please try again.",
                    "تعذر تسجيل الاستعارة. حاول مرة أخرى.",
                  )}
            </div>
          )}
          <DialogFooter className="border-t border-border bg-card px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-lg px-4"
              data-testid="button-cancel-borrow"
            >
              {t("Cancel", "إلغاء")}
            </Button>
            <Button
              type="submit"
              disabled={create.isPending}
              className="h-10 rounded-lg bg-[#263064] px-4 text-[#FCFBF0] hover:bg-[#263064]/85"
              data-testid="button-save-borrow"
            >
              {create.isPending
                ? t("Saving…", "جارٍ الحفظ…")
                : t("Record borrow", "تسجيل الاستعارة")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LibraryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Book | undefined>();
  const [borrowing, setBorrowing] = useState<Book>();
  const [toast, setToast] = useState("");
  const [scan, setScan] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState<
    | { status: "found"; book: Book }
    | { status: "missing"; code: string }
    | undefined
  >();
  const [presetBarcode, setPresetBarcode] = useState<string | undefined>();
  const [scannerAt, setScannerAt] = useState<Date | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  useEffect(() => {
    let stamps: number[] = [];
    const onKey = (event: KeyboardEvent) => {
      const now = Date.now();
      if (event.key === "Enter") {
        if (
          stamps.length >= 4 &&
          now - stamps[stamps.length - 1] < 120 &&
          stamps.every(
            (stamp, index) => index === 0 || stamp - stamps[index - 1] < 60,
          )
        )
          setScannerAt(new Date());
        stamps = [];
        return;
      }
      if (event.key.length === 1) {
        stamps = stamps.filter((stamp) => now - stamp < 1000);
        stamps.push(now);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const { t } = useT();
  const query = useGetBooks(
    { search: search || undefined, category: category || undefined },
    {
      query: {
        queryKey: getGetBooksQueryKey({
          search: search || undefined,
          category: category || undefined,
        }),
      },
    },
  );
  const deletion = useDeleteBook();
  const createBook = useCreateBook();
  const borrowsQuery = useGetBorrows(
    { active: true },
    { query: { queryKey: getGetBorrowsQueryKey({ active: true }) } },
  );
  const returnBorrow = useReturnBorrow();
  const queryClient = useQueryClient();
  const books = Array.isArray(query.data) ? query.data : [];
  const borrows = Array.isArray(borrowsQuery.data) ? borrowsQuery.data : [];
  const borrowPages = usePagination(borrows);
  const bookPages = usePagination(books);
  const categories = useMemo(
    () =>
      Array.from(new Set(books.map((book) => book.category).filter(Boolean))),
    [books],
  );
  const openNew = () => {
    setPresetBarcode(undefined);
    setEditing(undefined);
    setDialogOpen(true);
  };
  const edit = (book: Book) => {
    setEditing(book);
    setDialogOpen(true);
  };
  const remove = (book: Book) => {
    if (
      !window.confirm(
        t(
          `Delete “${book.title}” from the catalogue?`,
          `هل تريد حذف "${book.title}" من الفهرس؟`,
        ),
      )
    )
      return;
    deletion.mutate(
      { id: book.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBooksQueryKey() });
          setScanned(undefined);
          setToast(
            t("Book removed from the catalogue", "تم حذف الكتاب من الفهرس"),
          );
        },
      },
    );
  };
  const scannedBook = scanned?.status === "found" ? scanned.book : undefined;
  const handleScan = async (event: FormEvent) => {
    event.preventDefault();
    const code = scan.trim();
    if (!code || scanning) return;
    setScanning(true);
    try {
      const results = await getBooks({ search: code });
      const match = results.find((book) => (book.isbn || "").trim() === code);
      if (match) setScanned({ status: "found", book: match });
      else setScanned({ status: "missing", code });
    } catch {
      setScanned({ status: "missing", code });
    } finally {
      setScanning(false);
      setScan("");
    }
  };
  return (
    <div className="rise-in" dir={t("ltr", "rtl")}>
      <PageHeading
        eyebrow="Resources · 04"
        eyebrowAr="المصادر · ٠٤"
        title="Library"
        arabic="المكتبة"
        description={t(
          "A living catalogue for the stories, references and discoveries on every shelf.",
          "فهرس حيّ للقصص والمراجع والاكتشافات على كل رف.",
        )}
        action={
          <div className="flex items-center gap-2">
            <ExportMenu entityType="books" data={books} t={t} />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => downloadTemplate("books")}
              data-testid="button-template-books"
            >
              <FileSpreadsheet size={14} /> {t("Template", "القالب")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setImportOpen(true)}
              data-testid="button-import-books"
            >
              <Upload size={14} /> {t("Import", "استيراد")}
            </Button>
            <Button
              onClick={openNew}
              className="h-11 rounded-lg bg-[#263064] px-5 text-[#FCFBF0] hover:bg-[#263064]/85"
              data-testid="button-add-book"
            >
              <Plus size={17} /> {t("Add book", "إضافة كتاب")}
            </Button>
          </div>
        }
      />
      <form
        onSubmit={handleScan}
        className="mb-5 flex flex-col gap-2 rounded-xl border border-[#DBB46C]/50 bg-gradient-to-l from-[#FCFBF0] to-[#DBB46C]/15 p-4 sm:flex-row sm:items-center"
        data-testid="form-scan-barcode"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#263064] text-[#DBB46C]">
          <Barcode size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[.14em] text-[#EC9F42]">
              {t("Scanner station", "محطة الماسح الضوئي")}
            </span>
            <span
              className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${scannerAt ? "bg-[#32B77E]/15 text-[#32B77E]" : "bg-muted text-muted-foreground"}`}
              data-testid="status-scanner"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${scannerAt ? "animate-pulse bg-[#32B77E]" : "bg-muted-foreground/50"}`}
                data-testid="status-scanner-dot"
              />
              <span data-testid="status-scanner-text">
                {scannerAt
                  ? `${t("Connected", "متصل")} · ${scannerAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : t("Not detected", "غير مكتشف")}
              </span>
            </span>
          </div>
          <input
            autoFocus
            value={scan}
            onChange={(event) => setScan(event.target.value)}
            placeholder={t(
              "Scan a book barcode, then press Enter…",
              "امسح باركود الكتاب ثم اضغط Enter…",
            )}
            className="mt-1 h-10 w-full rounded-lg border border-input bg-card px-3 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            data-testid="input-scan-barcode"
          />
        </div>
        {scanning && (
          <span className="text-xs text-muted-foreground">
            {t("Looking up…", "جارٍ البحث…")}
          </span>
        )}
      </form>
      {scanned &&
        (scanned.status === "found" ? (
          <div
            className="mb-5 flex flex-col gap-4 rounded-xl border border-[#32B77E]/35 bg-[#32B77E]/10 p-4 sm:flex-row sm:items-center rise-in"
            data-testid={`panel-scanned-book-${scanned.book.id}`}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#DBB46C]/20 text-[#EC9F42]">
              <BookOpen size={22} strokeWidth={1.7} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="line-clamp-1 text-sm font-bold text-[#263064]">
                {scanned.book.title}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {scanned.book.author} · {t("Shelf", "الرف")}{" "}
                {scanned.book.shelf || "—"} ·{" "}
                <span className="font-mono">
                  {scanned.book.availableCopies ?? scanned.book.copies}/
                  {scanned.book.copies}
                </span>{" "}
                {t("available", "متاح")} ·{" "}
                <span className="font-mono" dir="ltr">
                  {scanned.book.isbn}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                onClick={() => {
                  if (scannedBook) setBorrowing(scannedBook);
                }}
                disabled={!(scanned.book.availableCopies > 0)}
                className="h-9 bg-[#32B77E] px-3 text-xs hover:bg-[#32B77E]/80 disabled:opacity-50"
                data-testid="button-scanned-borrow"
              >
                <UsersRound size={14} /> {t("Borrow", "إعارة")}
              </Button>
              <Button
                onClick={() => {
                  if (scannedBook) edit(scannedBook);
                }}
                className="h-9 bg-[#263064] px-3 text-xs text-[#FCFBF0] hover:bg-[#263064]/85"
                data-testid="button-scanned-edit"
              >
                <Pencil size={14} /> {t("Edit record", "تعديل السجل")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (scannedBook) remove(scannedBook);
                }}
                className="h-9 border-destructive/30 px-3 text-xs text-destructive hover:bg-[#B92327]/10"
                data-testid="button-scanned-delete"
              >
                <Trash2 size={14} /> {t("Remove", "حذف")}
              </Button>
              <button
                onClick={() => setScanned(undefined)}
                className="rounded-md p-2 text-muted-foreground hover:text-primary"
                data-testid="button-scanned-dismiss"
                aria-label={t("Dismiss", "إغلاق")}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div
            className="mb-5 flex flex-col gap-3 rounded-xl border border-destructive/25 bg-[#B92327]/5 p-4 sm:flex-row sm:items-center rise-in"
            data-testid="panel-scanned-missing"
          >
            <AlertTriangle size={20} className="shrink-0 text-destructive" />
            <div className="min-w-0 flex-1 text-sm text-[#B92327]">
              {t(
                "No book carries this barcode yet.",
                "لا يوجد كتاب يحمل هذا الباركود بعد.",
              )}{" "}
              <span className="font-mono" dir="ltr">
                {scanned.status === "missing" ? scanned.code : ""}
              </span>
            </div>
            <Button
              onClick={() => {
                setPresetBarcode(
                  scanned.status === "missing" ? scanned.code : undefined,
                );
                setEditing(undefined);
                setDialogOpen(true);
              }}
              className="h-9 shrink-0 bg-[#263064] px-3 text-xs hover:bg-[#263064]/85"
              data-testid="button-scan-add-new"
            >
              <Plus size={14} /> {t("Catalogue it now", "أضفه للفهرس الآن")}
            </Button>
            <button
              onClick={() => setScanned(undefined)}
              className="rounded-md p-2 text-muted-foreground hover:text-primary"
              data-testid="button-scanned-dismiss-missing"
              aria-label={t("Dismiss", "إغلاق")}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:max-w-md">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t(
              "Search title, author or barcode",
              "ابحث بالعنوان أو المؤلف أو الباركود",
            )}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            data-testid="input-search-books"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3">
            <SlidersHorizontal size={14} className="text-muted-foreground" />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 bg-transparent text-xs font-medium outline-none"
              data-testid="select-book-category"
            >
              <option value="">
                {t(
                  "All categories",
                  "\u0643\u0644\u0020\u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A",
                )}
              </option>
              {categories.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => query.refetch()}
            className="h-fit rounded-lg border border-border bg-card px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            data-testid="button-refresh-books"
            aria-label={t(
              "Refresh books",
              "\u062A\u062D\u062F\u064A\u062B\u0020\u0627\u0644\u0643\u062A\u0628",
            )}
          >
            <RefreshCw
              size={16}
              className={query.isFetching ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>
      {toast && (
        <div
          className="mb-4 flex items-center gap-2 rounded-lg border border-[#32B77E]/35 bg-[#32B77E]/10 px-4 py-3 text-sm text-[#32B77E]"
          data-testid="status-book-action"
        >
          <Check size={16} />
          {toast}
          <button
            className="ml-auto"
            onClick={() => setToast("")}
            data-testid="button-dismiss-book-toast"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {query.isLoading ? (
        <LoadingCards count={3} />
      ) : query.isError ? (
        <ErrorState
          label="library books"
          labelAr="\u0643\u062A\u0628\u0020\u0627\u0644\u0645\u0643\u062A\u0628\u0629"
          onRetry={() => query.refetch()}
        />
      ) : !books.length ? (
        <EmptyState
          icon={Library}
          title={
            search || category
              ? t(
                  "No books match this view",
                  "\u0644\u0627\u0020\u062A\u0648\u062C\u062F\u0020\u0643\u062A\u0628\u0020\u0645\u0637\u0627\u0628\u0642\u0629\u0020\u0644\u0647\u0630\u0627\u0020\u0627\u0644\u0639\u0631\u0636",
                )
              : t(
                  "The shelves are waiting",
                  "\u0627\u0644\u0631\u0641\u0648\u0641\u0020\u0628\u0627\u0646\u062A\u0638\u0627\u0631\u0643",
                )
          }
          detail={
            search || category
              ? t(
                  "Try another search term or clear the filters.",
                  "\u062C\u0631\u0651\u0628\u0020\u0643\u0644\u0645\u0629\u0020\u0628\u062D\u062B\u0020\u0623\u062E\u0631\u0649\u0020\u0623\u0648\u0020\u0627\u0645\u0633\u062D\u0020\u0639\u0648\u0627\u0645\u0644\u0020\u0627\u0644\u062A\u0635\u0641\u064A\u0629\u002E",
                )
              : t(
                  "Add the first title to give your library a useful beginning.",
                  "\u0623\u0636\u0641\u0020\u0623\u0648\u0644\u0020\u0639\u0646\u0648\u0627\u0646\u0020\u0644\u0628\u062F\u0627\u064A\u0629\u0020\u0645\u0641\u064A\u062F\u0629\u0020\u0644\u0645\u0643\u062A\u0628\u062A\u0643\u002E",
                )
          }
          action={
            !search && !category ? (
              <Button onClick={openNew} data-testid="button-empty-add-book">
                <Plus size={15} />{" "}
                {t(
                  "Add first book",
                  "\u0623\u0636\u0641\u0020\u0623\u0648\u0644\u0020\u0643\u062A\u0627\u0628",
                )}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card soft-shadow">
          <div className="grid min-w-[920px] grid-cols-[2fr_1fr_.75fr_1.25fr_.65fr_1.1fr_88px] border-b border-border bg-[#263064]/5 px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
            <span>{t("Book", "\u0627\u0644\u0643\u062A\u0627\u0628")}</span>
            <span>{t("Author", "\u0627\u0644\u0645\u0624\u0644\u0641")}</span>
            <span className="text-center">
              {t("Language", "\u0627\u0644\u0644\u063A\u0629")}
            </span>
            <span className="text-center">
              {t("Copies", "\u0627\u0644\u0646\u0633\u062E")}
            </span>
            <span className="text-center">{t("Shelf", "الرف")}</span>
            <span className="text-center">{t("Barcode", "الباركود")}</span>
            <span />
          </div>
          {bookPages.pageItems.map((book) => (
            <BookRow
              key={book.id}
              book={book}
              onEdit={edit}
              onDelete={remove}
            />
          ))}
        </div>
      )}
      <Pagination
        page={bookPages.page}
        pageCount={bookPages.pageCount}
        totalItems={bookPages.totalItems}
        pageSize={bookPages.pageSize}
        onPageChange={bookPages.setPage}
        onPageSizeChange={bookPages.setPageSize}
      />
      <BookDialog
        open={dialogOpen}
        onOpenChange={(value) => {
          if (!value) setPresetBarcode(undefined);
          setDialogOpen(value);
        }}
        editing={editing}
        onSaved={setToast}
        presetBarcode={presetBarcode}
        categories={categories as string[]}
      />
      {(() => {
        if (!borrows.length) return null;
        return (
          <section className="mt-6 overflow-hidden rounded-xl border border-border bg-card soft-shadow">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                  {t("Lending desk", "مكتب الإعارة")}
                </div>
                <h2 className="mt-0.5 text-sm font-bold text-[#263064]">
                  {t("Active borrows", "الاستعارات النشطة")}
                </h2>
              </div>
              <span
                className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-primary"
                data-testid="status-active-borrows"
              >
                {borrows.length}
              </span>
            </div>
            {borrowPages.pageItems.map((borrow) => (
              <div
                key={borrow.id}
                className="flex flex-wrap items-center gap-3 border-b border-border/70 px-5 py-3 last:border-b-0 transition-colors hover:bg-secondary/40"
                data-testid={`row-borrow-${borrow.id}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#14BAC6]/10 text-xs font-bold text-[#14BAC6]">
                  <UsersRound size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 text-sm font-semibold text-[#263064]">
                    {borrow.borrowerName}
                  </div>
                  <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {borrow.bookTitle}
                    {borrow.bookBarcode ? (
                      <>
                        {" "}
                        ·{" "}
                        <span className="font-mono" dir="ltr">
                          {borrow.bookBarcode}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
                <div
                  className="text-right text-[11px] text-muted-foreground"
                  dir="ltr"
                >
                  <div>{borrow.borrowedAt ? formatDate(String(borrow.borrowedAt)) : "—"}</div>
                  <div>
                    {t("due", "يُسترجع في")}{" "}
                    {borrow.dueDate
                      ? formatDate(String(borrow.dueDate))
                      : "—"}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    returnBorrow.mutate(
                      { id: borrow.id },
                      {
                        onSuccess: () => {
                          queryClient.invalidateQueries({
                            queryKey: getGetBorrowsQueryKey(),
                          });
                          queryClient.invalidateQueries({
                            queryKey: getGetBooksQueryKey(),
                          });
                          setToast(
                            t(
                              "Book returned to the shelf",
                              "عاد الكتاب إلى الرف",
                            ),
                          );
                        },
                      },
                    )
                  }
                  className="h-8 shrink-0 px-3 text-xs hover:border-[#32B77E] hover:text-[#32B77E]"
                  disabled={
                    returnBorrow.isPending &&
                    returnBorrow.variables?.id === borrow.id
                  }
                  data-testid={`button-return-borrow-${borrow.id}`}
                >
                  {t("Return", "إرجاع")}
                </Button>
              </div>
            ))}
            <Pagination
              page={borrowPages.page}
              pageCount={borrowPages.pageCount}
              totalItems={borrowPages.totalItems}
              pageSize={borrowPages.pageSize}
              onPageChange={borrowPages.setPage}
              onPageSizeChange={borrowPages.setPageSize}
            />
          </section>
        );
      })()}
      <BorrowDialog
        open={Boolean(borrowing)}
        onOpenChange={(value) => {
          if (!value) setBorrowing(undefined);
        }}
        book={borrowing}
        onSaved={setToast}
      />
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entityType="books"
        t={t}
        onImport={async (rows) => {
          for (const row of rows) {
            await new Promise<void>((resolve) => {
              createBook.mutate(
                { data: row as any },
                { onSuccess: () => resolve(), onError: () => resolve() },
              );
            });
          }
          queryClient.invalidateQueries({ queryKey: getGetBooksQueryKey() });
          setToast(t(`${rows.length} books imported`, `تم استيراد ${rows.length} كتاب`));
        }}
      />
    </div>
  );
}

function BookRow({
  book,
  onEdit,
  onDelete,
}: {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
}) {
  const available = book.availableCopies ?? book.copies;
  const percent = book.copies ? Math.round((available / book.copies) * 100) : 0;
  return (
    <div
      className="group grid min-w-[920px] grid-cols-[2fr_1fr_.75fr_1.25fr_.65fr_1.1fr_88px] items-center border-b border-border/70 px-5 py-3 transition-colors hover:bg-secondary/40"
      data-testid={`row-book-${book.id}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#DBB46C]/20 text-[#EC9F42]">
          <BookOpen size={17} strokeWidth={1.7} />
        </div>
        <div>
          <div className="line-clamp-1 text-sm font-semibold text-[#263064]">
            {book.title}
          </div>
          <div className="text-[10px] uppercase tracking-[.12em] text-muted-foreground">
            {book.category}
          </div>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{book.author}</span>
      <span className="w-fit justify-self-center rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-primary">
        {book.language}
      </span>
      <div className="flex items-center justify-center gap-3">
        <div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${percent > 50 ? "bg-primary" : percent ? "bg-accent" : "bg-destructive"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-center font-mono text-xs font-bold text-[#263064]">
          {available}/{book.copies}
        </span>
      </div>
      <span className="text-center text-xs text-muted-foreground">
        {book.shelf ? `Shelf ${book.shelf}` : "—"}
      </span>
      <span
        className="justify-self-center text-center font-mono text-xs text-muted-foreground"
        dir="ltr"
      >
        {book.isbn || "—"}
      </span>
      <div className="flex justify-center gap-1 opacity-40 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => onEdit(book)}
          className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-primary"
          data-testid={`button-edit-book-${book.id}`}
          aria-label={`Edit ${book.title}`}
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(book)}
          className="rounded-md p-2 text-muted-foreground hover:bg-[#B92327]/10 hover:text-destructive"
          data-testid={`button-delete-book-${book.id}`}
          aria-label={`Delete ${book.title}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function DistributionPage() {
  const { t } = useT();
  const query = useGetStudents(undefined, {
    query: { queryKey: getGetStudentsQueryKey(undefined) },
  });
  const students = Array.isArray(query.data) ? query.data : [];
  const groups = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const student of students) {
      const grade = student.grade || "Unassigned";
      const klass = student.className || "—";
      if (!map.has(grade)) map.set(grade, new Map());
      map.get(grade)!.set(klass, (map.get(grade)!.get(klass) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], undefined, { numeric: true }),
    );
  }, [students]);
  const total = students.length;
  const flatRows = useMemo(() => {
    return groups.flatMap(([grade, classes]) =>
      Array.from(classes.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([klass, count]) => ({ grade, klass, count, key: `${grade}-${klass}` }))
    );
  }, [groups]);
  const distPages = usePagination(flatRows);
  return (
    <div className="rise-in">
      <PageHeading
        eyebrow="People · 03 · Distribution"
        title="Student distribution"
        arabic="توزيع الطلاب"
        description="How learners are spread across grades and classes this academic year."
      />
      {query.isLoading ? (
        <LoadingCards />
      ) : query.isError ? (
        <ErrorState
          label="student distribution"
          labelAr="\u062A\u0648\u0632\u064A\u0639\u0020\u0627\u0644\u0637\u0644\u0627\u0628"
          onRetry={() => query.refetch()}
        />
      ) : !total ? (
        <EmptyState
          icon={GraduationCap}
          title={t(
            "No students to distribute yet",
            "\u0644\u0627\u0020\u064A\u0648\u062C\u062F\u0020\u0637\u0644\u0627\u0628\u0020\u0644\u0644\u062A\u0648\u0632\u064A\u0639\u0020\u0628\u0639\u062F",
          )}
          detail={t(
            "Add student records first, then their grade and class spread will appear here.",
            "\u0623\u0636\u0641\u0020\u0633\u062C\u0644\u0627\u062A\u0020\u0627\u0644\u0637\u0644\u0627\u0628\u0020\u0623\u0648\u0644\u0627\u064B\u060C\u0020\u062B\u0645\u0020\u0633\u064A\u0638\u0647\u0631\u0020\u062A\u0648\u0632\u064A\u0639\u0647\u0645\u0020\u0639\u0644\u0649\u0020\u0627\u0644\u0645\u0631\u0627\u062D\u0644\u0020\u0648\u0627\u0644\u0641\u0635\u0648\u0644\u0020\u0647\u0646\u0627\u002E",
          )}
          action={
            <Link href="/students">
              <Button data-testid="button-empty-distribution">
                <Plus size={15} />{" "}
                {t(
                  "Add students first",
                  "\u0623\u0636\u0641\u0020\u0627\u0644\u0637\u0644\u0627\u0628\u0020\u0623\u0648\u0644\u0627\u064B",
                )}
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {groups.slice(0, 4).map(([grade, classes]) => (
              <div
                key={grade}
                className="rounded-xl border border-border bg-card p-5 soft-shadow"
                data-testid={`card-distribution-${grade.toLowerCase().replaceAll(" ", "-")}`}
              >
                <div className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
                  {grade}
                </div>
                <div className="ar mt-0.5 text-[10px] text-muted-foreground/70">
                  الصف
                </div>
                <strong className="mt-3 block font-mono text-[26px] tracking-[-.05em] text-[#263064]">
                  {Array.from(classes.values()).reduce(
                    (sum, count) => sum + count,
                    0,
                  )}
                </strong>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  {classes.size} classes
                </div>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl border border-border bg-card soft-shadow">
            <div className="grid min-w-[640px] grid-cols-[1.5fr_1fr_1fr_1.6fr] border-b border-border bg-[#263064]/5 px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
              <span>
                {t("Grade", "\u0627\u0644\u0645\u0631\u062D\u0644\u0629")}
              </span>
              <span>{t("Class", "\u0627\u0644\u0641\u0635\u0644")}</span>
              <span>
                {t("Students", "\u0627\u0644\u0637\u0644\u0627\u0628")}
              </span>
              <span>
                {t(
                  "Share of school",
                  "\u0646\u0633\u0628\u0629\u0020\u0645\u0646\u0020\u0627\u0644\u0645\u062F\u0631\u0633\u0629",
                )}
              </span>
            </div>
            {distPages.pageItems.map(({ grade, klass, count, key }) => {
              const percent = total ? Math.round((count / total) * 100) : 0;
              return (
                <div
                  key={key}
                  className="grid min-w-[640px] grid-cols-[1.5fr_1fr_1fr_1.6fr] items-center border-b border-border/70 px-5 py-3 transition-colors last:border-b-0 hover:bg-secondary/40"
                  data-testid={`row-distribution-${grade.toLowerCase().replaceAll(" ", "-")}-${klass.toLowerCase()}`}
                >
                  <span className="text-sm font-semibold text-[#263064]">
                    {grade}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {klass}
                  </span>
                  <strong className="font-mono text-sm text-[#263064]">
                    {count}
                  </strong>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {percent}%
                    </span>
                  </div>
                </div>
              );
            })}
            <div className="grid min-w-[640px] grid-cols-[1.5fr_1fr_1fr_1.6fr] items-center bg-[#263064]/5 px-5 py-3 text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">
              <span>
                {t("Total", "\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A")}
              </span>
              <span />
            </div>
            <Pagination
              page={distPages.page}
              pageCount={distPages.pageCount}
              totalItems={distPages.totalItems}
              pageSize={distPages.pageSize}
              onPageChange={distPages.setPage}
              onPageSizeChange={distPages.setPageSize}
            />
          </div>
        </>
      )}
    </div>
  );
}

function BorrowsPage() {
  const { t } = useT();
  const [search, setSearch] = useState("");
  const [scan, setScan] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scannerAt, setScannerAt] = useState<Date | null>(null);
  const [scannedBorrows, setScannedBorrows] = useState<Borrow[]>([]);
  const [missingScan, setMissingScan] = useState<string>();
  const [borrowing, setBorrowing] = useState<Book>();
  const [bookPickerOpen, setBookPickerOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [bookBarcode, setBookBarcode] = useState("");
  const query = useGetBorrows(
    { active: true },
    { query: { queryKey: getGetBorrowsQueryKey({ active: true }) } },
  );
  const booksQuery = useGetBooks(undefined, {
    query: { queryKey: getGetBooksQueryKey(undefined) },
  });
  const books = Array.isArray(booksQuery.data) ? booksQuery.data : [];
  const returnBorrow = useReturnBorrow();
  const queryClient = useQueryClient();
  const borrows = (Array.isArray(query.data) ? query.data : []) as Borrow[];
  const filteredBorrows = useMemo(
    () =>
      borrows.filter((borrow) =>
        `${borrow.borrowerName} ${borrow.bookTitle} ${borrow.bookBarcode || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [borrows, search],
  );
  const borrowPages = usePagination(filteredBorrows);
  useEffect(() => {
    let stamps: number[] = [];
    const onKey = (event: KeyboardEvent) => {
      const now = Date.now();
      if (event.key === "Enter") {
        if (
          stamps.length >= 4 &&
          now - stamps[stamps.length - 1] < 120 &&
          stamps.every(
            (stamp, index) => index === 0 || stamp - stamps[index - 1] < 60,
          )
        )
          setScannerAt(new Date());
        stamps = [];
        return;
      }
      if (event.key.length === 1) {
        stamps = stamps.filter((stamp) => now - stamp < 1000);
        stamps.push(now);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const handleScan = async (event: FormEvent) => {
    event.preventDefault();
    const code = scan.trim();
    if (!code || scanning) return;
    setScanning(true);
    const matches = borrows.filter(
      (borrow) => (borrow.bookBarcode || "").trim() === code,
    );
    setScannedBorrows(matches);
    setMissingScan(matches.length ? undefined : code);
    setScanning(false);
    setScan("");
  };
  const returnScannedBorrow = () => {
    if (!scannedBorrows.length) return;
    scannedBorrows.forEach((borrow) =>
      returnBorrow.mutate(
        { id: borrow.id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getGetBorrowsQueryKey({ active: true }),
            });
            queryClient.invalidateQueries({ queryKey: getGetBooksQueryKey() });
            setScannedBorrows((current) =>
              current.filter((item) => item.id !== borrow.id),
            );
          },
        },
      ),
    );
  };
  const clearScanResult = () => {
    setScannedBorrows([]);
    setMissingScan(undefined);
  };
  return (
    <div className="rise-in">
      <PageHeading
        eyebrow="Resources · 04 · Lending"
        title="Borrows"
        arabic="��لاستعارات"
        description={t(
          "Keep track of books currently away from the shelves.",
          "تابع الكتب الموجودة حاليًا خارج الرفوف.",
        )}
        action={<Button onClick={() => setBookPickerOpen(true)} className="h-11 rounded-lg bg-[#263064] px-5 text-[#FCFBF0] hover:bg-[#263064]/85" data-testid="button-borrows-borrow"><Plus size={17} /> {t("Borrow a book", "استعارة كتاب")}</Button>}
      />
      <form
        onSubmit={handleScan}
        className="mb-5 flex flex-col gap-2 rounded-xl border border-[#DBB46C]/50 bg-gradient-to-l from-[#FCFBF0] to-[#DBB46C]/15 p-4 sm:flex-row sm:items-center"
        data-testid="form-borrows-scan-barcode"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#263064] text-[#DBB46C]">
          <Barcode size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[.14em] text-[#EC9F42]">
              {t("Scanner station", "محطة الماسح الضوئي")}
            </span>
            <span
              className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${scannerAt ? "bg-[#32B77E]/15 text-[#32B77E]" : "bg-muted text-muted-foreground"}`}
              data-testid="status-borrows-scanner"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${scannerAt ? "animate-pulse bg-[#32B77E]" : "bg-muted-foreground/50"}`}
              />
              <span>
                {scannerAt
                  ? `${t("Connected", "متصل")} · ${scannerAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : t("Not detected", "غير مكتشف")}
              </span>
            </span>
          </div>
          <input
            autoFocus
            value={scan}
            onChange={(event) => setScan(event.target.value)}
            placeholder={t(
              "Scan an active borrowed-book barcode, then press Enter…",
              "امسح باركود كتاب مستعار ثم اضغط Enter…",
            )}
            className="mt-1 h-10 w-full rounded-lg border border-input bg-card px-3 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            data-testid="input-borrows-scan-barcode"
          />
        </div>
        {scanning && (
          <span className="text-xs text-muted-foreground">
            {t("Looking up…", "جارٍ البحث…")}
          </span>
        )}
      </form>
      {scannedBorrows.length > 0 && (
        <div
          className="mb-5 rounded-xl border border-[#32B77E]/35 bg-[#32B77E]/10 p-4"
          data-testid="panel-borrows-scanned-borrow"
        >
          <div className="mb-3 text-sm font-bold text-[#263064]">
            {t("Borrowers for this barcode", "مستعيرو هذا الباركود")}
          </div>
          {scannedBorrows.map((borrow) => (
            <div
              key={borrow.id}
              className="flex flex-wrap items-center gap-3 border-t border-[#32B77E]/20 py-3 first:border-t-0 first:pt-0"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[#263064]">
                  {borrow.borrowerName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {borrow.bookTitle} ·{" "}
                  {t(borrow.borrowerType, borrow.borrowerType)}
                </div>
              </div>
              <Button
                onClick={() =>
                  returnBorrow.mutate(
                    { id: borrow.id },
                    {
                      onSuccess: () => {
                        setScannedBorrows((current) =>
                          current.filter((item) => item.id !== borrow.id),
                        );
                        queryClient.invalidateQueries({
                          queryKey: getGetBorrowsQueryKey({ active: true }),
                        });
                        queryClient.invalidateQueries({
                          queryKey: getGetBooksQueryKey(),
                        });
                      },
                    },
                  )
                }
                disabled={returnBorrow.isPending}
                data-testid={`button-borrows-scan-return-${borrow.id}`}
              >
                {t("Return", "إرجاع")}
              </Button>
            </div>
          ))}
          <button
            onClick={clearScanResult}
            className="mt-2 rounded-md p-2 text-muted-foreground hover:text-primary"
            aria-label={t("Dismiss", "إغلاق")}
            data-testid="button-borrows-scan-dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {missingScan && (
        <div
          className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/10 p-4"
          data-testid="panel-borrows-missing-book"
        >
          <Barcode size={20} className="text-destructive" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-destructive">
              {t("Barcode not found", "لم يتم العثور على الباركود")}
            </div>
            <div className="text-xs text-destructive/75">
              {t(
                `No book matches barcode ${missingScan}. Add it to the Books tab first.`,
                `لا يوجد كتاب يطابق الباركود ${missingScan}. أضفه أولًا من تبويب الكتب.`,
              )}
            </div>
          </div>
          <button
            onClick={() => setMissingScan(undefined)}
            className="rounded-md p-2 text-destructive/70 hover:text-destructive"
            aria-label={t("Dismiss", "إغلاق")}
            data-testid="button-borrows-missing-dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {query.isLoading ? (
        <LoadingCards count={3} />
      ) : query.isError ? (
        <ErrorState
          label="active borrows"
          labelAr="الاستعارات النشطة"
          onRetry={() => query.refetch()}
        />
      ) : !filteredBorrows.length ? (
        <EmptyState
          icon={BookOpen}
          title={t("No active borrows", "لا توجد استعارات نشطة")}
          detail={t(
            "Borrowed books will appear here until they are returned.",
            "ستظهر الكتب المستعارة هنا حتى إعادتها.",
          )}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card soft-shadow">
          <div className="grid min-w-[760px] grid-cols-[1.5fr_1.5fr_1fr_1fr_100px] border-b border-border bg-[#263064]/5 px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
            <span>{t("Student", "الطالب")}</span>
            <span>{t("Book", "الكتاب")}</span>
            <span>{t("Borrowed", "تاريخ الإعارة")}</span>
            <span>{t("Due date", "تاريخ الاستحقاق")}</span>
            <span />
          </div>
          {borrowPages.pageItems.map((borrow) => (
            <div
              key={borrow.id}
              className="grid min-w-[760px] grid-cols-[1.5fr_1.5fr_1fr_1fr_100px] items-center border-b border-border/70 px-5 py-4 text-sm last:border-b-0"
            >
              <div className="font-semibold text-[#263064]">
                {borrow.borrowerName}
              </div>
              <div className="text-muted-foreground">{borrow.bookTitle}</div>
              <div className="text-xs text-muted-foreground" dir="ltr">
                {borrow.borrowedAt ? formatDate(String(borrow.borrowedAt)) : "—"}
              </div>
              <div className="text-xs text-muted-foreground" dir="ltr">
                {borrow.dueDate ? formatDate(String(borrow.dueDate)) : "—"}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  returnBorrow.mutate(
                    { id: borrow.id },
                    {
                      onSuccess: () => {
                        queryClient.invalidateQueries({
                          queryKey: getGetBorrowsQueryKey({ active: true }),
                        });
                        queryClient.invalidateQueries({
                          queryKey: getGetBooksQueryKey(),
                        });
                      },
                    },
                  )
                }
                disabled={returnBorrow.isPending}
                data-testid={`button-return-borrow-${borrow.id}`}
              >
                {t("Return", "إرجاع")}
              </Button>
            </div>
          ))}
          <Pagination
            page={borrowPages.page}
            pageCount={borrowPages.pageCount}
            totalItems={borrowPages.totalItems}
            pageSize={borrowPages.pageSize}
            onPageChange={borrowPages.setPage}
            onPageSizeChange={borrowPages.setPageSize}
          />
        </div>
      )}
      <Dialog open={bookPickerOpen} onOpenChange={setBookPickerOpen}>
        <DialogContent className="max-w-md border-border bg-[#FCFBF0] p-0">
          <DialogHeader className="border-b border-border bg-card px-6 py-5 text-left">
            <DialogTitle className="text-2xl text-[#263064]">{t("Choose a book", "اختر كتابًا")}</DialogTitle>
            <DialogDescription>{t("Select the book to lend.", "اختر الكتاب المراد إعارته.")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-6 py-6">
            <select value={selectedBookId} onChange={(event) => setSelectedBookId(event.target.value)} className="h-10 rounded-lg border border-input bg-card px-3 text-sm" data-testid="select-borrows-book">
              <option value="">{t("Choose a book…", "اختر كتابًا…")}</option>
              {books.map((book) => <option value={book.id} key={book.id}>{book.title} · {book.availableCopies ?? book.copies}/{book.copies}</option>)}
            </select>
            <input value={bookBarcode} onChange={(event) => { const barcode = event.target.value; setBookBarcode(barcode); const match = books.find((book) => (book.isbn || "").trim() === barcode.trim()); if (match) setSelectedBookId(String(match.id)); }} placeholder={t("Enter or scan book barcode", "أدخل أو امسح باركود الكتاب")} className="h-10 rounded-lg border border-input bg-card px-3 font-mono text-sm" data-testid="input-borrows-book-barcode" />
          </div>
          <DialogFooter className="border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setBookPickerOpen(false)}>{t("Cancel", "إلغاء")}</Button>
            <Button type="button" disabled={!selectedBookId} onClick={() => { const book = books.find((item) => item.id === Number(selectedBookId)); if (book) { setBorrowing(book); setBookPickerOpen(false); setSelectedBookId(""); setBookBarcode(""); } }} className="bg-[#263064] text-[#FCFBF0]">{t("Continue", "متابعة")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <BorrowDialog open={Boolean(borrowing)} onOpenChange={(value) => { if (!value) setBorrowing(undefined); }} book={borrowing} onSaved={() => queryClient.invalidateQueries({ queryKey: getGetBorrowsQueryKey({ active: true }) })} />
    </div>
  );
}

type ReportColumn = { key: string; header: string };

function ReportSection({ title, titleAr, columns, data, exportType, t }: {
  title: string;
  titleAr: string;
  columns: ReportColumn[];
  data: Record<string, string>[];
  exportType: "books" | "borrows";
  t: (en: string, ar: string) => string;
}) {
  const reportPages = usePagination(data, 16);
  const handleExcel = () => {
    import("@/utils/import-export").then((mod) => {
      const rows = data.map((row) => {
        const obj: Record<string, string> = {};
        columns.forEach((c) => { obj[c.header] = row[c.key] || "—"; });
        return obj;
      });
      mod.exportToExcel(rows, "books");
    });
  };
  return (
    <section className="rounded-xl border border-border bg-card p-6 soft-shadow">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">{title}</div>
          <h3 className="mt-1 text-lg font-bold text-[#263064]">{titleAr}</h3>
        </div>
        <Button variant="outline" size="sm" onClick={handleExcel} className="gap-1.5 text-xs">
          <FileSpreadsheet size={14} />
          {t("Export Excel", "تصدير Excel")}
        </Button>
      </div>
      {data.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{t("No records found.", "لا توجد سجلات.")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                {columns.map((col) => (
                  <th key={col.key} className="px-3 py-2 text-xs font-semibold text-muted-foreground">{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportPages.pageItems.map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-2">{row[col.key] || "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={reportPages.page}
            pageCount={reportPages.pageCount}
            totalItems={reportPages.totalItems}
            pageSize={reportPages.pageSize}
            onPageChange={reportPages.setPage}
            onPageSizeChange={reportPages.setPageSize}
          />
        </div>
      )}
    </section>
  );
}

function AnalyticsPage() {
  const { t } = useT();
  const booksQuery = useGetBooks(undefined, {
    query: { queryKey: getGetBooksQueryKey(undefined) },
  });
  const borrowsQuery = useGetBorrows(
    {},
    { query: { queryKey: getGetBorrowsQueryKey({}) } },
  );
  const books = Array.isArray(booksQuery.data) ? booksQuery.data : [];
  const borrows = Array.isArray(borrowsQuery.data) ? borrowsQuery.data : [];
  const copies = books.reduce((total, book) => total + book.copies, 0);
  const available = books.reduce(
    (total, book) => total + (book.availableCopies ?? book.copies),
    0,
  );
  const borrowedCopies = Math.max(copies - available, 0);
  const lostBooks = books.filter((b) => b.status === "lost").length;
  const damagedBooks = books.filter((b) => b.status === "damaged").length;
  const categories = new Set(books.map((book) => book.category).filter(Boolean))
    .size;
  const borrowedPercent = copies
    ? Math.round((borrowedCopies / copies) * 1000) / 10
    : 0;
  const activeBorrows = borrows.filter((b) => !b.returnedAt);
  const [reportTab, setReportTab] = useState<"overview" | "borrows" | "books">("overview");

  const gradeDistribution = useMemo(() => {
    const map = new Map<string, number>();
    activeBorrows.forEach((b) => {
      const grade = "Grade " + ((b as any).grade || "");
      map.set(grade, (map.get(grade) || 0) + 1);
    });
    if (map.size === 0) {
      books.forEach((book) => {
        const cat = book.category || "Other";
        map.set(cat, (map.get(cat) || 0) + book.copies);
      });
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [activeBorrows, books]);

  const monthlyBorrows = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const counts = new Array(12).fill(0);
    borrows.forEach((b) => {
      const d = new Date(b.borrowedAt);
      if (!isNaN(d.getTime())) counts[d.getMonth()]++;
    });
    return months.map((m, i) => ({ name: m, count: counts[i] }));
  }, [borrows]);

  return (
    <div className="rise-in">
      <PageHeading
        eyebrow="Resources · 04 · Analytics"
        title="Library analytics"
        arabic="تحليلات المكتبة"
        description={t(
          "Reports, charts and insights for the entire library catalogue.",
          "تقارير ورسوم بيانية وتحليلات لجميع كتب المكتبة.",
        )}
      />
      {booksQuery.isLoading || borrowsQuery.isLoading ? (
        <LoadingCards count={4} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Titles"
              arabic="العناوين"
              value={books.length.toLocaleString()}
              icon={BookOpen}
              tone="navy"
              note={t("In the catalogue", "في الفهرس")}
            />
            <StatCard
              label="Total copies"
              arabic="إجمالي النسخ"
              value={copies.toLocaleString()}
              icon={Library}
              tone="teal"
              note={t("Across all titles", "عبر جميع العناوين")}
            />
            <StatCard
              label="Active borrows"
              arabic="الإعارات النشطة"
              value={activeBorrows.length.toLocaleString()}
              icon={BookOpen}
              tone="gold"
              note={`${borrowedPercent}% ${t("of catalogue", "من الفهرس")}`}
            />
            <StatCard
              label="Lost / Damaged"
              arabic="مفقود / تالف"
              value={`${lostBooks + damagedBooks}`}
              icon={AlertTriangle}
              tone="sky"
              note={`${lostBooks} ${t("lost", "مفقود")} · ${damagedBooks} ${t("damaged", "تالف")}`}
            />
          </div>

          <div className="mt-6 flex gap-2 border-b border-border pb-px">
            {(["overview", "borrows", "books"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setReportTab(tab)}
                className={`rounded-t-lg px-4 py-2 text-xs font-semibold transition-colors ${
                  reportTab === tab
                    ? "border-b-2 border-primary bg-primary/5 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "overview"
                  ? t("Overview", "نظرة عامة")
                  : tab === "borrows"
                    ? t("Borrow reports", "تقارير الإعارات")
                    : t("Book reports", "تقارير الكتب")}
              </button>
            ))}
          </div>

          {reportTab === "overview" && (
            <>
              <section className="mt-6 rounded-xl border border-border bg-card p-6 soft-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                      {t("Availability", "التوفر")}
                    </div>
                    <h2 className="mt-1 text-xl font-bold text-[#263064]">
                      {t("Copies on the shelf", "النسخ الموجودة على الرف")}
                    </h2>
                  </div>
                  <span className="font-mono text-lg font-bold text-[#263064]">
                    {available}/{copies}
                  </span>
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${copies ? Math.min((available / copies) * 100, 100) : 0}%`,
                    }}
                  />
                </div>
                <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    {t("Available", "متاح")} ({available})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#DBB46C]" />
                    {t("Borrowed", "معار")} ({borrowedCopies})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#E53935]" />
                    {t("Lost + Damaged", "مفقود + تالف")} ({lostBooks + damagedBooks})
                  </span>
                </div>
              </section>
              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <section className="rounded-xl border border-border bg-card p-6 soft-shadow">
                  <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                    {t("Monthly borrows", "الإعارات الشهرية")}
                  </div>
                  <h2 className="mt-1 mb-4 text-lg font-bold text-[#263064]">
                    {t("Borrowing activity over the year", "نشاط الإعارات على مدار السنة")}
                  </h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={monthlyBorrows}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill="#263064" radius={[4, 4, 0, 0]} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
                <section className="rounded-xl border border-border bg-card p-6 soft-shadow">
                  <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                    {t("By category", "حسب التصنيف")}
                  </div>
                  <h2 className="mt-1 mb-4 text-lg font-bold text-[#263064]">
                    {t("Books per category", "عدد الكتب لكل تصنيف")}
                  </h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={gradeDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill="#DBB46C" radius={[4, 4, 0, 0]} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>
            </>
          )}

          {reportTab === "borrows" && (
            <div className="mt-6 space-y-6">
              <ReportSection
                title={t("Active borrows", "الإعارات النشطة")}
                titleAr="الإعارات النشطة"
                columns={[
                  { key: "borrowerName", header: t("Borrower", "المُعار") },
                  { key: "bookTitle", header: t("Book", "الكتاب") },
                  { key: "borrowedAt", header: t("Borrowed", "تاريخ الإعارة") },
                  { key: "dueDate", header: t("Due", "الاسترجاع") },
                ]}
                data={activeBorrows.map((b) => ({
                  borrowerName: b.borrowerName || "—",
                  bookTitle: b.bookTitle || "—",
                  borrowedAt: b.borrowedAt ? new Date(b.borrowedAt).toLocaleDateString("en-GB") : "—",
                  dueDate: b.dueDate ? new Date(b.dueDate).toLocaleDateString("en-GB") : "—",
                }))}
                exportType="borrows"
                t={t}
              />
              <ReportSection
                title={t("Returned borrows", "الإعارات المُرجعة")}
                titleAr="الإعارات المُرجعة"
                columns={[
                  { key: "borrowerName", header: t("Borrower", "المُعار") },
                  { key: "bookTitle", header: t("Book", "الكتاب") },
                  { key: "borrowedAt", header: t("Borrowed", "تاريخ الإعارة") },
                  { key: "returnDate", header: t("Returned", "تاريخ الإرجاع") },
                ]}
                data={borrows.filter((b) => b.returnedAt).map((b) => ({
                  borrowerName: b.borrowerName || "—",
                  bookTitle: b.bookTitle || "—",
                  borrowedAt: b.borrowedAt ? new Date(b.borrowedAt).toLocaleDateString("en-GB") : "—",
                  returnDate: b.returnedAt ? new Date(b.returnedAt).toLocaleDateString("en-GB") : "—",
                }))}
                exportType="borrows"
                t={t}
              />
            </div>
          )}

          {reportTab === "books" && (
            <div className="mt-6 space-y-6">
              <ReportSection
                title={t("All books", "جميع الكتب")}
                titleAr="جميع الكتب"
                columns={[
                  { key: "title", header: t("Title", "العنوان") },
                  { key: "author", header: t("Author", "المؤلف") },
                  { key: "category", header: t("Category", "التصنيف") },
                  { key: "language", header: t("Language", "اللغة") },
                  { key: "copies", header: t("Copies", "النسخ") },
                  { key: "availableCopies", header: t("Available", "المتاحة") },
                  { key: "status", header: t("Status", "الحالة") },
                ]}
                data={books.map((b) => ({
                  title: b.title,
                  author: b.author || "—",
                  category: b.category || "—",
                  language: b.language || "—",
                  copies: String(b.copies),
                  availableCopies: String(b.availableCopies ?? b.copies),
                  status: b.status || "available",
                }))}
                exportType="books"
                t={t}
              />
              <ReportSection
                title={t("Lost books", "الكتب المفقودة")}
                titleAr="الكتب المفقودة"
                columns={[
                  { key: "title", header: t("Title", "العنوان") },
                  { key: "author", header: t("Author", "المؤلف") },
                  { key: "isbn", header: "ISBN" },
                  { key: "shelf", header: t("Shelf", "الرف") },
                ]}
                data={books.filter((b) => b.status === "lost").map((b) => ({
                  title: b.title,
                  author: b.author || "—",
                  isbn: b.isbn || "—",
                  shelf: b.shelf || "—",
                }))}
                exportType="books"
                t={t}
              />
              <ReportSection
                title={t("Damaged books", "الكتب التالفة")}
                titleAr="الكتب التالفة"
                columns={[
                  { key: "title", header: t("Title", "العنوان") },
                  { key: "author", header: t("Author", "المؤلف") },
                  { key: "isbn", header: "ISBN" },
                  { key: "shelf", header: t("Shelf", "الرف") },
                ]}
                data={books.filter((b) => b.status === "damaged").map((b) => ({
                  title: b.title,
                  author: b.author || "—",
                  isbn: b.isbn || "—",
                  shelf: b.shelf || "—",
                }))}
                exportType="books"
                t={t}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CategoriesPage() {
  const { t } = useT();
  const query = useGetBooks(undefined, {
    query: { queryKey: getGetBooksQueryKey(undefined) },
  });
  const books = Array.isArray(query.data) ? query.data : [];
  const groups = useMemo(() => {
    const map = new Map<string, Book[]>();
    for (const book of books) {
      const key = book.category || "Uncategorised";
      map.set(key, [...(map.get(key) ?? []), book]);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [books]);
  const groupPages = usePagination(groups);
  return (
    <div className="rise-in">
      <PageHeading
        eyebrow="Resources · 04 · Catalogue"
        title={t(
          "Book categories",
          "\u062A\u0635\u0646\u064A\u0641\u0627\u062A\u0020\u0627\u0644\u0643\u062A\u0628",
        )}
        arabic={t(
          "\u062A\u0635\u0646\u064A\u0641\u0627\u062A\u0020\u0627\u0644\u0643\u062A\u0628",
          "Book categories",
        )}
        description={t(
          "Every shelf in the library, grouped by how the collection is organised.",
          "\u0643\u0644\u0020\u0631\u0641\u0020\u0641\u064A\u0020\u0627\u0644\u0645\u0643\u062A\u0628\u0629\u060C\u0020\u0645\u062C\u0645\u0651\u0639\u0629\u0020\u062D\u0633\u0628\u0020\u062A\u0646\u0638\u064A\u0645\u0020\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629\u002E",
        )}
      />
      {query.isLoading ? (
        <LoadingCards count={3} />
      ) : query.isError ? (
        <ErrorState
          label="book categories"
          labelAr="\u062A\u0635\u0646\u064A\u0641\u0627\u062A\u0020\u0627\u0644\u0643\u062A\u0628"
          onRetry={() => query.refetch()}
        />
      ) : !groups.length ? (
        <EmptyState
          icon={Library}
          title={t(
            "No categories yet",
            "\u0644\u0627\u0020\u062A\u0648\u062C\u062F\u0020\u062A\u0635\u0646\u064A\u0641\u0627\u062A\u0020\u0628\u0639\u062F",
          )}
          detail={t(
            "Once books are added to the library, their categories will be summarised here.",
            "\u0628\u0645\u062C\u0631\u062F\u0020\u0625\u0636\u0627\u0641\u0629\u0020\u0627\u0644\u0643\u062A\u0628\u0020\u0625\u0644\u0649\u0020\u0627\u0644\u0645\u0643\u062A\u0628\u0629\u060C\u0020\u0633\u064A\u062A\u0645\u0020\u062A\u0644\u062E\u064A\u0635\u0020\u062A\u0635\u0646\u064A\u0641\u0627\u062A\u0647\u0627\u0020\u0647\u0646\u0627\u002E",
          )}
          action={
            <Link href="/library">
              <Button data-testid="button-goto-books">
                <Plus size={15} />{" "}
                {t(
                  "Add your first book",
                  "\u0623\u0636\u0641\u0020\u0643\u062A\u0627\u0628\u0643\u0020\u0627\u0644\u0623\u0648\u0644",
                )}
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card soft-shadow">
          {groupPages.pageItems.map(([category, group], index) => {
            const copies = group.reduce((sum, book) => sum + book.copies, 0);
            const available = group.reduce(
              (sum, book) => sum + (book.availableCopies ?? book.copies),
              0,
            );
            return (
              <div
                key={category}
                className={index ? "border-t-2 border-border" : ""}
              >
                <div
                  className="flex flex-wrap items-center justify-between gap-3 bg-[#263064]/5 px-5 py-3"
                  data-testid={`row-category-${category.toLowerCase().replaceAll(" ", "-")}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#DBB46C]/20 text-[#EC9F42]">
                      <BookOpen size={17} strokeWidth={1.8} />
                    </div>
                    <div>
                      <div className="text-sm font-bold uppercase tracking-[.08em] text-[#263064]">
                        {category}
                      </div>
                      <div className="ar text-[10px] text-muted-foreground">
                        التصنيف
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 text-[11px] text-muted-foreground">
                    <span>
                      <strong className="font-mono text-[#263064]">
                        {group.length}
                      </strong>{" "}
                      {t("titles", "\u0639\u0646\u0648\u0627\u0646")}
                    </span>
                    <span>
                      <strong className="font-mono text-[#263064]">
                        {copies}
                      </strong>{" "}
                      {t("copies", "\u0646\u0633\u062E\u0629")}
                    </span>
                    <span>
                      <strong className="font-mono text-[#32B77E]">
                        {available}
                      </strong>{" "}
                      {t("available", "\u0645\u062A\u0627\u062D")}
                    </span>
                  </div>
                </div>
                {group.map((book) => (
                  <div
                    key={book.id}
                    className="grid min-w-[720px] grid-cols-[2fr_1fr_.8fr_.8fr_1.1fr_88px] items-center border-t border-border/70 px-5 py-2.5 transition-colors hover:bg-secondary/40"
                    data-testid={`row-category-book-${book.id}`}
                  >
                    <div className="line-clamp-1 text-sm font-medium text-[#263064]">
                      {book.title}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {book.author}
                    </span>
                    <span className="justify-self-center text-center text-xs text-muted-foreground">
                      {book.language}
                    </span>
                    <span className="justify-self-center text-center text-xs text-muted-foreground">
                      {book.shelf ? `Shelf ${book.shelf}` : "—"}
                    </span>
                    <span
                      className="justify-self-center text-center font-mono text-xs text-muted-foreground"
                      dir="ltr"
                    >
                      {book.isbn || "—"}
                    </span>
                    <span
                      className={`w-fit justify-self-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${(book.availableCopies ?? book.copies) > 0 ? "bg-[#32B77E]/15 text-[#32B77E]" : "bg-[#B92327]/10 text-[#B92327]"}`}
                    >
                      {(book.availableCopies ?? book.copies) > 0
                        ? t(
                            "on shelf",
                            "\u0639\u0644\u0649\u0020\u0627\u0644\u0631\u0641",
                          )
                        : t(
                            "all out",
                            "\u0643\u0644\u0020\u0627\u0644\u0646\u0633\u062E\u0020\u0645\u0633\u062A\u0639\u0627\u0631\u0629",
                          )}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
            <Pagination
              page={groupPages.page}
              pageCount={groupPages.pageCount}
              totalItems={groupPages.totalItems}
              pageSize={groupPages.pageSize}
              onPageChange={groupPages.setPage}
              onPageSizeChange={groupPages.setPageSize}
            />
        </div>
      )}
    </div>
  );
}

function IndexPage() {
  const { t } = useT();
  const [search, setSearch] = useState("");
  const query = useGetBooks(
    { search: search || undefined },
    {
      query: { queryKey: getGetBooksQueryKey({ search: search || undefined }) },
    },
  );
  const books = useMemo(
    () =>
      [...(Array.isArray(query.data) ? query.data : [])].sort((a, b) =>
        a.title.localeCompare(b.title),
      ),
    [query.data],
  );
  const bookPages = usePagination(books);
  return (
    <div className="rise-in">
      <PageHeading
        eyebrow="Resources · 04 · Index"
        title={t(
          "Library index",
          "\u0641\u0647\u0631\u0633\u0020\u0627\u0644\u0645\u0643\u062A\u0628\u0629",
        )}
        arabic={t(
          "\u0641\u0647\u0631\u0633\u0020\u0627\u0644\u0645\u0643\u062A\u0628\u0629",
          "Library index",
        )}
        description={t(
          "The complete catalogue in one alphabetical listing, ready for quick lookup.",
          "\u0627\u0644\u0643\u0627\u062A\u0627\u0644\u0648\u062C\u0020\u0627\u0644\u0643\u0627\u0645\u0644\u0020\u0641\u064A\u0020\u0642\u0627\u0626\u0645\u0629\u0020\u0623\u0628\u062C\u062F\u064A\u0629\u0020\u0648\u0627\u062D\u062F\u0629\u060C\u0020\u062C\u0627\u0647\u0632\u0020\u0644\u0644\u0628\u062D\u062B\u0020\u0627\u0644\u0633\u0631\u064A\u0639\u002E",
        )}
      />
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:max-w-md">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t(
              "Filter the index by title or author",
              "تصفية الفهرس بالعنوان أو المؤلف",
            )}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            data-testid="input-search-index"
          />
        </div>
      </div>
      {query.isLoading ? (
        <LoadingCards count={3} />
      ) : query.isError ? (
        <ErrorState
          label="the library index"
          labelAr="\u0627\u0644\u0641\u0647\u0631\u0633\u0020\u0627\u0644\u0639\u0627\u0645\u0020\u0644\u0644\u0645\u0643\u062A\u0628\u0629"
          onRetry={() => query.refetch()}
        />
      ) : !books.length ? (
        <EmptyState
          icon={BookOpen}
          title={
            search
              ? t(
                  "Nothing in the index matches",
                  "\u0644\u0627\u0020\u0634\u064A\u0621\u0020\u0641\u064A\u0020\u0627\u0644\u0641\u0647\u0631\u0633\u0020\u064A\u0637\u0627\u0628\u0642\u0020\u0627\u0644\u0628\u062D\u062B",
                )
              : t(
                  "The index is empty",
                  "\u0627\u0644\u0641\u0647\u0631\u0633\u0020\u0641\u0627\u0631\u063A",
                )
          }
          detail={
            search
              ? t(
                  "Try another search term or clear the filters.",
                  "\u062C\u0631\u0651\u0628\u0020\u0643\u0644\u0645\u0629\u0020\u0628\u062D\u062B\u0020\u0623\u062E\u0631\u0649\u0020\u0623\u0648\u0020\u0627\u0645\u0633\u062D\u0020\u0639\u0648\u0627\u0645\u0644\u0020\u0627\u0644\u062A\u0635\u0641\u064A\u0629\u002E",
                )
              : t(
                  "Add books to build the master index of the library.",
                  "\u0623\u0636\u0641\u0020\u0643\u062A\u0628\u0627\u064B\u0020\u0644\u0628\u0646\u0627\u0621\u0020\u0627\u0644\u0641\u0647\u0631\u0633\u0020\u0627\u0644\u0639\u0627\u0645\u0020\u0644\u0644\u0645\u0643\u062A\u0628\u0629\u002E",
                )
          }
          action={
            !search ? (
              <Link href="/library">
                <Button data-testid="button-empty-index-add">
                  <Plus size={15} />{" "}
                  {t(
                    "Add first book",
                    "\u0623\u0636\u0641\u0020\u0623\u0648\u0644\u0020\u0643\u062A\u0627\u0628",
                  )}
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card soft-shadow">
          <div className="grid min-w-[880px] grid-cols-[2fr_1.2fr_1fr_.7fr_.7fr_1.1fr_.7fr] border-b border-border bg-[#263064]/5 px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
            <span>{t("Title", "العنوان")}</span>
            <span>{t("Author", "المؤلف")}</span>
            <span>{t("Category", "التصنيف")}</span>
            <span className="text-center">{t("Language", "اللغة")}</span>
            <span className="text-center">{t("Shelf", "الرف")}</span>
            <span className="text-center">{t("Barcode", "الباركود")}</span>
            <span className="text-center">{t("Copies", "النسخ")}</span>
          </div>
          {bookPages.pageItems.map((book) => (
            <div
              key={book.id}
              className="grid min-w-[880px] grid-cols-[2fr_1.2fr_1fr_.7fr_.7fr_1.1fr_.7fr] items-center border-b border-border/70 px-5 py-2.5 transition-colors hover:bg-secondary/40"
              data-testid={`row-index-book-${book.id}`}
            >
              <span className="line-clamp-1 text-sm font-medium text-[#263064]">
                {book.title}
              </span>
              <span className="line-clamp-1 text-xs text-muted-foreground">
                {book.author}
              </span>
              <span className="text-xs text-muted-foreground">
                {book.category}
              </span>
              <span className="justify-self-center text-center text-xs text-muted-foreground">
                {book.language}
              </span>
              <span
                className="justify-self-center text-center font-mono text-xs text-muted-foreground"
                dir="ltr"
              >
                {book.shelf || "—"}
              </span>
              <span
                className="justify-self-center text-center font-mono text-xs text-muted-foreground"
                dir="ltr"
              >
                {book.isbn || "—"}
              </span>
              <span className="justify-self-center text-center font-mono text-xs font-bold text-[#263064]">
                {book.availableCopies ?? book.copies}/{book.copies}
              </span>
            </div>
          ))}
            <Pagination
              page={bookPages.page}
              pageCount={bookPages.pageCount}
              totalItems={bookPages.totalItems}
              pageSize={bookPages.pageSize}
              onPageChange={bookPages.setPage}
              onPageSizeChange={bookPages.setPageSize}
            />
        </div>
      )}
    </div>
  );
}

function SettingsPage() {
  const { t } = useT();
  const query = useGetAcademicYears({
    query: { queryKey: getGetAcademicYearsQueryKey() },
  });
  const years = Array.isArray(query.data) ? query.data : [];
  const today = new Date().toISOString().slice(0, 10);
  const selected = years.find(
    (year) => today >= year.startDate && today <= year.endDate,
  )?.id;
  const setSelected = (_id: number) => undefined;
  return (
    <div className="rise-in">
      <PageHeading
        eyebrow="Administration · 05"
        title="Settings"
        arabic="الإعدادات"
        description={t(
          "Keep the school workspace aligned with its current academic rhythm.",
          "\u062D\u0627\u0641\u0638\u0020\u0639\u0644\u0649\u0020\u062A\u0648\u0627\u0641\u0642\u0020\u0645\u0633\u0627\u062D\u0629\u0020\u0639\u0645\u0644\u0020\u0627\u0644\u0645\u062F\u0631\u0633\u0629\u0020\u0645\u0639\u0020\u0625\u064A\u0642\u0627\u0639\u0647\u0627\u0020\u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0020\u0627\u0644\u062D\u0627\u0644\u064A\u002E",
        )}
        descriptionAr="إبقاء مساحة العمل متوافقة مع الإيقاع الأكاديمي"
      />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
        <section className="rounded-xl border border-border bg-card p-6 soft-shadow">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                {t(
                  "Academic years",
                  "\u0627\u0644\u0633\u0646\u0648\u0627\u062A\u0020\u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629",
                )}
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-[-.03em] text-[#263064]">
                {t(
                  "Choose your school year",
                  "\u0627\u062E\u062A\u0631\u0020\u0639\u0627\u0645\u0643\u0020\u0627\u0644\u062F\u0631\u0627\u0633\u064A",
                )}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(
                  "The selected year stays with this device and shapes your workspace context.",
                  "\u064A\u0628\u0642\u0649\u0020\u0627\u0644\u0639\u0627\u0645\u0020\u0627\u0644\u0645\u062E\u062A\u0627\u0631\u0020\u0639\u0644\u0649\u0020\u0647\u0630\u0627\u0020\u0627\u0644\u062C\u0647\u0627\u0632\u0020\u0648\u064A\u0634\u0643\u0644\u0020\u0633\u064A\u0627\u0642\u0020\u0645\u0633\u0627\u062D\u0629\u0020\u0639\u0645\u0644\u0643\u002E",
                )}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
              <CalendarDays size={18} />
            </div>
          </div>
          {query.isLoading ? (
            <div className="mt-7 space-y-3">
              {[1, 2, 3].map((item) => (
                <div className="skeleton h-16 rounded-lg" key={item} />
              ))}
            </div>
          ) : query.isError ? (
            <div className="mt-7">
              <ErrorState
                label="academic years"
                labelAr="\u0627\u0644\u0633\u0646\u0648\u0627\u062A\u0020\u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629"
                onRetry={() => query.refetch()}
              />
            </div>
          ) : !years.length ? (
            <div className="mt-7">
              <EmptyState
                icon={CalendarDays}
                title={t(
                  "No academic years yet",
                  "\u0644\u0627\u0020\u062A\u0648\u062C\u062F\u0020\u0633\u0646\u0648\u0627\u062A\u0020\u062F\u0631\u0627\u0633\u064A\u0629\u0020\u0628\u0639\u062F",
                )}
                detail={t(
                  "Academic years will appear once they are configured by the school office.",
                  "\u0633\u062A\u0638\u0647\u0631\u0020\u0627\u0644\u0633\u0646\u0648\u0627\u062A\u0020\u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629\u0020\u0628\u0645\u062C\u0631\u062F\u0020\u0625\u0639\u062F\u0627\u062F\u0647\u0627\u0020\u0645\u0646\u0020\u0642\u0628\u0644\u0020\u0625\u062F\u0627\u0631\u0629\u0020\u0627\u0644\u0645\u062F\u0631\u0633\u0629\u002E",
                )}
              />
            </div>
          ) : (
            <div className="mt-7 space-y-3">
              {years.map((year) => {
                const active = year.isCurrent || selected === year.id;
                return (
                  <button
                    key={year.id}
                    onClick={() => setSelected(year.id)}
                    className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${active ? "border-primary bg-secondary/70" : "border-border hover:border-primary/40 hover:bg-muted/50"}`}
                    data-testid={`button-academic-year-${year.id}`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? "bg-primary text-[#FCFBF0]" : "bg-muted text-muted-foreground"}`}
                    >
                      {active ? (
                        <Check size={16} />
                      ) : (
                        <CalendarDays size={16} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#263064]">
                          {year.label}
                        </span>
                        {year.isCurrent && (
                          <span className="rounded-full bg-[#32B77E]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#32B77E]">
                            {t(
                              "Current",
                              "\u0627\u0644\u062D\u0627\u0644\u064A",
                            )}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatDate(year.startDate)} —{" "}
                        {formatDate(year.endDate)}
                      </div>
                    </div>
                    <ChevronDown
                      size={16}
                      className="-rotate-90 text-muted-foreground"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </section>
        <section className="rounded-xl bg-[#263064] p-7 text-[#FCFBF0]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#DBB46C] text-[#263064]">
            <SlidersHorizontal size={18} />
          </div>
          <h2 className="mt-7 text-2xl font-bold leading-tight tracking-[-.04em]">
            {t(
              "Workspace preferences",
              "\u062A\u0641\u0636\u064A\u0644\u0627\u062A\u0020\u0645\u0633\u0627\u062D\u0629\u0020\u0627\u0644\u0639\u0645\u0644",
            )}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#FCFBF0]/70">
            {t(
              "A few quiet choices keep the command center feeling like yours.",
              "\u0628\u0636\u0639\u0020\u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A\u0020\u0647\u0627\u062F\u0626\u0629\u0020\u062A\u062C\u0639\u0644\u0020\u0645\u0631\u0643\u0632\u0020\u0627\u0644\u062A\u062D\u0643\u0645\u0020\u064A\u0634\u0639\u0631\u0643\u0020\u0623\u0646\u0647\u0020\u0645\u0646\u0020\u0646\u0635\u064A\u0628\u0643\u002E",
            )}
          </p>
          <div className="mt-8 space-y-4 border-t border-[#FCFBF0]/10 pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {t(
                  "Interface language",
                  "\u0644\u063A\u0629\u0020\u0627\u0644\u0648\u0627\u062C\u0647\u0629",
                )}
              </span>
              <span className="ar text-xs text-[#FCFBF0]/70">ثنائي اللغة</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {t(
                  "Date format",
                  "\u062A\u0646\u0633\u064A\u0642\u0020\u0627\u0644\u062A\u0627\u0631\u064A\u062E",
                )}
              </span>
              <span className="font-mono text-[11px] text-[#DBB46C]">
                {t("MMM DD, YYYY", "YYYY، MMM DD")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {t(
                  "Product edition",
                  "\u0625\u0635\u062F\u0627\u0631\u0020\u0627\u0644\u0645\u0646\u062A\u062C",
                )}
              </span>
              <span className="text-[11px] text-[#FCFBF0]/70">
                {t(
                  "Staff workspace",
                  "\u0645\u0633\u0627\u062D\u0629\u0020\u0639\u0645\u0644\u0020\u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646",
                )}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  return (
    <ErrorBoundary resetKey={location}>
      <Shell>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/students" component={StudentsPage} />
          <Route path="/students/distribution" component={DistributionPage} />
          <Route path="/teachers" component={TeachersPage} />
          <Route path="/employees" component={EmployeesPage} />
          <Route path="/library" component={LibraryPage} />
          <Route path="/library/categories" component={CategoriesPage} />
          <Route path="/library/borrows" component={BorrowsPage} />
          <Route path="/library/index" component={IndexPage} />
          <Route path="/library/analytics" component={AnalyticsPage} />
          <Route path="/settings" component={SettingsWithPassword} />
          <Route component={NotFound} />
        </Switch>
      </Shell>
    </ErrorBoundary>
  );
}

function PasswordSettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    if (newPassword.length < 10)
      return setMessage("New password must be at least 10 characters.");
    if (newPassword !== confirmation)
      return setMessage("New passwords do not match.");
    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("school-auth-token") || ""}`,
      },
      body: JSON.stringify({ currentPassword, newUsername, newPassword }),
    });
    const result = await response.json().catch(() => ({}));
    setMessage(
      response.ok
        ? "Password changed successfully."
        : result.error || "Could not change password.",
    );
    if (response.ok) {
      setCurrentPassword("");
      setNewUsername("");
      setNewPassword("");
      setConfirmation("");
    }
  };
  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-6 soft-shadow">
      <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
        Security
      </div>
      <h2 className="mt-1 text-xl font-bold text-[#263064]">
        Change username and password
      </h2>
      <form onSubmit={submit} className="mt-5 grid max-w-md gap-3">
          <label className="grid gap-1.5 text-sm">
            <span>Current password *</span>
            <input
          required
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          placeholder="Current password"
          className="h-10 rounded-lg border border-input bg-card px-3 text-sm"
            />
          </label>
        <label className="grid gap-1.5 text-sm">
          <span>New username *</span>
          <input
          required
          type="text"
          value={newUsername}
          onChange={(event) => setNewUsername(event.target.value)}
          placeholder="New username"
          className="h-10 rounded-lg border border-input bg-card px-3 text-sm"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span>New password *</span>
          <input
          required
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="New password (10+ characters)"
          className="h-10 rounded-lg border border-input bg-card px-3 text-sm"
          />
        </label>
        <input
          required
          type="password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder="Confirm new password"
          className="h-10 rounded-lg border border-input bg-card px-3 text-sm"
        />
        <Button type="submit" className="w-fit bg-[#263064] text-[#FCFBF0]">
          Save credentials
        </Button>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </form>
    </section>
  );
}

function SettingsWithPassword() {
  return (
    <>
      <SettingsPage />
      <PasswordSettings />
    </>
  );
}

function AuthGate() {
  const [ready, setReady] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("school-auth-token"));
    fetch("/api/auth/status")
      .then((response) => response.json())
      .then(async (status) => {
        setSetupRequired(status.setupRequired);
        const token = localStorage.getItem("school-auth-token");
        if (status.setupRequired) return;
        if (!token) return;
        const check = await fetch("/api/dashboard/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (check.ok) setReady(true);
        else localStorage.removeItem("school-auth-token");
      })
      .catch(() =>
        setError("Could not connect to the authentication service."),
      );
  }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const endpoint = setupRequired ? "/api/auth/setup" : "/api/auth/login";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return setError(result.error || "Authentication failed.");
    if (setupRequired) {
      setSetupRequired(false);
      setPassword("");
      return;
    }
    localStorage.setItem("school-auth-token", result.token);
    setAuthTokenGetter(() => localStorage.getItem("school-auth-token"));
    setReady(true);
  };
  if (!ready)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FCFBF0] p-6">
        <form
          onSubmit={submit}
          className="w-full max-w-md rounded-xl border border-border bg-card p-7 soft-shadow"
        >
          <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
            Al-Bassam School
          </div>
          <h1 className="mt-2 text-2xl font-bold text-[#263064]">
            {setupRequired ? "Create account" : "Sign in"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {setupRequired
              ? "Create the username and password required to access this system."
              : "Enter your username and password to continue."}
          </p>
          <input
            autoFocus
            required
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
            className="mt-6 h-11 w-full rounded-lg border border-input px-3 text-sm"
          />
          <input
            required
            minLength={10}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password (10+ characters)"
            className="mt-3 h-11 w-full rounded-lg border border-input px-3 text-sm"
          />
          <Button
            type="submit"
            className="mt-4 w-full bg-[#263064] text-[#FCFBF0]"
          >
            {setupRequired ? "Create account" : "Sign in"}
          </Button>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </form>
      </div>
    );
  return <Router />;
}

function App() {
  const routerBase =
    import.meta.env.BASE_URL === "./"
      ? ""
      : import.meta.env.BASE_URL.replace(/\/$/, "");
  const routerHook =
    window.location.protocol === "file:" ? useDesktopLocation : undefined;
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={routerBase} hook={routerHook}>
            <AuthGate />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}

export default App;
