import {
  createContext,
  type FormEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  ChevronUp,
  ChevronsUpDown,
  CircleCheck,
  Clock3,
  Database,
  Download,
  Filter,
  FileSpreadsheet,
  GraduationCap,
  Image,
  Languages,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  Trophy,
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
  type AcademicYear,
  type BorrowCondition,
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
  useMarkBookCondition,
  useReturnBorrow,
  useUpdateBook,
  useUpdateEmployee,
  useUpdateStudent,
  useUpdateTeacher,
  setAuthTokenGetter,
} from "@workspace/api-client-react";
import { getBooks } from "@workspace/api-client-react";
import {
  getActiveSchoolSystem,
  seedDemoData,
  setActiveSchoolSystem,
  type SchoolSystem,
} from "./api-client/local";
import {
  changeCredentials,
  createSession,
  ensureCredentials,
  isAuthenticated,
  isSeeded,
  logout as webLogout,
  markSeeded,
  verifyLogin,
} from "@/lib/web-auth";
import {
  getAcademicYears,
  getBorrows,
  getEmployees,
  getStudents,
  getTeachers,
} from "@workspace/api-client-react";
import { ErrorBoundary } from "@/components/error-boundary";
import { ImportDialog } from "@/components/import-dialog";
import { ExportMenu } from "@/components/export-menu";
import { NotificationsMenu } from "@/components/notifications-menu";
import { GlobalSearchDialog } from "@/components/global-search-dialog";
import {
  getDefaultAcademicYear,
  getStoredAcademicYearId,
  setStoredAcademicYearId,
} from "@/utils/academic-year";
import { UserNavDropdown } from "@/components/user-nav-dropdown";
import {
  downloadTemplate,
  exportDatabase,
  exportToExcel,
} from "@/utils/import-export";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ConfirmProvider, useConfirm } from "@/hooks/use-confirm";
import NotFound from "@/pages/not-found";
import {
  addSubjectToCatalog,
  getSubjectCatalog,
} from "@/lib/subjects";
import {
  ProfilePictureProvider,
  useProfilePicture,
} from "@/lib/profile-picture";

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

function LocalStoreSync() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const refresh = () => {
      queryClient.invalidateQueries();
    };
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [queryClient]);
  return null;
}

const fallbackSummary = {
  students: 0,
  teachers: 0,
  books: 0,
  availableBooks: 0,
  borrowedBooks: 0,
  lostOrBrokenBooks: 0,
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
let activeLanguage: Language = "ar";
let authToken = "";

function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(activeLanguage);
  const setLanguage = (next: Language) => {
    activeLanguage = next;
    setLanguageState(next);
  };
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.body.dataset.language = language;
    document.body.dir = language === "ar" ? "rtl" : "ltr";
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

type ThemeMode = "light" | "dark";
interface ThemeValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}
const ThemeContext = createContext<ThemeValue>({
  theme: "light",
  toggleTheme: () => undefined,
  setTheme: () => undefined,
});
const useTheme = () => useContext(ThemeContext);

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    return "light";
  });
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);
  const toggleTheme = useCallback(
    () => setTheme((prev) => (prev === "dark" ? "light" : "dark")),
    [],
  );
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex min-w-0 justify-center ${compact ? "mx-auto" : "flex-1"}`}
      data-testid="brand-logo"
    >
      <div
        className={`flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-[0_0_0_1px_rgba(219,180,108,.45),0_3px_12px_rgba(0,0,0,.28)] ${compact ? "h-14 w-14 shrink-0" : "h-14 w-[176px] max-w-full px-2"}`}
      >
        <img
          src={
            compact
              ? "./al-bassam-logo-mark.png"
              : "./al-bassam-logo-trim.png"
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
      {
        label: "History",
        arabic: "سجل الاستعارات",
        href: "/library/history",
      },
      { label: "Index", arabic: "الفهرس", href: "/library/index" },
      { label: "Analytics", arabic: "التحليلات", href: "/library/analytics" },
    ],
  },
];

function Shell({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSystem, setActiveSystem] = useState<SchoolSystem>(() => getActiveSchoolSystem());
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(
    () => false,
  );
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const toggleCollapsed = () =>
    setCollapsed((value) => {
      return !value;
    });
  const { lang: language, setLanguage, t } = useT();
  const { theme, toggleTheme } = useTheme();
  const { profilePicture } = useProfilePicture();
  const sidebarWidth = collapsed ? 64 : 208;
  const text = t;

  const switchSystem = (nextSystem: SchoolSystem) => {
    if (nextSystem === activeSystem) return;
    setActiveSystem(nextSystem);
    setActiveSchoolSystem(nextSystem);
    queryClient.clear();
    void queryClient.refetchQueries({ type: "active" });
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

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
            className={`${language === "ar" ? "mr-auto" : "ml-auto"} rounded-md p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:hidden`}
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
              className="rounded-md bg-white p-1.5 text-foreground shadow-[0_0_0_1px_rgba(219,180,108,.45)] transition-colors hover:bg-white/85 dark:bg-sidebar-accent dark:text-sidebar-accent-foreground dark:hover:bg-sidebar-accent/80"
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
                      className={`group flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-3 transition-all hover:bg-sidebar-accent ${active ? "nav-active bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/65"}`}
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
                        className="rounded-md p-2 text-sidebar-foreground/45 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
                            className={`block rounded-md px-3 py-2 text-[11px] transition-colors ${location === tab.href ? "bg-sidebar-accent/70 font-semibold text-sidebar-accent-foreground" : "text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
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
            className={`group flex items-center gap-3 rounded-lg px-3 py-3 transition-all hover:bg-sidebar-accent ${location === "/settings" ? "nav-active bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/65"}`}
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
              if (
                !window.alBassamDesktop &&
                (import.meta.env.VITE_FRONTEND_ONLY === "true" ||
                  !import.meta.env.VITE_API_URL)
              ) {
                webLogout();
                window.location.reload();
                return;
              }
              await fetch("/api/auth/logout", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${authToken}`,
                },
              });
              authToken = "";
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
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DBB46C] text-xs font-bold text-[#263064] dark:text-[#263064]!">
              LA
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-sidebar-foreground">
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
          className="fixed inset-0 z-30 bg-primary/50 md:hidden"
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
                {text("Al-Bassam School", "مدارس البسام الأهلية")}
              </span>
              <span className="mx-2 text-border">/</span>
              <span>
                {(() => {
                  if (location === "/settings") return text("Settings", "الإعدادات");
                  const parent = navItems.find(
                    (item) =>
                      item.href !== "/" &&
                      (location === item.href ||
                        location.startsWith(`${item.href}/`)),
                  );
                  if (!parent) return text("Overview", "نظرة عامة");
                  const tab = parent.tabs.find(
                    (entry) => entry.href === location,
                  );
                  return tab
                    ? `${text(parent.label, parent.arabic)} / ${text(tab.label, tab.arabic)}`
                    : text(parent.label, parent.arabic);
                })()}
              </span>
            </div>
            <span className="ar hidden text-[11px] text-muted-foreground sm:block">
              البسام
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1 text-[10px] font-semibold text-muted-foreground" dir="ltr">
              <span className="hidden sm:inline">{text("School", "المدرسة")}</span>
              <select
                value={activeSystem}
                onChange={(event) => switchSystem(event.target.value as SchoolSystem)}
                className="bg-transparent text-foreground outline-none"
                aria-label={text("Active school system", "النظام المدرسي النشط")}
                data-testid="select-school-system"
              >
                <option value="boys">{text("Boys School", "مدرسة البنين")}</option>
                <option value="girls">{text("Girls School", "مدرسة البنات")}</option>
              </select>
            </label>
            <div
              className="flex items-center rounded-lg border border-border bg-card p-0.5 text-[10px] font-semibold"
              dir="ltr"
            >
              <button
                onClick={() => setLanguage("en")}
                className={`rounded-md px-2 py-1 transition-colors ${language === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                data-testid="button-language-en"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("ar")}
                className={`rounded-md px-2 py-1 transition-colors ${language === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                data-testid="button-language-ar"
              >
                ع
              </button>
            </div>
            {/* Global Search Button Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 md:flex"
              data-testid="button-global-search"
            >
              <Search size={14} />
              <span>
                {text(
                  "Search workspace...",
                  "ابحث في مساحة العمل...",
                )}
              </span>
              <kbd className="ml-4 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[9px]">
                ⌘ K
              </kbd>
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-card hover:text-primary md:hidden focus:outline-none focus:ring-2 focus:ring-primary/20"
              data-testid="button-global-search-mobile"
              aria-label={text("Search workspace", "البحث في مساحة العمل")}
              title={text("Search workspace", "البحث في مساحة العمل")}
            >
              <Search size={18} />
            </button>

            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-foreground transition-colors hover:bg-muted"
              data-testid="button-theme-toggle"
              aria-label={text("Toggle dark mode", "تبديل الوضع الليلي")}
              title={text("Toggle dark mode", "تبديل الوضع الليلي")}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications Menu Popover */}
            <NotificationsMenu
              t={text}
              language={language}
              onNavigate={navigate}
            />

            <div className="hidden h-7 w-px bg-border sm:block" />

            {/* Reactive Library Admin Dropdown */}
            <UserNavDropdown
              t={text}
              language={language}
              theme={theme}
              profilePicture={profilePicture}
              onLanguageChange={setLanguage}
              onThemeChange={toggleTheme}
              onNavigate={navigate}
            />
          </div>
        </header>
        <GlobalSearchDialog
          open={searchOpen}
          onOpenChange={setSearchOpen}
          t={text}
          language={language}
          onNavigate={navigate}
        />
        <div key={activeSystem} className="px-5 py-7 sm:px-8 lg:px-10">{children}</div>
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
          <h1 className="text-3xl font-bold tracking-[-.04em] text-foreground sm:text-[40px]">
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
  const { t, lang: language } = useT();
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
          <option value={8}>{t("8 / page", "8 / صفحة")}</option>
          <option value={16}>{t("16 / page", "16 / صفحة")}</option>
          <option value={24}>{t("24 / page", "24 / صفحة")}</option>
          <option value={50}>{t("50 / page", "50 / صفحة")}</option>
        </select>
      </div>
      <div className="flex items-center gap-1" dir={language === "ar" ? "rtl" : "ltr"}>
        {language === "ar" ? (
          <>
            <button
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-md border border-border p-1 disabled:opacity-40"
              aria-label={t("Previous page", "الصفحة السابقة")}
            >
              <ChevronRight size={14} />
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
              <ChevronLeft size={14} />
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
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), pageCount);

  const prevTotalRef = useRef(items.length);
  const prevPageSizeRef = useRef(pageSize);

  useEffect(() => {
    if (prevTotalRef.current !== items.length || prevPageSizeRef.current !== pageSize) {
      prevTotalRef.current = items.length;
      prevPageSizeRef.current = pageSize;
      setPage(1);
    }
  }, [items.length, pageSize]);

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

type SortDir = "asc" | "desc";
type SortColumn<T> = {
  key: string;
  accessor: (row: T) => string | number | null | undefined;
};

function useSort<T>(
  items: T[],
  columns: SortColumn<T>[],
  initialKey?: string,
) {
  const [sortKey, setSortKey] = useState<string | undefined>(initialKey);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  const sorted = useMemo(() => {
    if (!sortKey) return items;
    const col = columnsRef.current.find((c) => c.key === sortKey);
    if (!col) return items;
    const mult = sortDir === "asc" ? 1 : -1;
    const arr = [...items];
    arr.sort((a, b) => {
      const av = col.accessor(a);
      const bv = col.accessor(b);
      if (av == null && bv == null) return 0;
      if (av == null) return mult;
      if (bv == null) return -mult;
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else
        cmp = String(av).localeCompare(String(bv), undefined, {
          numeric: true,
          sensitivity: "base",
        });
      return cmp * mult;
    });
    return arr;
  }, [items, sortKey, sortDir]);
  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };
  return { sorted, sortKey, sortDir, toggleSort };
}

function SortHeader({
  columnKey,
  activeKey,
  activeDir,
  onSort,
  align = "center",
  className,
  children,
}: {
  columnKey: string;
  activeKey?: string;
  activeDir: SortDir;
  onSort: (key: string) => void;
  align?: "start" | "center" | "end";
  className?: string;
  children: ReactNode;
}) {
  const active = activeKey === columnKey;
  const alignClass =
    align === "start"
      ? "justify-start text-start"
      : align === "end"
        ? "justify-end text-end"
        : "justify-center text-center";
  return (
    <button
      type="button"
      onClick={() => onSort(columnKey)}
      className={`group inline-flex w-full items-center gap-1.5 outline-none transition-colors ${active ? "text-foreground font-bold" : "hover:text-foreground"} ${alignClass} ${className ?? ""}`}
      data-testid={`button-sort-${columnKey}`}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <span className="inline-flex flex-col leading-none">
          <ChevronUp
            size={9}
            className={active && activeDir === "asc" ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground/70"}
          />
          <ChevronDown
            size={9}
            className={active && activeDir === "desc" ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground/70"}
          />
        </span>
      </span>
    </button>
  );
}

type FilterField = {
  key: string;
  label: string;
  arabic: string;
  options: string[];
  accessor: (row: any) => string;
};

function useTableFilters(fields: FilterField[]) {
  const [values, setValues] = useState<Record<string, string>>({});
  const activeCount = Object.values(values).filter(Boolean).length;
  const setFilter = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));
  const resetFilter = (key?: string) =>
    setValues((prev) => {
      if (!key) return {};
      const next = { ...prev };
      delete next[key];
      return next;
    });
  const matches = (filters: Record<string, string>, row: any) =>
    fields.every((field) => {
      const value = filters[field.key];
      if (!value) return true;
      return String(field.accessor(row) ?? "") === value;
    });
  return { values, activeCount, setFilter, resetFilter, matches };
}

function TableFilterBar({
  fields,
  values,
  setFilter,
  resetFilter,
  activeCount,
  t,
}: {
  fields: FilterField[];
  values: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  resetFilter: (key?: string) => void;
  activeCount: number;
  t: (en: string, ar: string) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`hidden items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider sm:inline-flex ${activeCount ? "text-primary" : "text-muted-foreground"}`}
      >
        <Filter size={13} />
        {t("Filter", "التصفية")}
        {activeCount > 0 && (
          <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </span>
      {fields.map((field) => (
        <div
          key={field.key}
          className="flex items-center gap-1 rounded-lg border border-border bg-card px-2"
        >
          {values[field.key] && (
            <button
              onClick={() => resetFilter(field.key)}
              className="rounded p-0.5 text-muted-foreground hover:text-primary"
              aria-label={t("Clear", "مسح")}
              data-testid={`filter-clear-${field.key}`}
            >
              <X size={13} />
            </button>
          )}
          <select
            value={values[field.key] ?? ""}
            onChange={(event) =>
              event.target.value
                ? setFilter(field.key, event.target.value)
                : resetFilter(field.key)
            }
            className={`h-9 bg-transparent text-xs font-medium outline-none ${values[field.key] ? "text-primary" : "text-muted-foreground"}`}
            data-testid={`filter-${field.key}`}
          >
            <option value="">
              {t(field.label, field.arabic)}
            </option>
            {field.options.map((option) => {
              const displayLabel = field.key === "gender"
                ? option === "male" ? "Boy" : "Girl"
                : option;
              const displayArabic = field.key === "gender"
                ? option === "male" ? "ولد" : "بنت"
                : option;
              return (
                <option key={option} value={option}>
                  {t(displayLabel, displayArabic)}
                </option>
              );
            })}
          </select>
        </div>
      ))}
      {activeCount > 0 && (
        <button
          onClick={() => resetFilter(undefined)}
          className="rounded-md px-2 py-1 text-[11px] font-semibold text-primary hover:underline"
          data-testid="button-clear-all-filters"
        >
          {t("Clear all", "مسح الكل")}
        </button>
      )}
    </div>
  );
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
      <h3 className="font-semibold text-foreground">{title}</h3>
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
    navy: "bg-primary text-primary-foreground",
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
        <strong className="font-mono text-[29px] tracking-[-.06em] text-foreground">
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
  const { t, lang: language } = useT();
  const [activityTab, setActivityTab] = useState<"all" | "borrows" | "books" | "students">("all");

  const summaryQuery = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() },
  });
  const borrowsQuery = useGetBorrows(undefined, {
    query: { queryKey: getGetBorrowsQueryKey(undefined) },
  });
  const booksQuery = useGetBooks(undefined, {
    query: { queryKey: getGetBooksQueryKey(undefined) },
  });
  const studentsQuery = useGetStudents(undefined, {
    query: { queryKey: getGetStudentsQueryKey(undefined) },
  });

  const rawBorrows = Array.isArray(borrowsQuery.data) ? borrowsQuery.data : [];
  const rawBooks = Array.isArray(booksQuery.data) ? booksQuery.data : [];
  const rawStudents = Array.isArray(studentsQuery.data) ? studentsQuery.data : [];
  const mostBorrowedStudents = useMemo(() => {
    const counts = new Map<number, { student: (typeof rawStudents)[number]; count: number }>();
    rawBorrows.forEach((borrow) => {
      if (borrow.borrowerType !== "student" || borrow.studentId == null) return;
      const student = rawStudents.find((item) => item.id === borrow.studentId);
      if (!student) return;
      const current = counts.get(student.id);
      counts.set(student.id, { student, count: (current?.count ?? 0) + 1 });
    });
    return Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [rawBorrows, rawStudents]);

  const summaryData = summaryQuery.data ?? fallbackSummary;
  const totalBooks = rawBooks.reduce((sum, b) => sum + Number(b.copies || 0), 0) || Number(summaryData.books ?? 0);
  const availableBooks = rawBooks.reduce((sum, b) => sum + Number(b.availableCopies ?? b.copies ?? 0), 0) || Number(summaryData.availableBooks ?? 0);
  const activeBorrows = rawBorrows.filter((b) => !b.returnedAt);
  const borrowedCount = activeBorrows.length || Number(summaryData.borrowedBooks ?? 0);
  const lostOrBroken = rawBooks.reduce((sum, b) => sum + Number(b.lostCopies || 0) + Number(b.damagedCopies || 0), 0);
  const totalStudents = rawStudents.length || Number(summaryData.students ?? 0);
  const totalTeachers = Number(summaryData.teachers ?? 0);
  const totalEmployees = Number(summaryData.employees ?? 0);

  // Critical alerts
  const overdueBorrows = activeBorrows.filter((b) => {
    if (!b.dueDate) return false;
    const due = new Date(b.dueDate);
    due.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return due.getTime() < now.getTime();
  });

  const dueSoonBorrows = activeBorrows.filter((b) => {
    if (!b.dueDate) return false;
    const due = new Date(b.dueDate);
    due.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 3;
  });

  const outOfStockBooks = rawBooks.filter((b) => (b.availableCopies ?? b.copies) === 0 && b.copies > 0);

  const loanRate = totalBooks > 0 ? Math.round((borrowedCount / totalBooks) * 100) : 0;
  const availRate = totalBooks > 0 ? Math.round((availableBooks / totalBooks) * 100) : 0;

  // Live Operations Feed
  const liveActivities = useMemo(() => {
    const list: Array<{
      id: string;
      category: "borrows" | "books" | "students";
      title: string;
      subtitle: string;
      badge: string;
      badgeTone: "amber" | "green" | "navy" | "teal" | "red";
      timestamp: string;
      icon: typeof BookOpen;
      path: string;
    }> = [];

    // Recent borrows
    for (const b of rawBorrows.slice(0, 8)) {
      const isReturned = Boolean(b.returnedAt);
      const isOverdue = !isReturned && b.dueDate && new Date(b.dueDate).getTime() < Date.now();
      list.push({
        id: `borrow-${b.id}`,
        category: "borrows",
        title: isReturned
          ? `${t("Book Returned", "إرجاع كتاب")}: "${b.bookTitle || t("Book", "الكتاب")}"`
          : `${t("Book Loaned", "إعارة كتا��")}: "${b.bookTitle || t("Book", "الكتاب")}"`,
        subtitle: `${t("Borrower", "المستعير")}: ${b.borrowerName || "—"} · ${isReturned ? t("Returned", "تم الإرجاع") : `${t("Due", "الاستحقاق")}: ${formatDate(b.dueDate ? String(b.dueDate) : undefined)}`}`,
        badge: isReturned
          ? (b.condition === "damaged" ? t("Damaged", "تالف") : b.condition === "lost" ? t("Lost", "مفقود") : t("Returned", "مُرجع"))
          : (isOverdue ? t("Overdue", "متأخر") : t("Active", "نشطة")),
        badgeTone: isReturned ? "green" : isOverdue ? "red" : "amber",
        timestamp: String(b.returnedAt || b.borrowedAt || new Date().toISOString()),
        icon: isReturned ? CircleCheck : BookOpen,
        path: isReturned ? "/library/history" : "/library/borrows",
      });
    }

    // Recent books
    for (const bk of rawBooks.slice(0, 4)) {
      list.push({
        id: `book-${bk.id}`,
        category: "books",
        title: `${t("Catalogue Book", "كتاب في الفهرس")}: "${bk.title}"`,
        subtitle: `${bk.author || "—"} · ${bk.category || t("General", "عام")} · ${t("Shelf", "الرف")} ${bk.shelf || "—"}`,
        badge: `${bk.availableCopies ?? bk.copies}/${bk.copies} ${t("avail", "متاح")}`,
        badgeTone: (bk.availableCopies ?? bk.copies) > 0 ? "teal" : "red",
        timestamp: new Date().toISOString(),
        icon: Library,
        path: "/library",
      });
    }

    // Recent students
    for (const s of rawStudents.slice(0, 4)) {
      list.push({
        id: `student-${s.id}`,
        category: "students",
        title: `${t("Student Record", "سجل طالب")}: ${s.fullNameArabic || s.fullName}`,
        subtitle: `${s.grade || ""} · ${s.className || ""} · ID: ${s.studentNumber || "—"}`,
        badge: t("Enrolled", "مقيد"),
        badgeTone: "navy",
        timestamp: String((s as any).enrollmentDate || (s as any).enrolmentDate || new Date().toISOString()),
        icon: GraduationCap,
        path: "/students",
      });
    }

    return list;
  }, [rawBorrows, rawBooks, rawStudents, t]);

  const filteredActivities = useMemo(() => {
    if (activityTab === "all") return liveActivities;
    return liveActivities.filter((a) => a.category === activityTab);
  }, [liveActivities, activityTab]);

  return (
    <div className="rise-in">
      <PageHeading
        eyebrow="School pulse · 01"
        eyebrowAr="نبض المدرسة · 01"
        title="Good morning, admin."
        arabic="صباح الخير، آمين المكتبة."
        description={t(
          "A composed live view of library circulation, student enrolments, and key school operations.",
          "نظرة حية متكاملة على حركة الإعارة المكتبية، سجلات الطلاب، ومؤشرات العمليات المدرسية اليوم.",
        )}
        action={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setLocation("/library/borrows")}
              className="h-11 rounded-lg bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90 gap-1.5"
              data-testid="button-open-borrows"
            >
              <BookOpen size={16} />
              {t("Active Borrows", "الإعارات النشطة")}
            </Button>
            <Button
              onClick={() => setLocation("/students")}
              variant="outline"
              className="h-11 rounded-lg border-border px-4 text-sm gap-1.5"
              data-testid="button-open-students"
            >
              <GraduationCap size={16} />
              {t("Student Records", "سجلات الطلاب")}
            </Button>
          </div>
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
              value={totalStudents.toLocaleString()}
              icon={GraduationCap}
              tone="navy"
              note={t("Active enrolment directory", "سجلات الطلاب المقيدين")}
            />
            <StatCard
              label="Teachers"
              arabic="المعلمون"
              value={totalTeachers.toLocaleString()}
              icon={UsersRound}
              tone="teal"
              note={t("Teaching faculty directory", "دليل أعضاء هيئة التدريس")}
            />
            <StatCard
              label="Employees"
              arabic="الموظفون"
              value={totalEmployees.toLocaleString()}
              icon={Briefcase}
              tone="sky"
              note={t("Administrative & staff members", "أعضاء الكادر الإداري")}
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total books"
              arabic="إجمالي الكتب"
              value={totalBooks.toLocaleString()}
              icon={BookOpen}
              tone="gold"
              note={t("All copies in catalogue", "جميع النسخ في الفهرس")}
            />
            <StatCard
              label="Available books"
              arabic="الكتب المتاحة"
              value={availableBooks.toLocaleString()}
              icon={BookOpen}
              tone="teal"
              note={t("Currently on shelf", "موجودة على الرف حالياً")}
            />
            <StatCard
              label="Borrowed books"
              arabic="الكتب المُعارة"
              value={borrowedCount.toLocaleString()}
              icon={BookOpen}
              tone="navy"
              note={t("Currently on loan", "مستعارة حالياً")}
            />
            <StatCard
              label="Lost/Broken books"
              arabic="الكتب المفقودة أو التالفة"
              value={lostOrBroken.toLocaleString()}
              icon={Activity}
              tone="sky"
              note={t("Requiring replacement", "كتب تحتاج إلى معالجة")}
            />
          </div>
        </>
      )}

      <section className="mt-6 rounded-xl border border-border bg-card p-6 soft-shadow">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">{t("Student circulation", "حركة الطلاب")}</div>
            <h2 className="mt-1 text-xl font-bold text-foreground">{t("Most borrowed students", "أكثر الطلاب استعارة")}</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation("/library/analytics")}>{t("View analytics", "عرض التحليلات")}</Button>
        </div>
        {mostBorrowedStudents.length ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {mostBorrowedStudents.map(({ student, count }, index) => (
              <div key={student.id} className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex items-center justify-between text-xs font-bold text-primary"><span>#{index + 1}</span><span>{count} {t("loans", "إعارات")}</span></div>
                <div className="mt-2 truncate text-sm font-semibold text-foreground">{student.fullName}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{student.grade} · {student.className}</div>
              </div>
            ))}
          </div>
        ) : <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{t("No student borrowing activity yet.", "لا توجد حركة استعارة للطلاب بعد.")}</div>}
      </section>

      {/* Main Operational Section: Live Stream & Quick Action Center */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        
        {/* Left: Live Operations & Circulation Stream */}
        <section className="rounded-xl border border-border bg-card p-6 soft-shadow flex flex-col justify-between">
          <div>
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                  {t("Live Feed", "العمليات الحية")}
                </div>
                <h2 className="mt-0.5 text-xl font-bold tracking-[-.03em] text-foreground">
                  {t("Circulation & Operational Activity", "حركة الإعارة والنشاط التشغيلي")}
                </h2>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1 text-xs">
                <button
                  onClick={() => setActivityTab("all")}
                  className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${activityTab === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t("All", "الكل")}
                </button>
                <button
                  onClick={() => setActivityTab("borrows")}
                  className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${activityTab === "borrows" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t("Borrows", "الإعارات")}
                </button>
                <button
                  onClick={() => setActivityTab("books")}
                  className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${activityTab === "books" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t("Books", "الكتب")}
                </button>
                <button
                  onClick={() => setActivityTab("students")}
                  className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${activityTab === "students" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t("Students", "الطلاب")}
                </button>
              </div>
            </div>

            {/* List */}
            {summaryQuery.isLoading ? (
              <div className="space-y-4 py-2">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div className="flex gap-4 items-center" key={item}>
                    <div className="skeleton h-10 w-10 rounded-lg shrink-0" />
                    <div className="flex-1">
                      <div className="skeleton h-3.5 w-3/5 rounded" />
                      <div className="skeleton mt-2 h-2.5 w-2/5 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredActivities.length > 0 ? (
              <div className="space-y-1.5 divide-y divide-border/40">
                {filteredActivities.slice(0, 6).map((item) => {
                  const Icon = item.icon;
                  const toneClasses = {
                    amber: "bg-[#DBB46C]/20 text-[#EC9F42]",
                    green: "bg-[#32B77E]/15 text-[#32B77E]",
                    navy: "bg-primary/10 text-foreground",
                    teal: "bg-[#14BAC6]/15 text-[#14BAC6]",
                    red: "bg-[#B92327]/10 text-[#B92327]",
                  }[item.badgeTone];

                  return (
                    <div
                      key={item.id}
                      onClick={() => setLocation(item.path)}
                      className="group flex cursor-pointer items-center justify-between gap-3.5 rounded-lg p-2.5 transition-all hover:bg-secondary/50"
                      data-testid={`activity-item-${item.id}`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClasses}`}>
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-foreground group-hover:text-primary">
                            {item.title}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${toneClasses}`}>
                          {item.badge}
                        </span>
                        <ArrowUpRight
                          size={14}
                          className="text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {t(
                  "No operational activity recorded in this category yet.",
                  "لا توجد عمليات مسجلة في هذا التصنيف حالياً.",
                )}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t("Total active operations monitored", "إجمالي العمليات المدارة نشطة ومحدثة")}
            </span>
            <button
              onClick={() => setLocation("/library/history")}
              className="font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>{t("View Full History", "عرض السجل الكامل")}</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </section>

        {/* Right: Quick Action Hub & Priority Controls */}
        <section className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 soft-shadow">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#DBB46C]/20 text-[#EC9F42]">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                    {t("Operations Hub", "مركز العمليات")}
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    {t("Priority & Quick Access", "المهام والوصول السريع")}
                  </h3>
                </div>
              </div>
            </div>

            {/* Critical Attention Alerts */}
            <div className="mt-4 space-y-2">
              {overdueBorrows.length > 0 ? (
                <div
                  onClick={() => setLocation("/library/borrows")}
                  className="cursor-pointer rounded-lg border border-[#B92327]/30 bg-[#B92327]/5 p-3 text-xs transition-colors hover:bg-[#B92327]/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={15} className="text-[#B92327] shrink-0" />
                    <span className="font-semibold text-[#B92327]">
                      {overdueBorrows.length} {t("Overdue loan(s) require return", "إعارة متأخرة تتطلب المتابعة")}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#B92327] underline">
                    {t("Resolve", "معالجة")}
                  </span>
                </div>
              ) : dueSoonBorrows.length > 0 ? (
                <div
                  onClick={() => setLocation("/library/borrows")}
                  className="cursor-pointer rounded-lg border border-[#DBB46C]/40 bg-[#DBB46C]/10 p-3 text-xs transition-colors hover:bg-[#DBB46C]/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Clock3 size={15} className="text-[#EC9F42] shrink-0" />
                    <span className="font-semibold text-foreground">
                      {dueSoonBorrows.length} {t("Loan(s) due within 3 days", "إعارة تستحق خلال 3 أيام")}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-primary underline">
                    {t("View", "عرض")}
                  </span>
                </div>
              ) : (
                <div className="rounded-lg border border-[#32B77E]/30 bg-[#32B77E]/5 p-3 text-xs flex items-center gap-2 text-[#32B77E]">
                  <CircleCheck size={15} className="shrink-0" />
                  <span className="font-semibold">
                    {t("All borrows up to date & in order", "كافة الإعارات منتظمة ولا توجد متأخرات")}
                  </span>
                </div>
              )}

              {outOfStockBooks.length > 0 && (
                <div
                  onClick={() => setLocation("/library")}
                  className="cursor-pointer rounded-lg border border-border bg-muted/40 p-2.5 text-xs transition-colors hover:bg-muted/70 flex items-center justify-between text-muted-foreground"
                >
                  <span>
                    📦 {outOfStockBooks.length} {t("book(s) with 0 available stock", "كتب نفدت جميع نسخها المتاحة")}
                  </span>
                  <ArrowUpRight size={13} />
                </div>
              )}
            </div>

            {/* Quick Action Shortcuts Grid */}
            <div className="mt-5">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("Quick Actions", "إجراءات مباشرة")}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLocation("/library/borrows")}
                  className="flex flex-col items-start gap-1 rounded-lg border border-border bg-primary/5 p-3 text-start transition-colors hover:border-primary/50 hover:bg-primary/10"
                  data-testid="quick-action-borrow"
                >
                  <BookOpen size={16} className="text-foreground" />
                  <span className="text-xs font-bold text-foreground">
                    {t("Issue Loan", "إعارة كتاب")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {t("Lend to student", "إعارة لطالب/معلم")}
                  </span>
                </button>

                <button
                  onClick={() => setLocation("/library")}
                  className="flex flex-col items-start gap-1 rounded-lg border border-border bg-[#14BAC6]/5 p-3 text-start transition-colors hover:border-[#14BAC6]/50 hover:bg-[#14BAC6]/10"
                  data-testid="quick-action-add-book"
                >
                  <Plus size={16} className="text-[#14BAC6]" />
                  <span className="text-xs font-bold text-foreground">
                    {t("Add Book", "إضافة كتاب")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {t("To master catalogue", "إلى الفهرس العام")}
                  </span>
                </button>

                <button
                  onClick={() => setLocation("/students")}
                  className="flex flex-col items-start gap-1 rounded-lg border border-border bg-card p-3 text-start transition-colors hover:border-primary/50 hover:bg-muted"
                  data-testid="quick-action-add-student"
                >
                  <GraduationCap size={16} className="text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    {t("Enrol Student", "تسجيل طالب")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {t("New academic record", "سجل دراسي جديد")}
                  </span>
                </button>

                <button
                  onClick={() => setLocation("/library/analytics")}
                  className="flex flex-col items-start gap-1 rounded-lg border border-border bg-card p-3 text-start transition-colors hover:border-primary/50 hover:bg-muted"
                  data-testid="quick-action-reports"
                >
                  <FileSpreadsheet size={16} className="text-[#32B77E]" />
                  <span className="text-xs font-bold text-foreground">
                    {t("Export Reports", "التقارير و Excel")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {t("Download reports", "تصدير الإحصائيات")}
                  </span>
                </button>
              </div>
            </div>

            {/* Circulation Capacity Meters */}
            <div className="mt-5 space-y-2.5 rounded-lg border border-border bg-muted/20 p-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                  <span>{t("Library Circulation Rate", "معدل إشغال المكتبة")}</span>
                  <span className="font-mono">{loanRate}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[#14BAC6]"
                    style={{ width: `${loanRate}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>{borrowedCount} {t("copies on loan", "نسخة معارة")}</span>
                  <span>{totalBooks} {t("total copies", "إجمالي النسخ")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Status Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3.5 text-xs soft-shadow">
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#32B77E] animate-pulse" />
          <span className="font-bold text-foreground">
            {t("System Status: Online & Locally Persistent", "حالة النظام: متصل وجاهز للعمل مع المزامنة المحلية")}
          </span>
        </div>
        <div className="flex items-center gap-5 text-muted-foreground text-[11px]">
          <span>
            {t("Standalone Desktop Ready", "جاهز للعمل المكتبي المستقل")}
          </span>
          <span className="text-border">|</span>
          <span>
            {t("Arabic (RTL) & English (LTR) Enabled", "اللغة العربية والإنجليزية مفعلة")}
          </span>
        </div>
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
  const studentsQuery = useGetStudents({}, { query: { queryKey: getGetStudentsQueryKey() } });
  const existingStudents = Array.isArray(studentsQuery.data) ? studentsQuery.data : [];
  const uniqueGrades = Array.from(new Set(existingStudents.map((s) => s.grade).filter(Boolean)));
  const uniqueClasses = Array.from(new Set(existingStudents.map((s) => s.className).filter(Boolean)));
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
    options?: [string, string, string][];
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
          <DialogHeader className="border-b border-border bg-card px-6 py-5 text-start">
            <div className="flex items-start justify-between pe-8">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                  {t(
                    isEditing ? "Edit record" : "New enrolment",
                    isEditing ? "تعديل السجل" : "تسجيل جديد",
                  )}
                </div>
                <DialogTitle className="mt-1 text-2xl text-foreground">
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
            {fields.map((field) => {
              if (field.options) {
                return (
                  <label className="block" key={field.key}>
                    <span className="mb-1.5 flex items-baseline justify-between text-xs font-semibold text-foreground">
                      <span>{t(field.label, field.arabic)} *</span>
                      <span className={`text-[9px] font-normal text-muted-foreground ${t("ar", "en") === "ar" ? "" : "ar"}`}>
                        {t(field.arabic, field.label)}
                      </span>
                    </span>
                    <select
                      required
                      value={String(form[field.key] ?? "")}
                      onChange={(event) => set(field.key, event.target.value)}
                      className="h-10 w-full cursor-pointer rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary"
                      data-testid={`input-student-${field.key}`}
                    >
                      <option value="">{t("Select gender", "اختر الجنس")}</option>
                      {field.options.map(([value, label, ar]) => (
                        <option key={value} value={value}>{t(label, ar)}</option>
                      ))}
                    </select>
                  </label>
                );
              }
              if (field.key === "grade") {
                return (
                  <label className="block" key={field.key}>
                    <span className="mb-1.5 flex items-baseline justify-between text-xs font-semibold text-foreground">
                      <span>{t(field.label, field.arabic)} *</span>
                      <span className={`text-[9px] font-normal text-muted-foreground ${t("ar", "en") === "ar" ? "" : "ar"}`}>
                        {t(field.arabic, field.label)}
                      </span>
                    </span>
                    <select
                      required
                      value={String(form[field.key] ?? "")}
                      onChange={(event) => set(field.key, event.target.value)}
                      className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary"
                      data-testid={`input-student-${field.key}`}
                    >
                      <option value="">{t("Select grade", "اختر الصف")}</option>
                      {uniqueGrades.map((grade) => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </label>
                );
              }
              if (field.key === "className") {
                return (
                  <label className="block" key={field.key}>
                    <span className="mb-1.5 flex items-baseline justify-between text-xs font-semibold text-foreground">
                      <span>{t(field.label, field.arabic)} *</span>
                      <span className={`text-[9px] font-normal text-muted-foreground ${t("ar", "en") === "ar" ? "" : "ar"}`}>
                        {t(field.arabic, field.label)}
                      </span>
                    </span>
                    <select
                      required
                      value={String(form[field.key] ?? "")}
                      onChange={(event) => set(field.key, event.target.value)}
                      className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary"
                      data-testid={`input-student-${field.key}`}
                    >
                      <option value="">{t("Select class", "اختر الفصل")}</option>
                      {uniqueClasses.map((className) => (
                        <option key={className} value={className}>{className}</option>
                      ))}
                    </select>
                  </label>
                );
              }
              return (
                <label className="block" key={field.key}>
                  <span className="mb-1.5 flex items-baseline justify-between text-xs font-semibold text-foreground">
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
              );
            })}
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-foreground">
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
              className="bg-primary text-primary-foreground hover:bg-primary/85"
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
  selected,
  onSelect,
}: {
  student: Student;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  selected: boolean;
  onSelect: (checked: boolean) => void;
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
      className="group grid min-w-[1000px] grid-cols-[2fr_.7fr_1.1fr_1.15fr_.9fr_1.25fr_1fr_.8fr_88px] items-center border-b border-border/70 px-5 py-3 transition-colors hover:bg-secondary/40"
      data-testid={`row-student-${student.id}`}
    >
      <div className="flex items-center gap-3 text-start">
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          aria-label={t(`Select ${student.fullName}`, `تحديد ${student.fullName}`)}
          data-testid={`checkbox-student-${student.id}`}
        />
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#14BAC6]/10 text-xs font-bold text-[#14BAC6]">
          {student.fullName
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">
            {student.fullName}
          </div>
          <div className="ar truncate text-[10px] text-muted-foreground">
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
      <div className="justify-self-center text-center">
        <div className="text-xs font-medium text-foreground">
          {student.grade}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {student.className}
        </div>
      </div>
      <div className="text-start text-xs text-muted-foreground">
        <div className="truncate">{student.guardianName || t("Not provided", "غير مُدخل")}</div>
        <div className="mt-0.5 font-mono text-[10px] rtl:text-right" dir="ltr">
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
      <div className="flex justify-center items-center gap-1 opacity-40 transition-opacity group-hover:opacity-100">
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Student | undefined>();
  const [toast, setToast] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const { t } = useT();
  const confirm = useConfirm();
  const query = useGetStudents(
    {
      search: search || undefined,
    },
    {
      query: {
        queryKey: getGetStudentsQueryKey({
          search: search || undefined,
        }),
      },
    },
  );
  const deletion = useDeleteStudent();
  const createStudent = useCreateStudent();
  const queryClient = useQueryClient();
  const students = Array.isArray(query.data) ? query.data : [];
  const sortColumns: SortColumn<Student>[] = [
    { key: "fullName", accessor: (s) => s.fullName },
    { key: "studentNumber", accessor: (s) => s.studentNumber },
    { key: "nationalId", accessor: (s) => s.nationalId },
    { key: "class", accessor: (s) => `${s.grade ?? ""} ${s.className ?? ""}` },
    { key: "guardian", accessor: (s) => s.guardianName },
    { key: "enrollmentDate", accessor: (s) => s.enrollmentDate },
    { key: "status", accessor: (s) => s.status },
  ];
  const { sorted, sortKey, sortDir, toggleSort } = useSort<Student>(
    students,
    sortColumns,
    "fullName",
  );
  const filterFields: FilterField[] = [
    {
      key: "status",
      label: "Status",
      arabic: "الحالة",
      options: ["active", "inactive", "graduated"],
      accessor: (s) => s.status,
    },
  ];
  const filters = useTableFilters(filterFields);
  const filtered = useMemo(
    () => sorted.filter((s) => filters.matches(filters.values, s)),
    [sorted, filters.values, filterFields],
  );
  const studentPages = usePagination(filtered);
  const visibleStudentIds = studentPages.pageItems.map((student) => student.id);
  const allVisibleStudentsSelected = visibleStudentIds.length > 0 && visibleStudentIds.every((id) => selectedIds.has(id));
  const toggleStudentSelection = (id: number, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };
  const toggleAllVisibleStudents = (checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      visibleStudentIds.forEach((id) => checked ? next.add(id) : next.delete(id));
      return next;
    });
  };
  const removeSelectedStudents = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    confirm({
      title: t(`Delete ${ids.length} selected students?`, `حذف ${ids.length} من الطلاب المحددين؟`),
      description: t("These records will be permanently deleted. This cannot be undone.", "سيتم حذف هذه السجلات نهائيًا. لا يمكن التراجع عن هذا الإجراء."),
      confirmLabel: t("Delete selected", "حذف المحدد"),
      destructive: true,
    }, () => {
      Promise.all(ids.map((id) => new Promise<void>((resolve) => deletion.mutate({ id }, { onSettled: () => resolve() })))).then(() => {
        setSelectedIds(new Set());
        queryClient.invalidateQueries({ queryKey: getGetStudentsQueryKey() });
        setToast(t(`${ids.length} student records deleted`, `تم حذف ${ids.length} من سجلات الطلاب`));
      });
    });
  };
  const openNew = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };
  const edit = (student: Student) => {
    setEditing(student);
    setDialogOpen(true);
  };
  const remove = (student: Student) => {
    confirm(
      {
        title: t(
          `Delete ${student.fullName}?`,
          `حذف ${student.fullName}؟`,
        ),
        description: t(
          `Delete ${student.fullName} from the directory? This cannot be undone.`,
          `حذف ${student.fullName} من الدليل؟ لا يمكن التراجع عن هذا الإجراء.`,
        ),
        confirmLabel: t("Delete", "حذف"),
        destructive: true,
      },
      () =>
        deletion.mutate(
          { id: student.id },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: getGetStudentsQueryKey() });
              setToast(t("Student record deleted", "تم حذف سجل الطالب"));
            },
          },
        ),
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
              className="h-11 rounded-lg bg-primary px-5 text-primary-foreground hover:bg-primary/85"
              data-testid="button-add-student"
            >
              <Plus size={17} /> {t("Add student", "إضافة طالب")}
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
              "Search by name or student number",
              "ابحث بالاسم أو رقم الطالب",
            )}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            data-testid="input-search-students"
          />
        </div>
        <TableFilterBar
          fields={filterFields}
          values={filters.values}
          setFilter={filters.setFilter}
          resetFilter={filters.resetFilter}
          activeCount={filters.activeCount}
          t={t}
        />
      </div>
      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3" data-testid="toolbar-student-bulk-actions">
          <span className="text-sm font-semibold text-foreground">{t(`${selectedIds.size} students selected`, `تم تحديد ${selectedIds.size} طالب`)}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>{t("Clear selection", "إلغاء التحديد")}</Button>
            <Button variant="destructive" size="sm" onClick={removeSelectedStudents} disabled={deletion.isPending}>
              <Trash2 data-icon="inline-start" /> {t("Delete selected", "حذف المحدد")}
            </Button>
          </div>
        </div>
      )}
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
            search || filters.activeCount > 0
              ? t(
                  "No students match this view",
                  "لا يوجد طلاب مطابقون لهذا العرض",
                )
              : t("Start your student directory", "ابدأ دليل الطلاب")
          }
          detail={
            search || filters.activeCount > 0
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
            !search && filters.activeCount === 0 ? (
              <Button onClick={openNew} data-testid="button-empty-add-student">
                <Plus size={15} /> {t("Add first student", "إضافة أول طالب")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card soft-shadow">
          <div className="grid min-w-[1000px] grid-cols-[2fr_.7fr_1.1fr_1.15fr_.9fr_1.25fr_1fr_.8fr_88px] items-center border-b border-border bg-primary/5 px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
            <div className="flex items-center gap-3">
              <Checkbox checked={allVisibleStudentsSelected} onCheckedChange={(checked) => toggleAllVisibleStudents(checked === true)} aria-label={t("Select all visible students", "تحديد جميع الطلاب الظاهرين")} data-testid="checkbox-select-all-students" />
              <SortHeader
              columnKey="fullName"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="start"
            >
              <span className="truncate">{t("Student", "الطالب")}</span>
            </SortHeader>
            </div>
            <SortHeader
              columnKey="studentNumber"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Number", "الرقم")}
            </SortHeader>
            <SortHeader
              columnKey="nationalId"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("National ID", "الهوية الوطنية")}
            </SortHeader>
            <SortHeader
              columnKey="class"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Class", "الفصل")}
            </SortHeader>
            <SortHeader
              columnKey="guardian"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="start"
            >
              {t("Guardian", "ولي الأمر")}
            </SortHeader>
            <SortHeader
              columnKey="enrollmentDate"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Enrolled", "تاريخ التسجيل")}
            </SortHeader>
            <SortHeader
              columnKey="status"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Status", "الحالة")}
            </SortHeader>
            <span className="text-center">{t("Actions", "إجراءات")}</span>
          </div>
          {studentPages.pageItems.map((student) => (
            <StudentRow
              key={student.id}
              student={student}
              onEdit={edit}
              onDelete={remove}
              selected={selectedIds.has(student.id)}
              onSelect={(checked) => toggleStudentSelection(student.id, checked)}
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
    title: "Personal information",
    titleAr: "البيانات الشخصية",
    fields: [
      { key: "name", label: "Name", arabic: "الاسم", required: true },
      { key: "surname", label: "Surname", arabic: "اللقب", required: true },
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
          ["male", "Male", "ذكر"],
          ["female", "Female", "أنثى"],
        ],
      },
      {
        key: "maritalStatus",
        label: "Marital status",
        arabic: "الحالة الاجتماعية",
        options: [
          ["single", "Single", "أعزب"],
          ["married", "Married", "متزوج"],
          ["divorced", "Divorced", "مطلق"],
          ["widowed", "Widowed", "أرمل"],
        ],
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
        required: true,
      },
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
        key: "status",
        label: "Status",
        arabic: "الحالة",
        options: [
          ["active", "Active", "نشط"],
          ["inactive", "Inactive", "غير نشط"],
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
  const subjectCatalog = useMemo(() => getSubjectCatalog(), []);
  useEffect(() => {
    if (!open) return;
    if (editing && editing.subject) {
      const inCatalog = subjectCatalog.some(
        (s) => s.toLowerCase() === editing.subject!.toLowerCase(),
      );
      setCustomSubject(inCatalog ? "" : editing.subject);
    } else {
      setCustomSubject("");
    }
  }, [open, editing, subjectCatalog]);
  const create = useCreateTeacher();
  const update = useUpdateTeacher();
  const queryClient = useQueryClient();
  const isEditing = Boolean(editing);
  const set = (key: string, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const [customSubject, setCustomSubject] = useState("");
  const customSubjectActive =
    String(form.subject ?? "") === "__custom__" ||
    (Boolean(form.subject) &&
      !subjectCatalog.some(
        (s) => s.toLowerCase() === String(form.subject).toLowerCase(),
      ) &&
      String(form.subject) !== "");
  const resolvedSubject = customSubjectActive
    ? customSubject || ""
    : String(form.subject ?? "");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !String(form.name ?? "").trim() ||
      !String(form.surname ?? "").trim() ||
      !String(form.employeeCode ?? "").trim()
    )
      return;
    const subject = resolvedSubject;
    if (customSubjectActive) {
      const trimmed = customSubject.trim();
      if (trimmed) {
        addSubjectToCatalog(trimmed);
      }
    }
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
      ...(subject.trim() ? { subject: subject.trim() } : {}),
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
          <DialogHeader className="border-b border-border bg-card px-6 py-5 text-start">
            <div className="flex items-start justify-between pe-8">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                  {t(
                    isEditing ? "Edit record" : "New faculty member",
                    isEditing ? "تعديل السجل" : "عضو هيئة تدريس جديد",
                  )}
                </div>
                <DialogTitle className="mt-1 text-2xl text-foreground">
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
                      <span className="mb-1.5 flex items-baseline justify-between text-xs font-semibold text-foreground">
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
                        field.key === "subject" ? (
                          <>
                            <select
                              value={
                                customSubjectActive
                                  ? "__custom__"
                                  : String(form[field.key] ?? "")
                              }
                              onChange={(event) => {
                                set("subject", event.target.value);
                              }}
                              className={`${inputCls} cursor-pointer appearance-none`}
                              data-testid={`input-teacher-${field.key}`}
                            >
                              {subjectCatalog.map((subject) => (
                                <option key={subject} value={subject}>
                                  {subject}
                                </option>
                              ))}
                              <option value="__custom__">
                                {t("Custom subject…", "مادة مخصصة…")}
                              </option>
                            </select>
                            {customSubjectActive && (
                              <input
                                type="text"
                                value={customSubject}
                                onChange={(event) =>
                                  setCustomSubject(event.target.value)
                                }
                                placeholder={t(
                                  "Type a new subject",
                                  "اكتب مادة جديدة",
                                )}
                                className={`${inputCls} mt-2`}
                                data-testid="input-teacher-subject-custom"
                              />
                            )}
                          </>
                        ) : (
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
                        )
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
              className="bg-primary text-primary-foreground hover:bg-primary/85"
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
  selected = false,
  onSelect,
}: {
  teacher: Teacher;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
  selected?: boolean;
  onSelect?: (checked: boolean) => void;
}) {
  const { t } = useT();
  const statusLabel =
    teacher.status === "active" ? t("active", "نشط") : t("inactive", "غير نشط");
  return (
    <div
      className="group grid min-w-[900px] grid-cols-[2fr_1fr_1.1fr_1.2fr_1.1fr_.85fr_88px] items-center border-b border-border/70 px-5 py-3 transition-colors hover:bg-secondary/40"
      data-testid={`row-teacher-${teacher.id}`}
    >
      <div className="flex items-center gap-3 text-start">
        {onSelect && <Checkbox checked={selected} onCheckedChange={(checked) => onSelect(checked === true)} aria-label={`Select ${teacher.fullName}`} data-testid={`checkbox-teacher-${teacher.id}`} />}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#14BAC6]/10 text-xs font-bold text-[#14BAC6]">
          {teacher.fullName
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">
            {teacher.fullName}
          </div>
          <div className="ar truncate text-[10px] text-muted-foreground">
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
      <div className="justify-self-center text-center text-xs font-medium text-foreground">
        {teacher.subject}
      </div>
      <span
        className="justify-self-center text-center font-mono text-xs text-muted-foreground"
        dir="ltr"
      >
        {teacher.nationalId}
      </span>
      <span
        className="justify-self-center text-center font-mono text-xs text-muted-foreground"
        dir="ltr"
      >
        {teacher.phone}
      </span>
      <span
        className={`w-fit justify-self-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${teacher.status === "active" ? "bg-[#32B77E]/15 text-[#32B77E]" : "bg-muted text-muted-foreground"}`}
      >
        {statusLabel}
      </span>
      <div className="flex justify-center items-center gap-1 opacity-40 transition-opacity group-hover:opacity-100">
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
          <DialogHeader className="border-b border-border bg-card px-6 py-5 text-start">
            <div className="flex items-start justify-between pe-8">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                  {t(
                    isEditing ? "Edit record" : "New staff member",
                    isEditing ? "تعديل السجل" : "موظف جديد",
                  )}
                </div>
                <DialogTitle className="mt-1 text-2xl text-foreground">
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
                <span className="mb-1.5 flex items-baseline justify-between text-xs font-semibold text-foreground">
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
              <span className="mb-1.5 block text-xs font-semibold text-foreground">
                {t("Status", "الحالة")}
              </span>
              <select
                value={form.status}
                onChange={(event) => set("status", event.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary"
                data-testid="input-employee-status"
              >
                <option value="active">{t("Active", "��شط")}</option>
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
              className="bg-primary text-primary-foreground hover:bg-primary/85"
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
  selected = false,
  onSelect,
}: {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  selected?: boolean;
  onSelect?: (checked: boolean) => void;
}) {
  const { t } = useT();
  const statusLabel =
    employee.status === "active"
      ? t("active", "نشط")
      : t("inactive", "غير نشط");
  return (
    <div
      className="group grid min-w-[900px] grid-cols-[2fr_1fr_1.1fr_1.2fr_1.1fr_.85fr_88px] items-center border-b border-border/70 px-5 py-3 transition-colors hover:bg-secondary/40"
      data-testid={`row-employee-${employee.id}`}
    >
      <div className="flex items-center gap-3 text-start">
        {onSelect && <Checkbox checked={selected} onCheckedChange={(checked) => onSelect(checked === true)} aria-label={`Select ${employee.fullName}`} data-testid={`checkbox-employee-${employee.id}`} />}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DBB46C]/20 text-xs font-bold text-[#EC9F42]">
          {employee.fullName
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">
            {employee.fullName}
          </div>
          <div className="ar truncate text-[10px] text-muted-foreground">
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
      <div className="justify-self-center text-center text-xs font-medium text-foreground">
        {employee.jobTitle}
      </div>
      <span
        className="justify-self-center text-center font-mono text-xs text-muted-foreground"
        dir="ltr"
      >
        {employee.nationalId}
      </span>
      <span
        className="justify-self-center text-center font-mono text-xs text-muted-foreground"
        dir="ltr"
      >
        {employee.phone}
      </span>
      <span
        className={`w-fit justify-self-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${employee.status === "active" ? "bg-[#32B77E]/15 text-[#32B77E]" : "bg-muted text-muted-foreground"}`}
      >
        {statusLabel}
      </span>
      <div className="flex justify-center items-center gap-1 opacity-40 transition-opacity group-hover:opacity-100">
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const { t } = useT();
  const confirm = useConfirm();
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
  const sortColumns: SortColumn<Employee>[] = [
    { key: "fullName", accessor: (e) => e.fullName },
    { key: "employeeNumber", accessor: (e) => e.employeeNumber },
    { key: "jobTitle", accessor: (e) => e.jobTitle },
    { key: "nationalId", accessor: (e) => e.nationalId },
    { key: "phone", accessor: (e) => e.phone },
    { key: "status", accessor: (e) => e.status },
  ];
  const { sorted, sortKey, sortDir, toggleSort } = useSort<Employee>(
    employees,
    sortColumns,
    "fullName",
  );
  const filterFields: FilterField[] = [
    {
      key: "jobTitle",
      label: "Job title",
      arabic: "المسمى الوظيفي",
      options: Array.from(
        new Set(employees.map((e) => e.jobTitle).filter(Boolean)),
      ).sort() as string[],
      accessor: (e) => e.jobTitle,
    },
    {
      key: "status",
      label: "Status",
      arabic: "الحالة",
      options: ["active", "inactive"],
      accessor: (e) => e.status,
    },
  ];
  const filters = useTableFilters(filterFields);
  const filteredEmployees = useMemo(() => {
    return sorted.filter((e) => {
      if (!search) return filters.matches(filters.values, e);
      const f = filters.matches(filters.values, e);
      if (!f) return false;
      const q = search.toLowerCase();
      return (e.fullName || "").toLowerCase().includes(q) || (e.fullNameArabic || "").toLowerCase().includes(q) || (e.jobTitle || "").toLowerCase().includes(q) || (e.employeeNumber || "").toLowerCase().includes(q);
    });
  }, [sorted, search, filters.values, filterFields]);
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
    confirm(
      {
        title: t(`Delete ${employee.fullName}?`, `حذف ${employee.fullName}؟`),
        description: t(
          `Delete ${employee.fullName} from the staff directory? This cannot be undone.`,
          `حذف ${employee.fullName} من سجل الموظفين؟ لا يمكن التراجع عن هذا الإجراء.`,
        ),
        confirmLabel: t("Delete", "حذف"),
        destructive: true,
      },
      () =>
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
        ),
    );
  };
  const visibleEmployeeIds = employeePages.pageItems.map((employee) => employee.id);
  const allVisibleEmployeesSelected = visibleEmployeeIds.length > 0 && visibleEmployeeIds.every((id) => selectedIds.has(id));
  const toggleEmployeeSelection = (id: number, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };
  const toggleAllVisibleEmployees = (checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      visibleEmployeeIds.forEach((id) => checked ? next.add(id) : next.delete(id));
      return next;
    });
  };
  const removeSelectedEmployees = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    confirm({
      title: t(`Delete ${ids.length} selected employees?`, `حذف ${ids.length} من الموظفين المحددين؟`),
      description: t("These records will be permanently deleted. This cannot be undone.", "سيتم حذف هذه السجلات نهائيًا. لا يمكن التراجع عن هذا الإجراء."),
      confirmLabel: t("Delete selected", "حذف المحدد"),
      destructive: true,
    }, () => {
      Promise.all(ids.map((id) => new Promise<void>((resolve) => deletion.mutate({ id }, { onSettled: () => resolve() })))).then(() => {
        setSelectedIds(new Set());
        queryClient.invalidateQueries({ queryKey: getGetEmployeesQueryKey() });
        setToast(t(`${ids.length} employee records deleted`, `تم حذف ${ids.length} من سجلات الموظفين`));
      });
    });
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
              className="h-11 rounded-lg bg-primary px-5 text-primary-foreground hover:bg-primary/85"
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
        <TableFilterBar
          fields={filterFields}
          values={filters.values}
          setFilter={filters.setFilter}
          resetFilter={filters.resetFilter}
          activeCount={filters.activeCount}
          t={t}
        />
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
      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3" data-testid="toolbar-employee-bulk-actions">
          <span className="text-sm font-semibold text-foreground">{t(`${selectedIds.size} employees selected`, `تم تحديد ${selectedIds.size} موظف`)}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>{t("Clear selection", "إلغاء التحديد")}</Button>
            <Button variant="destructive" size="sm" onClick={removeSelectedEmployees} disabled={deletion.isPending}>
              <Trash2 data-icon="inline-start" /> {t("Delete selected", "حذف المحدد")}
            </Button>
          </div>
        </div>
      )}
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
          <div className="grid min-w-[900px] grid-cols-[2fr_1fr_1.1fr_1.2fr_1.1fr_.85fr_88px] items-center border-b border-border bg-primary/5 px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
            <div className="flex items-center gap-3">
              <Checkbox checked={allVisibleEmployeesSelected} onCheckedChange={(checked) => toggleAllVisibleEmployees(checked === true)} aria-label={t("Select all visible employees", "تحديد جميع الموظفين الظاهرين")} data-testid="checkbox-select-all-employees" />
              <SortHeader
              columnKey="fullName"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="start"
            >
              <span className="truncate">{t("Employee", "الموظف")}</span>
            </SortHeader>
            </div>
            <SortHeader
              columnKey="employeeNumber"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Employee No", "الرقم الوظيفي")}
            </SortHeader>
            <SortHeader
              columnKey="jobTitle"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Job title", "المسمى الوظيفي")}
            </SortHeader>
            <SortHeader
              columnKey="nationalId"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("National ID", "الهوية الوطنية")}
            </SortHeader>
            <SortHeader
              columnKey="phone"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Phone", "الهاتف")}
            </SortHeader>
            <SortHeader
              columnKey="status"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Status", "الحالة")}
            </SortHeader>
            <span className="text-center">{t("Actions", "إجراءات")}</span>
          </div>
          {employeePages.pageItems.map((employee) => (
            <EmployeeRow
              key={employee.id}
              employee={employee}
              onEdit={edit}
              onDelete={remove}
              selected={selectedIds.has(employee.id)}
              onSelect={(checked) => toggleEmployeeSelection(employee.id, checked)}
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const { t } = useT();
  const confirm = useConfirm();
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
  const sortColumns: SortColumn<Teacher>[] = [
    { key: "fullName", accessor: (te) => te.fullName },
    { key: "employeeCode", accessor: (te) => te.employeeCode },
    { key: "subject", accessor: (te) => te.subject },
    { key: "nationalId", accessor: (te) => te.nationalId },
    { key: "phone", accessor: (te) => te.phone },
    { key: "status", accessor: (te) => te.status },
  ];
  const { sorted, sortKey, sortDir, toggleSort } = useSort<Teacher>(
    teachers,
    sortColumns,
    "fullName",
  );
  const filterFields: FilterField[] = [
    {
      key: "subject",
      label: "Subject",
      arabic: "المادة",
      options: Array.from(
        new Set(teachers.map((te) => te.subject).filter(Boolean)),
      ).sort() as string[],
      accessor: (te) => te.subject,
    },
    {
      key: "status",
      label: "Status",
      arabic: "الحالة",
      options: ["active", "inactive"],
      accessor: (te) => te.status,
    },
  ];
  const filters = useTableFilters(filterFields);
  const filteredTeachers = useMemo(() => {
    return sorted.filter((te) => {
      const f = filters.matches(filters.values, te);
      if (!f) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (te.fullName || "").toLowerCase().includes(q) || (te.fullNameArabic || "").toLowerCase().includes(q) || (te.subject || "").toLowerCase().includes(q) || (te.employeeCode || "").toLowerCase().includes(q);
    });
  }, [sorted, search, filters.values, filterFields]);
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
    confirm(
      {
        title: t(`Delete ${teacher.fullName}?`, `حذف ${teacher.fullName}؟`),
        description: t(
          `Delete ${teacher.fullName} from the faculty directory? This cannot be undone.`,
          `حذف ${teacher.fullName} من دليل هيئة التدريس؟ لا يمكن التراجع عن هذا الإجراء.`,
        ),
        confirmLabel: t("Delete", "حذف"),
        destructive: true,
      },
      () =>
        deletion.mutate(
          { id: teacher.id },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: getGetTeachersQueryKey() });
              setToast(t("Teacher record deleted", "تم حذف سجل المعلم"));
            },
          },
        ),
    );
  };
  const visibleTeacherIds = teacherPages.pageItems.map((teacher) => teacher.id);
  const allVisibleTeachersSelected = visibleTeacherIds.length > 0 && visibleTeacherIds.every((id) => selectedIds.has(id));
  const toggleTeacherSelection = (id: number, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };
  const toggleAllVisibleTeachers = (checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      visibleTeacherIds.forEach((id) => checked ? next.add(id) : next.delete(id));
      return next;
    });
  };
  const removeSelectedTeachers = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    confirm({
      title: t(`Delete ${ids.length} selected teachers?`, `حذف ${ids.length} من المعلمين المحددين؟`),
      description: t("These records will be permanently deleted. This cannot be undone.", "سيتم حذف هذه السجلات نهائيًا. لا يمكن التراجع عن هذا الإجراء."),
      confirmLabel: t("Delete selected", "حذف المحدد"),
      destructive: true,
    }, () => {
      Promise.all(ids.map((id) => new Promise<void>((resolve) => deletion.mutate({ id }, { onSettled: () => resolve() })))).then(() => {
        setSelectedIds(new Set());
        queryClient.invalidateQueries({ queryKey: getGetTeachersQueryKey() });
        setToast(t(`${ids.length} teacher records deleted`, `تم حذف ${ids.length} من سجلات المعلمين`));
      });
    });
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
              className="h-11 rounded-lg bg-primary px-5 text-primary-foreground hover:bg-primary/85"
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
        <TableFilterBar
          fields={filterFields}
          values={filters.values}
          setFilter={filters.setFilter}
          resetFilter={filters.resetFilter}
          activeCount={filters.activeCount}
          t={t}
        />
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
      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3" data-testid="toolbar-teacher-bulk-actions">
          <span className="text-sm font-semibold text-foreground">{t(`${selectedIds.size} teachers selected`, `تم تحديد ${selectedIds.size} معلم`)}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>{t("Clear selection", "إلغاء التحديد")}</Button>
            <Button variant="destructive" size="sm" onClick={removeSelectedTeachers} disabled={deletion.isPending}>
              <Trash2 data-icon="inline-start" /> {t("Delete selected", "حذف المحدد")}
            </Button>
          </div>
        </div>
      )}
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
          <div className="grid min-w-[900px] grid-cols-[2fr_1fr_1.1fr_1.2fr_1.1fr_.85fr_88px] items-center border-b border-border bg-primary/5 px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
            <div className="flex items-center gap-3">
              <Checkbox checked={allVisibleTeachersSelected} onCheckedChange={(checked) => toggleAllVisibleTeachers(checked === true)} aria-label={t("Select all visible teachers", "تحديد جميع المعلمين الظاهرين")} data-testid="checkbox-select-all-teachers" />
              <SortHeader
              columnKey="fullName"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="start"
            >
              <span className="truncate">{t("Teacher", "المعلم")}</span>
            </SortHeader>
            </div>
            <SortHeader
              columnKey="employeeCode"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Employee No", "الرقم الوظيفي")}
            </SortHeader>
            <SortHeader
              columnKey="subject"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Subject", "المادة")}
            </SortHeader>
            <SortHeader
              columnKey="nationalId"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("National ID", "الهوية الوطنية")}
            </SortHeader>
            <SortHeader
              columnKey="phone"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Phone", "الهاتف")}
            </SortHeader>
            <SortHeader
              columnKey="status"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Status", "الحالة")}
            </SortHeader>
            <span className="text-center">{t("Actions", "إجراءات")}</span>
          </div>
          {teacherPages.pageItems.map((teacher) => (
            <TeacherRow
              key={teacher.id}
              teacher={teacher}
              onEdit={edit}
              onDelete={remove}
              selected={selectedIds.has(teacher.id)}
              onSelect={(checked) => toggleTeacherSelection(teacher.id, checked)}
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
  activeBorrowedCopies = 0,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Book;
  onSaved: (message: string) => void;
  presetBarcode?: string;
  categories: string[];
  activeBorrowedCopies?: number;
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
  const currentCopies = Number(form.copies ?? editing?.copies ?? 1);
  const minTotalCopies = activeBorrowedCopies;
  const lostCopies = editing?.lostCopies ?? 0;
  const damagedCopies = editing?.damagedCopies ?? 0;
  const previewAvailable = Math.max(
    currentCopies - activeBorrowedCopies - lostCopies - damagedCopies,
    0,
  );
  const copiesBelowFloor =
    isEditing && Number.isFinite(currentCopies) && currentCopies < minTotalCopies;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !String(form.title ?? "").trim() ||
      (!String(form.category ?? "").trim() &&
        !String(form.customCategory ?? "").trim())
    )
      return;
    if (isEditing && currentCopies < minTotalCopies) return;
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
          required: true,
        },
        {
          key: "category",
          label: "Category",
          arabic: "التصنيف",
          required: true,
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
          required: true,
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
        { key: "shelf", label: "Shelf", arabic: "الرف" },
      ],
    },
    {
      title: "Copies & status",
      titleAr: "النسخ والحالة",
      fields: [
        { key: "copies", label: "Copies", arabic: "عدد النسخ", type: "number", required: true },
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
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-3xl overflow-y-auto border-border bg-[#FCFBF0] p-0">
        <form onSubmit={submit}>
          <DialogHeader className="border-b border-border bg-card px-6 py-5 text-start">
            <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
              {t(
                "Library catalogue",
                "\u0641\u0647\u0631\u0633\u0020\u0627\u0644\u0645\u0643\u062A\u0628\u0629",
              )}
            </div>
            <DialogTitle className="mt-1 text-2xl text-foreground">
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
                      <span className="mb-1.5 flex items-baseline justify-between text-xs font-semibold text-foreground">
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
                          required={field.required && field.key !== "category"}
                          value={String(form[field.key] ?? "")}
                          onChange={(event) =>
                            set(field.key, event.target.value)
                          }
                          className={`${inputCls} cursor-pointer appearance-none`}
                          data-testid={`input-book-${field.key}`}
                        >
                          {field.required && (
                            <option value="">
                              {t("Select…", "اختر…")}
                            </option>
                          )}
                          {field.options.map(([value, label, ar]) => (
                            <option key={value} value={value}>
                              {t(label, ar)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          required={field.required}
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
                {section.title === "Copies & status" && isEditing && (
                  <div className="mt-4 rounded-lg border border-border bg-card/60 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                      {t("Copies distribution", "توزيع النسخ")}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {t("Total copies", "إجمالي النسخ")}
                        </div>
                        <div className="mt-0.5 font-mono text-lg font-bold text-foreground">
                          {currentCopies}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {t("Active borrows", "الإعارات النشطة")}
                        </div>
                        <div className="mt-0.5 font-mono text-lg font-bold text-[#DBB46C]">
                          {activeBorrowedCopies}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {t("Lost + Damaged", "مفقود + تالف")}
                        </div>
                        <div className="mt-0.5 font-mono text-lg font-bold text-destructive">
                          {lostCopies + damagedCopies}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {t("Available", "متاح")}
                        </div>
                        <div className="mt-0.5 font-mono text-lg font-bold text-[#32B77E]">
                          {previewAvailable}
                        </div>
                      </div>
                    </div>
                    {copiesBelowFloor && (
                      <p
                        className="mt-3 flex items-center gap-2 text-sm font-medium text-destructive"
                        data-testid="error-book-copies"
                      >
                        <AlertTriangle size={15} />
                        {t(
                          `Total copies cannot be below the ${minTotalCopies} copies currently on loan.`,
                          `لا يمكن أن يقل إجمالي النسخ عن ${minTotalCopies} نسخة معارة حالياً.`,
                        )}
                      </p>
                    )}
                  </div>
                )}
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
              disabled={pending || copiesBelowFloor}
              className="bg-primary text-primary-foreground hover:bg-primary/85"
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
          <DialogHeader className="border-b border-border bg-card px-6 py-5 text-start">
            <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
              {t("Library lending", "إعارات المكتبة")}
            </div>
            <DialogTitle className="mt-1 text-2xl text-foreground">
              {t("Borrow this book", "استعارة الكتاب")}
            </DialogTitle>
            <DialogDescription className="mt-1">
              {book
                ? `${book.title}${(book.availableCopies ?? 0) > 0 ? ` · ${book.availableCopies ?? 0}/${book.copies} ${t("available", "متاح")}` : ""}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-6 py-6">
            <label className="grid gap-1.5 text-start">
              <span className="text-xs font-semibold text-foreground">{t("Borrower type", "نوع المستعير")} *</span>
              <select value={borrowerType} onChange={(event) => { setBorrowerType(event.target.value as typeof borrowerType); setBorrowerId(""); }} className="h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" data-testid="select-borrower-type">
                <option value="student">{t("Student", "الطالب")}</option>
                <option value="teacher">{t("Teacher", "المعلم")}</option>
                <option value="employee">{t("Employee", "الموظف")}</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-start">
              <span className="text-xs font-semibold text-foreground">
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
            <label className="grid gap-1.5 text-start">
              <span className="text-xs font-semibold text-foreground">
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
              className="h-10 rounded-lg bg-primary px-4 text-primary-foreground hover:bg-primary/85"
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
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
  const confirm = useConfirm();
  const query = useGetBooks(
    { search: search || undefined },
    {
      query: {
        queryKey: getGetBooksQueryKey({
          search: search || undefined,
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
  const markCondition = useMarkBookCondition();
  const queryClient = useQueryClient();
  const books = Array.isArray(query.data) ? query.data : [];
  const borrows = Array.isArray(borrowsQuery.data) ? borrowsQuery.data : [];
  const borrowPages = usePagination(borrows);
  const sortColumns: SortColumn<Book>[] = [
    { key: "title", accessor: (book) => book.title },
    { key: "author", accessor: (book) => book.author },
    { key: "language", accessor: (book) => book.language },
    { key: "copies", accessor: (book) => book.availableCopies ?? book.copies },
    { key: "shelf", accessor: (book) => book.shelf },
    { key: "isbn", accessor: (book) => book.isbn },
    { key: "category", accessor: (book) => book.category },
  ];
  const { sorted: sortedBooks, sortKey, sortDir, toggleSort } = useSort<Book>(
    books,
    sortColumns,
    "title",
  );
  const filterFields: FilterField[] = [
    {
      key: "category",
      label: "Category",
      arabic: "التصنيف",
      options: Array.from(
        new Set(books.map((book) => book.category).filter(Boolean)),
      ).sort() as string[],
      accessor: (book) => book.category,
    },
    {
      key: "language",
      label: "Language",
      arabic: "اللغة",
      options: Array.from(
        new Set(books.map((book) => book.language).filter(Boolean)),
      ).sort() as string[],
      accessor: (book) => book.language,
    },
    {
      key: "status",
      label: "Status",
      arabic: "الحالة",
      options: ["available", "borrowed", "lost", "damaged"],
      accessor: (book) => book.status || "available",
    },
  ];
  const filters = useTableFilters(filterFields);
  const filteredBooks = useMemo(
    () => sortedBooks.filter((book) => filters.matches(filters.values, book)),
    [sortedBooks, filters.values, filterFields],
  );
  const bookPages = usePagination(filteredBooks);
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
    confirm(
      {
        title: t(`Delete “${book.title}”?`, `حذف "${book.title}"؟`),
        description: t(
          `Delete “${book.title}” from the catalogue? This cannot be undone.`,
          `حذف "${book.title}" من الفهرس؟ لا يمكن التراجع عن هذا الإجراء.`,
        ),
        confirmLabel: t("Delete", "حذف"),
        destructive: true,
      },
      () =>
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
        ),
    );
  };
  const scannedBook = scanned?.status === "found" ? scanned.book : undefined;
  const handleConditionChange = (
    book: Book,
    action: "lost" | "damaged" | "fixed" | "found",
  ) => {
    const label =
      action === "lost"
        ? t("Mark a copy as lost", "وضع علامة على نسخة كمفقودة")
        : action === "damaged"
          ? t("Mark a copy as damaged", "وضع علامة على نسخة كتالفة")
          : action === "fixed"
            ? t("Restore a damaged copy", "استعادة نسخة تالفة")
            : t("Restore a lost copy", "استعادة نسخة مفقودة");
    confirm(
      {
        title: label,
        description: t(
          `Are you sure you want to ${action === "fixed" || action === "found" ? "restore" : "mark"} “${book.title}”?`,
          action === "fixed" || action === "found"
            ? `هل تريد استعادة "${book.title}"؟`
            : `هل تريد وضع علامة على "${book.title}"؟`,
        ),
        confirmLabel: t("Yes", "نعم"),
        destructive: action === "lost" || action === "damaged",
      },
      () =>
        markCondition.mutate(
          { id: book.id, data: { action } },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: getGetBooksQueryKey() });
              setToast(
                t(
                  `Copy marked as ${action}`,
                  action === "lost"
                    ? "تم وضع علامة ��لى نسخة كمفقودة"
                    : action === "damaged"
                      ? "تم وضع علامة على نسخة كتالفة"
                      : action === "fixed"
                        ? "تم استعادة النسخة التالفة"
                        : "تم استعادة النسخة المفقودة",
                ),
              );
            },
          },
        ),
    );
  };
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
  const visibleBookIds = bookPages.pageItems.map((book) => book.id);
  const allVisibleBooksSelected = visibleBookIds.length > 0 && visibleBookIds.every((id) => selectedIds.has(id));
  const toggleBookSelection = (id: number, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };
  const toggleAllVisibleBooks = (checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      visibleBookIds.forEach((id) => checked ? next.add(id) : next.delete(id));
      return next;
    });
  };
  const removeSelectedBooks = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    confirm({
      title: t(`Delete ${ids.length} selected books?`, `حذف ${ids.length} من الكتب المحددة؟`),
      description: t("These records will be permanently deleted. This cannot be undone.", "سيتم حذف هذه السجلات نهائيًا. لا يمكن التراجع عن هذا الإجراء."),
      confirmLabel: t("Delete selected", "حذف المحدد"),
      destructive: true,
    }, () => {
      Promise.all(ids.map((id) => new Promise<void>((resolve) => deletion.mutate({ id }, { onSettled: () => resolve() })))).then(() => {
        setSelectedIds(new Set());
        queryClient.invalidateQueries({ queryKey: getGetBooksQueryKey() });
        setScanned(undefined);
        setToast(t(`${ids.length} books removed from the catalogue`, `تم حذف ${ids.length} من الكتب من الفهرس`));
      });
    });
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
              className="h-11 rounded-lg bg-primary px-5 text-primary-foreground hover:bg-primary/85"
              data-testid="button-add-book"
            >
              <Plus size={17} /> {t("Add book", "إضافة كتاب")}
            </Button>
          </div>
        }
      />
      <form
        onSubmit={handleScan}
        className="mb-5 flex flex-col gap-2 rounded-xl border border-[#DBB46C]/50 bg-gradient-to-l from-[#FCFBF0] to-[#DBB46C]/15 p-4 sm:flex-row sm:items-center dark:border-[#DBB46C]/40 dark:from-card dark:to-[#DBB46C]/10"
        data-testid="form-scan-barcode"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-[#DBB46C]">
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
              <div className="line-clamp-1 text-sm font-bold text-foreground">
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
                className="h-9 bg-primary px-3 text-xs text-primary-foreground hover:bg-primary/85"
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
              className="h-9 shrink-0 bg-primary px-3 text-xs hover:bg-primary/85"
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
          <TableFilterBar
            fields={filterFields}
            values={filters.values}
            setFilter={filters.setFilter}
            resetFilter={filters.resetFilter}
            activeCount={filters.activeCount}
            t={t}
          />
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
      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3" data-testid="toolbar-book-bulk-actions">
          <span className="text-sm font-semibold text-foreground">{t(`${selectedIds.size} books selected`, `تم تحديد ${selectedIds.size} كتاب`)}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>{t("Clear selection", "إلغاء التحديد")}</Button>
            <Button variant="destructive" size="sm" onClick={removeSelectedBooks} disabled={deletion.isPending}>
              <Trash2 data-icon="inline-start" /> {t("Delete selected", "حذف المحدد")}
            </Button>
          </div>
        </div>
      )}
      {toast && (
        <div
          className="mb-4 flex items-center gap-2 rounded-lg border border-[#32B77E]/35 bg-[#32B77E]/10 px-4 py-3 text-sm text-[#32B77E] rise-in"
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
            search || filters.activeCount > 0
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
            search || filters.activeCount > 0
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
            !search && filters.activeCount === 0 ? (
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
          <div className="grid min-w-[920px] grid-cols-[2fr_1.1fr_.8fr_1.25fr_.75fr_1.1fr_250px] items-center border-b border-border bg-primary/5 px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
            <div className="flex items-center gap-3">
              <Checkbox checked={allVisibleBooksSelected} onCheckedChange={(checked) => toggleAllVisibleBooks(checked === true)} aria-label={t("Select all visible books", "تحديد جميع الكتب الظاهرة")} data-testid="checkbox-select-all-books" />
              <SortHeader
              columnKey="title"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="start"
            >
              <span className="truncate">{t("Book", "الكتاب")}</span>
            </SortHeader>
            </div>
            <SortHeader
              columnKey="author"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="start"
            >
              {t("Author", "المؤلف")}
            </SortHeader>
            <SortHeader
              columnKey="language"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Language", "اللغة")}
            </SortHeader>
            <SortHeader
              columnKey="copies"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Copies", "النسخ")}
            </SortHeader>
            <SortHeader
              columnKey="shelf"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Shelf", "الرف")}
            </SortHeader>
            <SortHeader
              columnKey="isbn"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Barcode", "الباركود")}
            </SortHeader>
            <span className="text-end pr-3">{t("Actions", "إجراءات")}</span>
          </div>
          {bookPages.pageItems.map((book) => (
            <BookRow
              key={book.id}
              book={book}
              onEdit={edit}
              onDelete={remove}
              onConditionChange={handleConditionChange}
              selected={selectedIds.has(book.id)}
              onSelect={(checked) => toggleBookSelection(book.id, checked)}
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
        activeBorrowedCopies={
          editing ? borrows.filter((b) => b.bookId === editing.id).length : 0
        }
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
                <h2 className="mt-0.5 text-sm font-bold text-foreground">
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
                  <div className="line-clamp-1 text-sm font-semibold text-foreground">
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
                <ReturnBorrowControls
                  borrow={borrow}
                  mutation={returnBorrow}
                  onSuccess={() => {
                    queryClient.invalidateQueries({
                      queryKey: getGetBorrowsQueryKey(),
                    });
                    queryClient.invalidateQueries({
                      queryKey: getGetBooksQueryKey(),
                    });
                    setToast(t("Book returned to the shelf", "عاد الكتاب إلى الرف"));
                  }}
                />
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
  onConditionChange,
  selected = false,
  onSelect,
}: {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onConditionChange: (book: Book, action: "lost" | "damaged" | "fixed" | "found") => void;
  selected?: boolean;
  onSelect?: (checked: boolean) => void;
}) {
  const { t } = useT();
  const available = book.availableCopies ?? book.copies;
  const lostCopies = book.lostCopies ?? 0;
  const damagedCopies = book.damagedCopies ?? 0;
  const percent = book.copies ? Math.round((available / book.copies) * 100) : 0;
  return (
    <div
      className="group grid min-w-[920px] grid-cols-[2fr_1.1fr_.8fr_1.25fr_.75fr_1.1fr_250px] items-center border-b border-border/70 px-5 py-3 transition-colors hover:bg-secondary/40"
      data-testid={`row-book-${book.id}`}
    >
      <div className="flex items-center gap-3 text-start">
        {onSelect && <Checkbox checked={selected} onCheckedChange={(checked) => onSelect(checked === true)} aria-label={`Select ${book.title}`} data-testid={`checkbox-book-${book.id}`} />}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#DBB46C]/20 text-[#EC9F42]">
          <BookOpen size={17} strokeWidth={1.7} />
        </div>
        <div className="min-w-0">
          <div className="line-clamp-1 text-sm font-semibold text-foreground">
            {book.title}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[.12em] text-muted-foreground">
            <span>{book.category}</span>
            {lostCopies > 0 && (
              <span
                className="rounded-full bg-[#B92327]/10 px-1.5 py-0.5 normal-case tracking-normal text-[#B92327]"
                data-testid={`badge-book-lost-${book.id}`}
              >
                {lostCopies} {t("lost", "مفقود")}
              </span>
            )}
            {damagedCopies > 0 && (
              <span
                className="rounded-full bg-accent/20 px-1.5 py-0.5 normal-case tracking-normal text-accent-foreground dark:text-[#EC9F42]"
                data-testid={`badge-book-damaged-${book.id}`}
              >
                {damagedCopies} {t("damaged", "تالف")}
              </span>
            )}
          </div>
        </div>
      </div>
      <span className="text-start text-xs text-muted-foreground truncate">{book.author || "—"}</span>
      <span className="w-fit justify-self-center rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-primary">
        {book.language || "—"}
      </span>
      <div className="flex items-center justify-center gap-2.5">
        <div className="h-1.5 w-full max-w-[100px] overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${percent > 50 ? "bg-primary" : percent ? "bg-accent" : "bg-destructive"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-center font-mono text-xs font-bold text-foreground">
          {available}/{book.copies}
        </span>
      </div>
      <span className="justify-self-center text-center text-xs text-muted-foreground">
        {book.shelf ? `${t("Shelf", "الرف")} ${book.shelf}` : "—"}
      </span>
      <span
        className="justify-self-center text-center font-mono text-xs text-muted-foreground"
        dir="ltr"
      >
        {book.isbn || "—"}
      </span>
      <div className="flex flex-col items-end gap-1">
        <div className="flex justify-end gap-1">
          <button
            onClick={() => onEdit(book)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
            data-testid={`button-edit-book-${book.id}`}
            aria-label={`Edit ${book.title}`}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(book)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-[#B92327]/10 hover:text-destructive"
            data-testid={`button-delete-book-${book.id}`}
            aria-label={`Delete ${book.title}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
        <div className="grid w-full max-w-[190px] grid-cols-2 gap-1">
          <button
            onClick={() => onConditionChange(book, "lost")}
            disabled={available <= 0}
            className="rounded-md border border-destructive/25 px-2 py-1 text-[10px] font-semibold text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
            data-testid={`button-lost-book-${book.id}`}
          >
            {t("Lost", "مفقود")}
          </button>
          <button
            onClick={() => onConditionChange(book, "damaged")}
            disabled={available <= 0}
            className="rounded-md border border-accent/40 px-2 py-1 text-[10px] font-semibold text-accent-foreground hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-40 dark:text-[#EC9F42] dark:border-accent/50"
            data-testid={`button-damaged-book-${book.id}`}
          >
            {t("Broken", "تالف")}
          </button>
          <button
            onClick={() => onConditionChange(book, "fixed")}
            disabled={damagedCopies <= 0}
            className="rounded-md border border-primary/25 px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
            data-testid={`button-repair-book-${book.id}`}
          >
            {t("Repair", "إصلاح")}
          </button>
          <button
            onClick={() => onConditionChange(book, "found")}
            disabled={lostCopies <= 0}
            className="rounded-md border border-[#32B77E]/40 px-2 py-1 text-[10px] font-semibold text-[#23865C] hover:bg-[#32B77E]/10 disabled:cursor-not-allowed disabled:opacity-40"
            data-testid={`button-found-book-${book.id}`}
          >
            {t("Found", "تم العثور عليه")}
          </button>
        </div>
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
  type FlatRow = { grade: string; klass: string; count: number; key: string };
  const sortColumns: SortColumn<FlatRow>[] = [
    { key: "grade", accessor: (r) => r.grade },
    { key: "klass", accessor: (r) => r.klass },
    { key: "count", accessor: (r) => r.count },
  ];
  const { sorted, sortKey, sortDir, toggleSort } = useSort<FlatRow>(
    flatRows,
    sortColumns,
    "grade",
  );
  const distPages = usePagination(sorted);
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
                <strong className="mt-3 block font-mono text-[26px] tracking-[-.05em] text-foreground">
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
            <div className="grid min-w-[640px] grid-cols-[1.5fr_1fr_1fr_1.6fr] items-center border-b border-border bg-primary/5 px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
              <SortHeader
                columnKey="grade"
                activeKey={sortKey}
                activeDir={sortDir}
                onSort={toggleSort}
                align="start"
              >
                {t("Grade", "المرحلة")}
              </SortHeader>
              <SortHeader
                columnKey="klass"
                activeKey={sortKey}
                activeDir={sortDir}
                onSort={toggleSort}
                align="center"
              >
                {t("Class", "الفصل")}
              </SortHeader>
              <SortHeader
                columnKey="count"
                activeKey={sortKey}
                activeDir={sortDir}
                onSort={toggleSort}
                align="center"
              >
                {t("Students", "الطلاب")}
              </SortHeader>
              <SortHeader
                columnKey="count"
                activeKey={sortKey}
                activeDir={sortDir}
                onSort={toggleSort}
                align="center"
              >
                {t("Share of school", "نسبة من المدرسة")}
              </SortHeader>
            </div>
            {distPages.pageItems.map(({ grade, klass, count, key }) => {
              const percent = total ? Math.round((count / total) * 100) : 0;
              return (
                <div
                  key={key}
                  className="grid min-w-[640px] grid-cols-[1.5fr_1fr_1fr_1.6fr] items-center border-b border-border/70 px-5 py-3 transition-colors last:border-b-0 hover:bg-secondary/40"
                  data-testid={`row-distribution-${grade.toLowerCase().replaceAll(" ", "-")}-${klass.toLowerCase()}`}
                >
                  <span className="text-start text-sm font-semibold text-foreground">
                    {grade}
                  </span>
                  <span className="justify-self-center text-center font-mono text-xs text-muted-foreground">
                    {klass}
                  </span>
                  <strong className="justify-self-center text-center font-mono text-sm text-foreground">
                    {count}
                  </strong>
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-muted">
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
            <div className="grid min-w-[640px] grid-cols-[1.5fr_1fr_1fr_1.6fr] items-center bg-primary/5 px-5 py-3 text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">
              <span className="text-start">
                {t("Total", "الإجمالي")}
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

function ReturnBorrowControls({
  borrow,
  mutation,
  onSuccess,
  size = "sm",
}: {
  borrow: Borrow;
  mutation: ReturnType<typeof useReturnBorrow>;
  onSuccess: (condition: "good" | "damaged" | "lost") => void;
  size?: "sm" | "xs";
}) {
  const { t } = useT();
  const confirm = useConfirm();
  const pending =
    mutation.isPending && mutation.variables?.id === borrow.id;
  const run = (condition: "good" | "damaged" | "lost") => {
    const description =
      condition === "good"
        ? t(
            `Return “${borrow.bookTitle}” to the shelf?`,
            `هل تريد إعادة "${borrow.bookTitle}" إلى الرف؟`,
          )
        : condition === "damaged"
          ? t(
              `Confirm that “${borrow.bookTitle}” was returned damaged?`,
              `هل تؤكد أن "${borrow.bookTitle}" أُعيد ككتاب تالف؟`,
            )
          : t(
              `Report “${borrow.bookTitle}” as lost?`,
              `هل تريد الإبلاغ عن فقدان "${borrow.bookTitle}"؟`,
            );
    confirm(
      {
        title: t(
          condition === "good"
            ? "Return book"
            : condition === "damaged"
              ? "Return as damaged"
              : "Report as lost",
          condition === "good"
            ? "إعادة الكتاب"
            : condition === "damaged"
              ? "الإعادة كتاب تالف"
              : "الإبلاغ كمفقود",
        ),
        description,
        confirmLabel: t("Yes", "نعم"),
        destructive: condition !== "good",
      },
      () =>
        mutation.mutate(
          { id: borrow.id, data: { condition } },
          { onSuccess: () => onSuccess(condition) },
        ),
    );
  };
  const btn = size === "sm" ? "h-8 px-3 text-xs" : "h-7 px-2.5 text-[11px]";
  const extra = size === "sm" ? "px-2 py-1 text-[10px]" : "px-1.5 py-0.5 text-[10px]";
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        onClick={() => run("good")}
        className={`${btn} shrink-0 hover:border-[#32B77E] hover:text-[#32B77E]`}
        disabled={pending}
        data-testid={`button-return-borrow-${borrow.id}`}
      >
        {t("Return", "إرجاع")}
      </Button>
      <div className="flex gap-1">
        <button
          onClick={() => run("damaged")}
          disabled={pending}
          className={`rounded-md border border-accent/40 ${extra} font-semibold text-accent-foreground hover:bg-accent/10 disabled:opacity-40 dark:text-[#EC9F42] dark:border-accent/50`}
          data-testid={`button-return-borrow-damaged-${borrow.id}`}
          title={t("Return as damaged", "الإعادة ككتاب تالف")}
        >
          {t("Damaged", "تالف")}
        </button>
        <button
          onClick={() => run("lost")}
          disabled={pending}
          className={`rounded-md border border-destructive/25 ${extra} font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-40`}
          data-testid={`button-return-borrow-lost-${borrow.id}`}
          title={t("Report as lost", "الإبلاغ كمفقود")}
        >
          {t("Lost", "مفقود")}
        </button>
      </div>
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
  const sortColumns: SortColumn<Borrow>[] = [
    { key: "borrowerName", accessor: (b) => b.borrowerName },
    { key: "bookTitle", accessor: (b) => b.bookTitle },
    { key: "borrowedAt", accessor: (b) => b.borrowedAt },
    { key: "dueDate", accessor: (b) => b.dueDate },
  ];
  const { sorted, sortKey, sortDir, toggleSort } = useSort<Borrow>(
    borrows,
    sortColumns,
    "borrowedAt",
  );
  const filterFields: FilterField[] = [
    {
      key: "borrowerType",
      label: "Borrower type",
      arabic: "نوع المستعير",
      options: ["student", "teacher", "employee"],
      accessor: (b) => b.borrowerType,
    },
  ];
  const filters = useTableFilters(filterFields);
  const filteredBorrows = useMemo(
    () =>
      sorted.filter((borrow) => {
        if (!filters.matches(filters.values, borrow)) return false;
        return `${borrow.borrowerName} ${borrow.bookTitle} ${borrow.bookBarcode || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
      }),
    [sorted, search, filters.values, filterFields],
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
  const clearScanResult = () => {
    setScannedBorrows([]);
    setMissingScan(undefined);
  };
  return (
    <div className="rise-in">
      <PageHeading
        eyebrow="Resources · 04 · Lending"
        title="Borrows"
        arabic="الاستعارات"
        description={t(
          "Keep track of books currently away from the shelves.",
          "تابع الكتب الموجودة حاليًا خارج الرفوف.",
        )}
        action={<Button onClick={() => setBookPickerOpen(true)} className="h-11 rounded-lg bg-primary px-5 text-primary-foreground hover:bg-primary/85" data-testid="button-borrows-borrow"><Plus size={17} /> {t("Borrow a book", "استعارة كتاب")}</Button>}
      />
      <form
        onSubmit={handleScan}
        className="mb-5 flex flex-col gap-2 rounded-xl border border-[#DBB46C]/50 bg-gradient-to-l from-[#FCFBF0] to-[#DBB46C]/15 p-4 sm:flex-row sm:items-center dark:border-[#DBB46C]/40 dark:from-card dark:to-[#DBB46C]/10"
        data-testid="form-borrows-scan-barcode"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-[#DBB46C]">
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
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t(
              "Search borrower or book…",
              "ابحث عن المستعير أو الكتاب…",
            )}
            className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            data-testid="input-borrows-search"
          />
        </div>
        <TableFilterBar
          fields={filterFields}
          values={filters.values}
          setFilter={filters.setFilter}
          resetFilter={filters.resetFilter}
          activeCount={filters.activeCount}
          t={t}
        />
      </div>
      {scannedBorrows.length > 0 && (
        <div
          className="mb-5 rounded-xl border border-[#32B77E]/35 bg-[#32B77E]/10 p-4"
          data-testid="panel-borrows-scanned-borrow"
        >
          <div className="mb-3 text-sm font-bold text-foreground">
            {t("Borrowers for this barcode", "مستعيرو هذا الباركود")}
          </div>
          {scannedBorrows.map((borrow) => (
            <div
              key={borrow.id}
              className="flex flex-wrap items-center gap-3 border-t border-[#32B77E]/20 py-3 first:border-t-0 first:pt-0"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">
                  {borrow.borrowerName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {borrow.bookTitle} ·{" "}
                  {borrow.borrowerType === "teacher"
                    ? t("Teacher", "المعلم")
                    : borrow.borrowerType === "employee"
                      ? t("Employee", "الموظف")
                      : t("Student", "الطالب")}
                </div>
              </div>
              <ReturnBorrowControls
                borrow={borrow}
                mutation={returnBorrow}
                size="xs"
                onSuccess={() => {
                  setScannedBorrows((current) =>
                    current.filter((item) => item.id !== borrow.id),
                  );
                  queryClient.invalidateQueries({
                    queryKey: getGetBorrowsQueryKey({ active: true }),
                  });
                  queryClient.invalidateQueries({
                    queryKey: getGetBooksQueryKey(),
                  });
                }}
              />
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
          <div className="grid min-w-[760px] grid-cols-[1.45fr_1.45fr_1fr_1fr_220px] items-center border-b border-border bg-primary/5 px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
            <SortHeader
              columnKey="borrowerName"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="start"
            >
              <span className="truncate">{t("Borrower", "المستعير")}</span>
            </SortHeader>
            <SortHeader
              columnKey="bookTitle"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="start"
            >
              {t("Book", "الكتاب")}
            </SortHeader>
            <SortHeader
              columnKey="borrowedAt"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Borrowed", "تاريخ الإعارة")}
            </SortHeader>
            <SortHeader
              columnKey="dueDate"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Due date", "تاريخ الا��تحقاق")}
            </SortHeader>
            <span className="text-center">{t("Return / status", "الإعادة / الحالة")}</span>
          </div>
          {borrowPages.pageItems.map((borrow) => (
            <div
              key={borrow.id}
              className="grid min-w-[760px] grid-cols-[1.45fr_1.45fr_1fr_1fr_220px] items-center border-b border-border/70 px-5 py-3 text-sm last:border-b-0"
            >
              <div className="text-start font-semibold text-foreground truncate">
                {borrow.borrowerName}
              </div>
              <div className="text-start text-muted-foreground truncate">{borrow.bookTitle}</div>
              <div className="justify-self-center text-center font-mono text-xs text-muted-foreground" dir="ltr">
                {borrow.borrowedAt ? formatDate(String(borrow.borrowedAt)) : "—"}
              </div>
              <div className="justify-self-center text-center font-mono text-xs text-muted-foreground" dir="ltr">
                {borrow.dueDate ? formatDate(String(borrow.dueDate)) : "—"}
              </div>
              <div className="flex items-center justify-center">
                <ReturnBorrowControls
                  borrow={borrow}
                  mutation={returnBorrow}
                  onSuccess={() => {
                    queryClient.invalidateQueries({
                      queryKey: getGetBorrowsQueryKey({ active: true }),
                    });
                    queryClient.invalidateQueries({
                      queryKey: getGetBooksQueryKey(),
                    });
                  }}
                />
              </div>
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
          <DialogHeader className="border-b border-border bg-card px-6 py-5 text-start">
            <DialogTitle className="text-2xl text-foreground">{t("Choose a book", "اختر كتابًا")}</DialogTitle>
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
            <Button type="button" disabled={!selectedBookId} onClick={() => { const book = books.find((item) => item.id === Number(selectedBookId)); if (book) { setBorrowing(book); setBookPickerOpen(false); setSelectedBookId(""); setBookBarcode(""); } }} className="bg-primary text-primary-foreground">{t("Continue", "متابعة")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <BorrowDialog open={Boolean(borrowing)} onOpenChange={(value) => { if (!value) setBorrowing(undefined); }} book={borrowing} onSaved={() => queryClient.invalidateQueries({ queryKey: getGetBorrowsQueryKey({ active: true }) })} />
    </div>
  );
}

type HistoryFilter = "all" | "active" | "returned";

function BorrowHistoryPage() {
  const { t } = useT();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<HistoryFilter>("all");
  const query = useGetBorrows(
    {},
    { query: { queryKey: getGetBorrowsQueryKey({}) } },
  );
  const borrows = (Array.isArray(query.data) ? query.data : []) as Borrow[];
  const studentsQuery = useGetStudents(undefined, {
    query: { queryKey: getGetStudentsQueryKey(undefined) },
  });
  const yearsQuery = useGetAcademicYears({
    query: { queryKey: getGetAcademicYearsQueryKey() },
  });
  const ranking = useMemo(() => {
    const students = (Array.isArray(studentsQuery.data) ? studentsQuery.data : []) as Student[];
    if (!students.length) return [];
    const allBorrows = (Array.isArray(query.data) ? query.data : []) as Borrow[];
    const studentBorrows = allBorrows.filter(
      (b) => b.borrowerType === "student",
    );
    const years = (Array.isArray(yearsQuery.data) ? yearsQuery.data : []) as AcademicYear[];
    const year = getDefaultAcademicYear(years);
    let startTs = Number.NEGATIVE_INFINITY;
    let endTs = Number.POSITIVE_INFINITY;
    if (year) {
      startTs = new Date(`${year.startDate}T00:00:00`).getTime();
      endTs = new Date(`${year.endDate}T23:59:59`).getTime();
    }
    const inYear = (ts: string | null | undefined) =>
      ts ? !Number.isNaN(new Date(ts).getTime()) && new Date(ts).getTime() >= startTs && new Date(ts).getTime() <= endTs : false;
    const rows = students.map((student) => {
      const count = year
        ? studentBorrows.filter(
            (b) =>
              inYear(b.borrowedAt) &&
              (b.studentId != null
                ? b.studentId === student.id
                : b.borrowerId === student.id),
          ).length
        : studentBorrows.filter(
            (b) =>
              b.studentId != null
                ? b.studentId === student.id
                : b.borrowerId === student.id,
          ).length;
      return { student, count };
    });
    rows.sort((a, b) => b.count - a.count);
    return rows.map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
  }, [studentsQuery.data, query.data, yearsQuery.data]);

  const sortColumns: SortColumn<Borrow>[] = [
    { key: "borrowerName", accessor: (b) => b.borrowerName },
    { key: "bookTitle", accessor: (b) => b.bookTitle },
    { key: "borrowedAt", accessor: (b) => b.borrowedAt },
    { key: "dueDate", accessor: (b) => b.dueDate },
    { key: "returnedAt", accessor: (b) => b.returnedAt },
    { key: "condition", accessor: (b) => b.condition ?? "good" },
  ];
  const { sorted, sortKey, sortDir, toggleSort } = useSort<Borrow>(
    borrows,
    sortColumns,
    "borrowedAt",
  );
  const filterFields: FilterField[] = [
    {
      key: "borrowerType",
      label: "Borrower type",
      arabic: "نوع المستعير",
      options: ["student", "teacher", "employee"],
      accessor: (b) => b.borrowerType,
    },
    {
      key: "condition",
      label: "Condition",
      arabic: "الحالة",
      options: ["good", "damaged", "lost"],
      accessor: (b) => b.condition ?? "good",
    },
  ];
  const filters = useTableFilters(filterFields);
  const filtered = useMemo(() => {
    const term = search
      .toLowerCase()
      .trim()
      .normalize("NFKC");
    return sorted.filter((borrow) => {
      if (!filters.matches(filters.values, borrow)) return false;
      if (status === "active" && borrow.returnedAt !== null) return false;
      if (status === "returned" && !borrow.returnedAt) return false;
      if (term) {
        const haystack = `${borrow.borrowerName || ""} ${borrow.bookTitle || ""} ${borrow.bookBarcode || ""} ${borrow.condition || ""}`
          .toLowerCase()
          .normalize("NFKC");
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [sorted, search, status, filters.values, filterFields]);
  const pages = usePagination(filtered);
  const conditionBadge = (
    condition: BorrowCondition | undefined,
  ) => {
    if (!condition || condition === "good") {
      return (
        <span className="rounded-full bg-[#32B77E]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#32B77E]">
          {t("Good", "جيد")}
        </span>
      );
    }
    if (condition === "damaged") {
      return (
        <span className="rounded-full bg-[#EC9F42]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#EC9F42]">
          {t("Damaged", "تالف")}
        </span>
      );
    }
    return (
      <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
        {t("Lost", "مفقود")}
      </span>
    );
  };
  const statusBadge = (returnedAt: string | null | undefined) =>
    returnedAt ? (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {t("Returned", "مُعاد")}
      </span>
    ) : (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
        {t("Active", "نشط")}
      </span>
    );
  return (
    <div className="rise-in">
      <PageHeading
        eyebrow="Resources · 04 · Lending"
        title="Borrow History"
        arabic="سجل الاستعارات"
        description={t(
          "A complete record of every book borrowed and returned.",
          "سجل كامل لكل كتاب تم استعارته وإعادته.",
        )}
      />
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t(
              "Search borrower, book or barcode…",
              "ابحث عن المستعير أو الكتاب أو الباركود…",
            )}
            className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            data-testid="input-borrow-history-search"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {(
            [
              { key: "all", label: t("All", "الكل") },
              { key: "active", label: t("Active", "نشط") },
              { key: "returned", label: t("Returned", "مُعاد") },
            ] as { key: HistoryFilter; label: string }[]
          ).map((option) => (
            <button
              key={option.key}
              onClick={() => setStatus(option.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${status === option.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              data-testid={`button-borrow-history-${option.key}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <TableFilterBar
          fields={filterFields}
          values={filters.values}
          setFilter={filters.setFilter}
          resetFilter={filters.resetFilter}
          activeCount={filters.activeCount}
          t={t}
        />
      </div>
      {query.isLoading ? (
        <LoadingCards count={3} />
      ) : query.isError ? (
        <ErrorState
          label="borrow history"
          labelAr="سجل الاستعارات"
          onRetry={() => query.refetch()}
        />
      ) : !filtered.length ? (
        <EmptyState
          icon={Clock3}
          title={t("No borrow history", "لا يوجد سجل استعارات")}
          detail={t(
            "Borrowed and returned books will appear here.",
            "ستظهر الكتب المستعارة والمُعادة هنا.",
          )}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card soft-shadow">
          <div className="grid min-w-[860px] grid-cols-[1.4fr_1.5fr_1fr_1fr_1.2fr_104px] items-center border-b border-border bg-primary/5 px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
            <SortHeader
              columnKey="borrowerName"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="start"
            >
              <span className="truncate">{t("Borrower", "المستعير")}</span>
            </SortHeader>
            <SortHeader
              columnKey="bookTitle"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="start"
            >
              {t("Book", "الكتاب")}
            </SortHeader>
            <SortHeader
              columnKey="borrowedAt"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Borrowed", "تاريخ الإعارة")}
            </SortHeader>
            <SortHeader
              columnKey="dueDate"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Due date", "تاريخ الاستحقاق")}
            </SortHeader>
            <SortHeader
              columnKey="returnedAt"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              <span className="truncate">
                {t("Returned / Condition", "الإعادة / الحالة")}
              </span>
            </SortHeader>
            <span className="text-center">{t("Status", "الحالة")}</span>
          </div>
          {pages.pageItems.map((borrow) => (
            <div
              key={borrow.id}
              className="grid min-w-[860px] grid-cols-[1.4fr_1.5fr_1fr_1fr_1.2fr_104px] items-center border-b border-border/70 px-5 py-3 text-sm last:border-b-0"
            >
              <div className="text-start">
                <div className="font-semibold text-foreground">
                  {borrow.borrowerName || "—"}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {borrow.borrowerType === "teacher"
                    ? t("Teacher", "المعلم")
                    : borrow.borrowerType === "employee"
                      ? t("Employee", "الموظف")
                      : t("Student", "الطالب")}
                </div>
              </div>
              <div className="text-start text-muted-foreground">
                <div className="truncate font-medium">{borrow.bookTitle || "—"}</div>
                {borrow.bookBarcode && (
                  <div className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">
                    {borrow.bookBarcode}
                  </div>
                )}
              </div>
              <div className="justify-self-center text-center font-mono text-xs text-muted-foreground" dir="ltr">
                {borrow.borrowedAt ? formatDate(String(borrow.borrowedAt)) : "—"}
              </div>
              <div className="justify-self-center text-center font-mono text-xs text-muted-foreground" dir="ltr">
                {borrow.dueDate ? formatDate(String(borrow.dueDate)) : "—"}
              </div>
              <div className="flex flex-col items-center justify-center gap-1 text-center">
                {borrow.returnedAt ? (
                  <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                    {formatDate(String(borrow.returnedAt))}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
                {conditionBadge(borrow.condition)}
              </div>
              <div className="flex justify-center items-center">{statusBadge(borrow.returnedAt)}</div>
            </div>
          ))}
        </div>
      )}
      {filtered.length > 0 && (
        <Pagination
          page={pages.page}
          pageCount={pages.pageCount}
          totalItems={pages.totalItems}
          pageSize={pages.pageSize}
          onPageChange={pages.setPage}
          onPageSizeChange={pages.setPageSize}
        />
      )}

      <section className="mt-8 rounded-xl border border-border bg-card p-6 soft-shadow">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {t("Student ranking", "ترتيب الطلاب")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t(
                "All students ranked by books borrowed this academic year, highest to lowest.",
                "جميع الطلاب مرتبون حسب عدد الكتب المستعارة خلال العام الدراسي، من الأكبر إلى الأقل.",
              )}
            </p>
          </div>
        </div>
        {ranking.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("No students found.", "لا يوجد طلاب.")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-primary/5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 text-start">#</th>
                  <th className="px-4 py-2.5 text-start">{t("Student", "الطالب")}</th>
                  <th className="px-4 py-2.5 text-center">{t("Class", "الفصل")}</th>
                  <th className="px-4 py-2.5 text-center">{t("Books borrowed", "الكتب المستعارة")}</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map(({ student, count, rank }) => (
                  <tr
                    key={student.id}
                    className="border-b border-border/50 transition-colors hover:bg-muted/30 last:border-b-0"
                  >
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          rank === 1
                            ? "bg-[#EC9F42]/15 text-[#EC9F42]"
                            : rank === 2
                              ? "bg-slate-200/60 text-slate-600"
                              : rank === 3
                                ? "bg-[#B3792E]/20 text-[#8A5A1D]"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {rank}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      {student.fullName}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {student.fullNameArabic}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-muted-foreground">
                      {student.grade}{student.className ? ` · ${student.className}` : ""}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`inline-flex min-w-8 justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          count > 0
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
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
    const rows = data.map((row) => {
      const obj: Record<string, string> = {};
      columns.forEach((c) => { obj[c.header] = row[c.key] || "—"; });
      return obj;
    });
    exportToExcel(rows, exportType);
  };
  return (
    <section className="rounded-xl border border-border bg-card p-6 soft-shadow">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">{title}</div>
          <h3 className="mt-1 text-lg font-bold text-foreground">{titleAr}</h3>
        </div>
        <Button variant="outline" size="sm" onClick={handleExcel} className="gap-1.5 text-xs">
          <FileSpreadsheet size={14} />
          {t("Export Excel", "تصدير Excel")}
        </Button>
      </div>
      {data.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{t("No records found.", "لا توجد سجلات.")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-primary/5">
                {columns.map((col, idx) => (
                  <th
                    key={col.key}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground ${
                      idx === 0 ? "text-start" : "text-center"
                    }`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportPages.pageItems.map((row, i) => (
                <tr key={i} className="border-b border-border/50 transition-colors hover:bg-muted/30 last:border-b-0">
                  {columns.map((col, idx) => (
                    <td
                      key={col.key}
                      className={`px-4 py-2.5 ${
                        idx === 0 ? "text-start font-medium text-foreground" : "text-center text-muted-foreground"
                      }`}
                    >
                      {row[col.key] || "—"}
                    </td>
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
  const studentsQuery = useGetStudents(undefined, {
    query: { queryKey: getGetStudentsQueryKey(undefined) },
  });
  const books = Array.isArray(booksQuery.data) ? booksQuery.data : [];
  const borrows = Array.isArray(borrowsQuery.data) ? borrowsQuery.data : [];
  const students = Array.isArray(studentsQuery.data) ? studentsQuery.data : [];
  const copies = books.reduce((total, book) => total + book.copies, 0);
  const available = books.reduce(
    (total, book) => total + (book.availableCopies ?? book.copies),
    0,
  );
  const borrowedCopies = Math.max(copies - available, 0);
  const lostBooks = books.reduce((total, book) => total + (book.lostCopies ?? 0), 0);
  const damagedBooks = books.reduce((total, book) => total + (book.damagedCopies ?? 0), 0);
  const categories = new Set(books.map((book) => book.category).filter(Boolean))
    .size;
  const borrowedPercent = copies
    ? Math.round((borrowedCopies / copies) * 1000) / 10
    : 0;
  const activeBorrows = borrows.filter((b) => !b.returnedAt);
  const [reportTab, setReportTab] = useState<"overview" | "borrowing" | "books">("overview");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const categoriesList = useMemo(
    () =>
      Array.from(new Set(books.map((b) => b.category).filter(Boolean))).sort(),
    [books],
  );
  const gradeList = useMemo(
    () =>
      Array.from(new Set(students.map((s) => s.grade).filter(Boolean))).sort(),
    [students],
  );
  const bookById = useMemo(
    () => new Map(books.map((book) => [book.id, book])),
    [books],
  );
  const studentById = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students],
  );
  const filteredBorrows = useMemo(() => {
    return borrows.filter((b) => {
      if (categoryFilter !== "all") {
        const cat = bookById.get(b.bookId)?.category;
        if (cat !== categoryFilter) return false;
      }
      if (gradeFilter !== "all") {
        const grade =
          b.borrowerType === "student" && b.studentId != null
            ? studentById.get(b.studentId)?.grade
            : undefined;
        if (grade !== gradeFilter) return false;
      }
      return true;
    });
  }, [borrows, categoryFilter, gradeFilter, bookById, studentById]);

  const monthlyBorrows = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const counts = new Array(12).fill(0);
    filteredBorrows.forEach((b) => {
      const d = new Date(b.borrowedAt);
      if (!isNaN(d.getTime())) counts[d.getMonth()]++;
    });
    return months.map((m, i) => ({ name: m, count: counts[i] }));
  }, [filteredBorrows]);

  const categoryBorrows = useMemo(() => {
    const map = new Map<string, number>();
    filteredBorrows.forEach((b) => {
      const cat = bookById.get(b.bookId)?.category || t("Other", "أخرى");
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredBorrows, bookById, t]);

  const uniqueTitles = useMemo(() => {
    return new Set(books.map((b) => b.title?.trim().toLowerCase()).filter(Boolean)).size;
  }, [books]);

  const borrowsByGrade = useMemo(() => {
    const studentByGrade = new Map<number, string>();
    students.forEach((s) => {
      if (s.id != null) studentByGrade.set(s.id, s.grade);
    });
    const map = new Map<string, number>();
    filteredBorrows.forEach((b) => {
      let grade: string;
      if (b.borrowerType === "student" && b.studentId != null && studentByGrade.has(b.studentId)) {
        grade = studentByGrade.get(b.studentId)!;
      } else {
        grade = t("Staff / Other", "الكادر / أخرى");
      }
      map.set(grade, (map.get(grade) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredBorrows, students, t]);

  const totalBorrowCount = filteredBorrows.length;
  const mostBorrowedStudents = useMemo(() => {
    const studentMap = new Map(students.map((student) => [student.id, student]));
    const counts = new Map<number, number>();
    filteredBorrows.forEach((borrow) => {
      if (borrow.borrowerType === "student" && borrow.studentId != null) counts.set(borrow.studentId, (counts.get(borrow.studentId) || 0) + 1);
    });
    return Array.from(counts, ([id, count]) => ({ student: studentMap.get(id), count }))
      .filter((item): item is { student: (typeof students)[number]; count: number } => Boolean(item.student))
      .sort((a, b) => b.count - a.count);
  }, [filteredBorrows, students]);

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
              label="Unique books"
              arabic="الكتب الفريدة"
              value={uniqueTitles.toLocaleString()}
              icon={BookOpen}
              tone="navy"
              note={t("Distinct titles in catalogue", "عناوين فريدة في الفهرس")}
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
            {(["overview", "borrowing", "books"] as const).map((tab) => (
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
                  : tab === "borrowing"
                    ? t("Borrowing analytics", "تحليلات الاستعارة")
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
                    <h2 className="mt-1 text-xl font-bold text-foreground">
                      {t("Copies on the shelf", "النسخ الموجودة على الرف")}
                    </h2>
                  </div>
                  <span className="font-mono text-lg font-bold text-foreground">
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
            </>
          )}

          {reportTab === "borrowing" && (
            <div className="mt-6 space-y-6">
              <section className="rounded-xl border border-border bg-card p-6 soft-shadow">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                      {t("Borrowing analytics", "تحليلات الاستعارة")}
                    </div>
                    <h2 className="mt-1 text-xl font-bold tracking-[-.03em] text-foreground">
                      {t("Filters", "عوامل التصفية")}
                    </h2>
                  </div>
                  {filteredBorrows.length > 0 && categoriesList.length > 0 && (
                    <select
                      value={categoryFilter}
                      onChange={(event) => setCategoryFilter(event.target.value)}
                      className="h-9 cursor-pointer appearance-none rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      data-testid="select-analytics-category"
                    >
                      <option value="all">
                        {t("All categories", "كل التصنيفات")}
                      </option>
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  )}
                  {gradeList.length > 0 && (
                    <select
                      value={gradeFilter}
                      onChange={(event) => setGradeFilter(event.target.value)}
                      className="h-9 cursor-pointer appearance-none rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      data-testid="select-analytics-grade"
                    >
                      <option value="all">{t("All grades", "كل الصفوف")}</option>
                      {gradeList.map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  )}
                  {(gradeFilter !== "all" || categoryFilter !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setGradeFilter("all");
                        setCategoryFilter("all");
                      }}
                      data-testid="button-analytics-reset"
                    >
                      <X size={14} />
                      {t("Reset filters", "إعادة تعيين التصفية")}
                    </Button>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {filteredBorrows.length} {t("borrow records shown", "سجل إعارة معروض")}
                </p>
              </section>

              <section className="rounded-xl border border-border bg-card p-6 soft-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                      {t("Student ranking", "ترتيب الطلاب")}
                    </div>
                    <h2 className="mt-1 text-xl font-bold text-foreground">
                      {t("Most borrowed students", "أكثر الطلاب استعارة")}
                    </h2>
                  </div>
                  <span className="font-mono text-lg font-bold text-foreground">
                    {mostBorrowedStudents.length} {t("students", "طالب")}
                  </span>
                </div>
                {mostBorrowedStudents.length ? (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs text-muted-foreground">
                          <th className="px-3 py-2 text-start">{t("Rank", "الترتيب")}</th>
                          <th className="px-3 py-2 text-start">{t("Student", "الطالب")}</th>
                          <th className="px-3 py-2 text-center">{t("Loans", "الإعارات")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mostBorrowedStudents.map(({ student, count }, index) => (
                          <tr key={student.id} className="border-b border-border/50">
                            <td className="px-3 py-2 font-bold text-primary">#{index + 1}</td>
                            <td className="px-3 py-2 font-medium text-foreground">{student.fullName}</td>
                            <td className="px-3 py-2 text-center text-muted-foreground">{count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    icon={GraduationCap}
                    title={t("No student borrowing activity yet.", "لا توجد حركة استعارة للطلاب بعد.")}
                    detail={t(
                      "Once students borrow books, you'll see the top borrowers ranked here. Try widening your filters.",
                      "بمجرد استعارة الطلاب للكتب، ستظهر أكثر الطلاب استعارةً هنا. جرّب توسيع عوامل التصفية.",
                    )}
                  />
                )}
              </section>

              <div className="grid gap-6 xl:grid-cols-2">
                <section className="rounded-xl border border-border bg-card p-6 soft-shadow">
                  <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                    {t("Monthly borrows", "الإعارات الشهرية")}
                  </div>
                  <h2 className="mt-1 mb-4 text-lg font-bold text-foreground">
                    {t("Borrowing activity over the year", "نشاط الإعارات على مدار السنة")}
                  </h2>
                  {filteredBorrows.length ? (
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
                  ) : (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      {t("No borrows to chart within the current filters.", "لا توجد إعارات لعرضها ضمن عوامل التصفية الحالية.")}
                    </p>
                  )}
                </section>
                <section className="rounded-xl border border-border bg-card p-6 soft-shadow">
                  <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                    {t("By category", "حسب التصنيف")}
                  </div>
                  <h2 className="mt-1 mb-4 text-lg font-bold text-foreground">
                    {t("Borrows per category", "الإعارات حسب التصنيف")}
                  </h2>
                  {categoryBorrows.length ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={categoryBorrows}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <RechartsTooltip />
                          <Bar dataKey="count" fill="#DBB46C" radius={[4, 4, 0, 0]} />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      {t("No borrows to chart within the current filters.", "لا توجد إعارات لعرضها ضمن عوامل التصفية الحالية.")}
                    </p>
                  )}
                </section>
              </div>

              <section className="rounded-xl border border-border bg-card p-6 soft-shadow">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                      {t("Distribution", "التوزيع")}
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-foreground">
                      {t("Borrows per grade", "الإعارات حسب الصف")}
                    </h3>
                  </div>
                  <span className="font-mono text-lg font-bold text-foreground">
                    {totalBorrowCount} {t("borrows", "إعارة")}
                  </span>
                </div>
                {borrowsByGrade.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {t("No records found for the current filters.", "لا توجد سجلات ضمن عوامل التصفية الحالية.")}
                  </p>
                ) : (
                  <>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={borrowsByGrade}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                          <RechartsTooltip />
                          <Bar dataKey="count" fill="#263064" radius={[4, 4, 0, 0]} />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-6 overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-primary/5">
                            <th className="px-4 py-2.5 text-start text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              {t("Grade", "الصف")}
                            </th>
                            <th className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              {t("Borrows", "الإعارات")}
                            </th>
                            <th className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              {t("Percentage", "النسبة")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {borrowsByGrade.map((g, i) => {
                            const percent = totalBorrowCount
                              ? Math.round((g.count / totalBorrowCount) * 1000) / 10
                              : 0;
                            return (
                              <tr
                                key={i}
                                className="border-b border-border/50 transition-colors hover:bg-muted/30 last:border-b-0"
                              >
                                <td className="px-4 py-2.5 font-medium text-foreground">{g.name}</td>
                                <td className="px-4 py-2.5 text-center text-muted-foreground">{g.count}</td>
                                <td className="px-4 py-2.5 text-center">
                                  <div className="mx-auto flex max-w-[220px] items-center gap-2">
                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                      <div
                                        className="h-full rounded-full bg-primary"
                                        style={{ width: `${percent}%` }}
                                      />
                                    </div>
                                    <span className="min-w-[48px] text-xs font-semibold text-foreground">
                                      {percent}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>

              <div className="space-y-6">
                <ReportSection
                  title={t("Active borrows", "الإعارات النشطة")}
                  titleAr="الإعارات النشطة"
                  columns={[
                    { key: "borrowerName", header: t("Borrower", "المُعار") },
                    { key: "bookTitle", header: t("Book", "الكتاب") },
                    { key: "borrowedAt", header: t("Borrowed", "تاريخ الإعارة") },
                    { key: "dueDate", header: t("Due", "الاسترجاع") },
                  ]}
                  data={filteredBorrows.filter((b) => !b.returnedAt).map((b) => ({
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
                  data={filteredBorrows.filter((b) => b.returnedAt).map((b) => ({
                    borrowerName: b.borrowerName || "—",
                    bookTitle: b.bookTitle || "—",
                    borrowedAt: b.borrowedAt ? new Date(b.borrowedAt).toLocaleDateString("en-GB") : "—",
                    returnDate: b.returnedAt ? new Date(b.returnedAt).toLocaleDateString("en-GB") : "—",
                  }))}
                  exportType="borrows"
                  t={t}
                />
              </div>
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
                data={books.map((b) => {
                  const getStatusLabel = (s?: string) => {
                    if (s === "available") return t("Available", "متاح");
                    if (s === "borrowed") return t("Borrowed", "معار");
                    if (s === "lost") return t("Lost", "مفقود");
                    if (s === "damaged") return t("Damaged", "تالف");
                    return s ? t(s, s) : t("Available", "متاح");
                  };
                  const getLanguageLabel = (l?: string) => {
                    if (l === "Arabic") return t("Arabic", "العربية");
                    if (l === "English") return t("English", "الإنجليزية");
                    if (l === "French") return t("French", "الفرنسية");
                    return l || "—";
                  };
                  return {
                    title: b.title,
                    author: b.author || "—",
                    category: b.category || "—",
                    language: getLanguageLabel(b.language),
                    copies: String(b.copies),
                    availableCopies: String(b.availableCopies ?? b.copies),
                    status: getStatusLabel(b.status),
                  };
                })}
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
  const [search, setSearch] = useState("");
  const [groupSort, setGroupSort] = useState<"count" | "name">("count");
  const [groupDir, setGroupDir] = useState<"asc" | "desc">("desc");
  const query = useGetBooks(undefined, {
    query: { queryKey: getGetBooksQueryKey(undefined) },
  });
  const books = Array.isArray(query.data) ? query.data : [];
  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const map = new Map<string, Book[]>();
    for (const book of books) {
      if (
        term &&
        !book.category?.toLowerCase().includes(term) &&
        !book.title.toLowerCase().includes(term) &&
        !book.author?.toLowerCase().includes(term) &&
        !book.isbn?.toLowerCase().includes(term) &&
        !`${book.title} ${book.author || ""} ${book.isbn || ""}`
          .toLowerCase()
          .includes(term)
      )
        continue;
      const key = book.category || "Uncategorised";
      map.set(key, [...(map.get(key) ?? []), book]);
    }
    const entries = Array.from(map.entries());
    const multiplier =
      groupSort === "count" ? (groupDir === "asc" ? 1 : -1) : 0;
    entries.sort((a, b) => {
      if (groupSort === "count")
        return (a[1].length - b[1].length) * multiplier;
      return groupDir === "asc"
        ? a[0].localeCompare(b[0])
        : b[0].localeCompare(a[0]);
    });
    return entries;
  }, [books, search, groupSort, groupDir]);
  const groupPages = usePagination(groups);
  return (
    <div className="rise-in">
      <PageHeading
        eyebrow="Resources · 04 · Catalogue"
        title="Book categories"
        arabic="تصنيفات الكتب"
        description={t(
          "Every shelf in the library, grouped by how the collection is organised.",
          "كل رف في المكتبة، مجمّعة حسب تنظيم المجموعة.",
        )}
      />
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
            data-testid="input-search-categories"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={groupSort}
            onChange={(event) =>
              setGroupSort(event.target.value as "count" | "name")
            }
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none"
            data-testid="select-category-sort"
          >
            <option value="count">{t("Sort by count", "حسب العدد")}</option>
            <option value="name">{t("Sort by name", "حسب الاسم")}</option>
          </select>
          <button
            onClick={() => setGroupDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            data-testid="button-category-sort-dir"
            aria-label={t("Toggle sort order", "تبديل اتجاه الفرز")}
          >
            {groupDir === "asc" ? (
              <ArrowUpRight size={16} className="-rotate-45" />
            ) : (
              <ArrowUpRight size={16} className="rotate-90" />
            )}
          </button>
        </div>
      </div>
      {query.isLoading ? (
        <LoadingCards count={3} />
      ) : query.isError ? (
        <ErrorState
          label="book categories"
          labelAr="تصنيفات الكتب"
          onRetry={() => query.refetch()}
        />
      ) : !groups.length ? (
        <EmptyState
          icon={Library}
          title={t(
            "No categories yet",
            "لا توجد تصنيفات بعد",
          )}
          detail={t(
            "Once books are added to the library, their categories will be summarised here.",
            "بمجرد إضافة الكتب إلى المكتبة، سيتم تلخيص تصنيفاتها هنا.",
          )}
          action={
            <Link href="/library">
              <Button data-testid="button-goto-books">
                <Plus size={15} />{" "}
                {t(
                  "Add your first book",
                  "أضف كتابك الأول",
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
                  className="flex flex-wrap items-center justify-between gap-3 bg-primary/5 px-5 py-3"
                  data-testid={`row-category-${category.toLowerCase().replaceAll(" ", "-")}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#DBB46C]/20 text-[#EC9F42]">
                      <BookOpen size={17} strokeWidth={1.8} />
                    </div>
                    <div>
                      <div className="text-sm font-bold uppercase tracking-[.08em] text-foreground">
                        {category}
                      </div>
                      <div className="ar text-[10px] text-muted-foreground">
                        التصنيف
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 text-[11px] text-muted-foreground">
                    <span>
                      <strong className="font-mono text-foreground">
                        {group.length}
                      </strong>{" "}
                      {t("titles", "عنوان")}
                    </span>
                    <span>
                      <strong className="font-mono text-foreground">
                        {copies}
                      </strong>{" "}
                      {t("copies", "نسخة")}
                    </span>
                    <span>
                      <strong className="font-mono text-[#32B77E]">
                        {available}
                      </strong>{" "}
                      {t("available", "متاح")}
                    </span>
                  </div>
                </div>
                <div className="grid min-w-[720px] grid-cols-[2fr_1.1fr_.8fr_.8fr_1.1fr_88px] items-center border-t border-border bg-primary/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                  <span className="text-start">{t("Book", "الكتاب")}</span>
                  <span className="text-start">{t("Author", "المؤلف")}</span>
                  <span className="text-center">{t("Language", "اللغة")}</span>
                  <span className="text-center">{t("Shelf", "الرف")}</span>
                  <span className="text-center">{t("Barcode", "الباركود")}</span>
                  <span className="text-center">{t("Status", "الحالة")}</span>
                </div>
                {group.map((book) => (
                  <div
                    key={book.id}
                    className="grid min-w-[720px] grid-cols-[2fr_1.1fr_.8fr_.8fr_1.1fr_88px] items-center border-t border-border/70 px-5 py-2.5 transition-colors hover:bg-secondary/40"
                    data-testid={`row-category-book-${book.id}`}
                  >
                    <div className="line-clamp-1 text-start text-sm font-medium text-foreground">
                      {book.title}
                    </div>
                    <span className="text-start text-xs text-muted-foreground truncate">
                      {book.author || "—"}
                    </span>
                    <span className="justify-self-center text-center text-xs text-muted-foreground">
                      {book.language || "—"}
                    </span>
                    <span className="justify-self-center text-center text-xs text-muted-foreground">
                      {book.shelf ? `${t("Shelf", "الرف")} ${book.shelf}` : "—"}
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
                        ? t("Available", "متاح")
                        : t("Out", "معار")}
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
  const rawBooks = Array.isArray(query.data) ? query.data : [];
  const sortColumns: SortColumn<Book>[] = [
    { key: "title", accessor: (b) => b.title },
    { key: "author", accessor: (b) => b.author },
    { key: "category", accessor: (b) => b.category },
    { key: "language", accessor: (b) => b.language },
    { key: "shelf", accessor: (b) => b.shelf },
    { key: "isbn", accessor: (b) => b.isbn },
    { key: "copies", accessor: (b) => b.availableCopies ?? b.copies },
  ];
  const { sorted, sortKey, sortDir, toggleSort } = useSort<Book>(
    rawBooks,
    sortColumns,
    "title",
  );
  const filterFields: FilterField[] = [
    {
      key: "category",
      label: "Category",
      arabic: "التصنيف",
      options: Array.from(
        new Set(rawBooks.map((b) => b.category).filter(Boolean)),
      ).sort() as string[],
      accessor: (b) => b.category,
    },
    {
      key: "language",
      label: "Language",
      arabic: "اللغة",
      options: Array.from(
        new Set(rawBooks.map((b) => b.language).filter(Boolean)),
      ).sort() as string[],
      accessor: (b) => b.language,
    },
  ];
  const filters = useTableFilters(filterFields);
  const books = useMemo(
    () => sorted.filter((b) => filters.matches(filters.values, b)),
    [sorted, filters.values, filterFields],
  );
  const bookPages = usePagination(books);
  return (
    <div className="rise-in">
      <PageHeading
        eyebrow="Resources · 04 · Index"
        title="Library index"
        arabic="فهرس المكتبة"
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
        <TableFilterBar
          fields={filterFields}
          values={filters.values}
          setFilter={filters.setFilter}
          resetFilter={filters.resetFilter}
          activeCount={filters.activeCount}
          t={t}
        />
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
          <div className="grid min-w-[880px] grid-cols-[2fr_1.2fr_1fr_.7fr_.7fr_1.1fr_.7fr] items-center border-b border-border bg-primary/5 px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
            <SortHeader
              columnKey="title"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="start"
            >
              <span className="truncate">{t("Title", "العنوان")}</span>
            </SortHeader>
            <SortHeader
              columnKey="author"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="start"
            >
              {t("Author", "المؤلف")}
            </SortHeader>
            <SortHeader
              columnKey="category"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="start"
            >
              {t("Category", "التصنيف")}
            </SortHeader>
            <SortHeader
              columnKey="language"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Language", "اللغة")}
            </SortHeader>
            <SortHeader
              columnKey="shelf"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Shelf", "الرف")}
            </SortHeader>
            <SortHeader
              columnKey="isbn"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Barcode", "الباركود")}
            </SortHeader>
            <SortHeader
              columnKey="copies"
              activeKey={sortKey}
              activeDir={sortDir}
              onSort={toggleSort}
              align="center"
            >
              {t("Copies", "النسخ")}
            </SortHeader>
          </div>
          {bookPages.pageItems.map((book) => (
            <div
              key={book.id}
              className="grid min-w-[880px] grid-cols-[2fr_1.2fr_1fr_.7fr_.7fr_1.1fr_.7fr] items-center border-b border-border/70 px-5 py-2.5 transition-colors hover:bg-secondary/40"
              data-testid={`row-index-book-${book.id}`}
            >
              <span className="line-clamp-1 text-start text-sm font-medium text-foreground">
                {book.title}
              </span>
              <span className="line-clamp-1 text-start text-xs text-muted-foreground">
                {book.author || "—"}
              </span>
              <span className="text-start text-xs text-muted-foreground truncate">
                {book.category || "—"}
              </span>
              <span className="justify-self-center text-center text-xs text-muted-foreground">
                {book.language || "—"}
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
              <span className="justify-self-center text-center font-mono text-xs font-bold text-foreground">
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
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const {
    profilePicture,
    isDesktop,
    setProfilePicture,
    clearProfilePicture,
  } = useProfilePicture();
  const avatarInput = useRef<HTMLInputElement>(null);
  const [savingPicture, setSavingPicture] = useState(false);
  const [profilePictureError, setProfilePictureError] = useState("");
  const handleProfilePictureChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfilePictureError("");
    setSavingPicture(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      if (String(dataUrl).length > 4 * 1024 * 1024) {
        setProfilePictureError(
          t(
            "The image is too large. Please choose a smaller image (under 4 MB).",
            "الصورة كبيرة جداً. يرجى اختيار صورة أصغر (أقل من 4 ميجابايت).",
          ),
        );
      } else {
        const ok = await setProfilePicture(dataUrl);
        if (!ok) {
          setProfilePictureError(
            t(
              "Could not save the profile picture.",
              "تعذر حفظ صورة الملف الشخصي.",
            ),
          );
        }
      }
    } catch {
      setProfilePictureError(
        t(
          "Could not read that image file.",
          "تعذر قراءة ملف الصورة.",
        ),
      );
    } finally {
      setSavingPicture(false);
      if (avatarInput.current) avatarInput.current.value = "";
    }
  };
  const handleClearPicture = async () => {
    setProfilePictureError("");
    const ok = await clearProfilePicture();
    if (!ok) {
      setProfilePictureError(
        t(
          "Could not clear the profile picture.",
          "تعذر إزالة صورة الملف الشخصي.",
        ),
      );
    }
  };
  const query = useGetAcademicYears({
    query: { queryKey: getGetAcademicYearsQueryKey() },
  });
  const years = Array.isArray(query.data) ? query.data : [];
  const [selectedId, setSelectedId] = useState<number | undefined>(() => getStoredAcademicYearId());
  const defaultYear = getDefaultAcademicYear(years);
  const selected = years.find((year) => year.id === selectedId) ?? defaultYear;
  const setSelected = (id: number) => {
    setSelectedId(id);
    setStoredAcademicYearId(id);
  };
  const handleExport = async () => {
    setExporting(true);
    setExportError("");
    try {
      await exportDatabase({
        students: () => getStudents(),
        teachers: () => getTeachers(),
        employees: () => getEmployees(),
        books: () => getBooks(),
        borrows: () => getBorrows(),
        academicYears: () => getAcademicYears(),
      });
    } catch (err) {
      setExportError(
        t(
          "The export failed. Please try again.",
          "\u0641\u0634\u0644\u062A\u0020\u0639\u0645\u0644\u064A\u0629\u0020\u0627\u0644\u062A\u0635\u062F\u064A\u0631\u002E\u0020\u064A\u0631\u062C\u0649\u0020\u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629\u0020\u0645\u0631\u0629\u0020\u0623\u062E\u0631\u0649\u002E",
        ),
      );
    } finally {
      setExporting(false);
    }
  };
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
              <h2 className="mt-1 text-xl font-bold tracking-[-.03em] text-foreground">
                {t(
                  "Choose your school year",
                  "\u0627\u062E\u062A\u0631\u0020\u0639\u0627\u0645\u0643\u0020\u0627\u0644\u062F\u0631\u0627\u0633\u064A",
                )}
              </h2>
              <div className="mt-3 inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
                {selected?.label ?? getDefaultAcademicYear([])?.label ?? "No year selected"}
              </div>
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
                const active = selected?.id === year.id;
                return (
                  <button
                    key={year.id}
                    onClick={() => setSelected(year.id)}
                    className={`flex w-full items-center gap-4 rounded-xl border p-4 text-start transition-all ${active ? "border-primary bg-secondary/70" : "border-border hover:border-primary/40 hover:bg-muted/50"}`}
                    data-testid={`button-academic-year-${year.id}`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      {active ? (
                        <Check size={16} />
                      ) : (
                        <CalendarDays size={16} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
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
      <section className="rounded-xl bg-primary p-7 text-primary-foreground">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#DBB46C] text-foreground">
            <SlidersHorizontal size={18} />
          </div>
          <h2 className="mt-7 text-2xl font-bold leading-tight tracking-[-.04em]">
            {t(
              "Workspace preferences",
              "\u062A\u0641\u0636\u064A\u0644\u0627\u062A\u0020\u0645\u0633\u0627\u062D\u0629\u0020\u0627\u0644\u0639\u0645\u0644",
            )}
          </h2>
          <p className="mt-3 text-sm leading-6 text-primary-foreground/70">
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
              <span className="ar text-xs text-primary-foreground/70">ثنائي اللغة</span>
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
              <span className="text-[11px] text-primary-foreground/70">
                {t(
                  "Staff workspace",
                  "\u0645\u0633\u0627\u062D\u0629\u0020\u0639\u0645\u0644\u0020\u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646",
                )}
              </span>
            </div>
          </div>
        </section>
      </div>
      <section className="mt-6 rounded-xl border border-border bg-card p-6 soft-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
              <Image size={18} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                {t("Profile picture", "صورة الملف الشخصي")}
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-[-.03em] text-foreground">
                {t("Administrator avatar", "صورة المسؤول")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {isDesktop
                  ? t(
                      "Stored on this device so it persists across app restarts.",
                      "تُحفظ على هذا الجهاز لتستمر بين جلسات التطبيق.",
                    )
                  : t(
                      "This web session keeps the picture for the current session only.",
                      "هذه الجلسة تحتفظ بالصورة للجلسة الحالية فقط.",
                    )}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-secondary">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt={t("Admin avatar", "صورة المسؤول")}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
                LA
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              ref={avatarInput}
              type="file"
              accept="image/*"
              className="hidden"
              data-testid="input-profile-picture"
              onChange={handleProfilePictureChange}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => avatarInput.current?.click()}
              disabled={savingPicture}
              data-testid="button-upload-profile-picture"
            >
              {savingPicture ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {savingPicture
                ? t("Saving…", "جاري الحفظ…")
                : t("Upload picture", "رفع صورة")}
            </Button>
            {profilePicture && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleClearPicture}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                data-testid="button-clear-profile-picture"
              >
                <Trash2 size={16} />
                {t("Remove", "إزالة")}
              </Button>
            )}
          </div>
        </div>
        {profilePictureError && (
          <p className="mt-4 flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle size={15} />
            {profilePictureError}
          </p>
        )}
      </section>
      <section className="mt-6 rounded-xl border border-border bg-card p-6 soft-shadow">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
              <Database size={18} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
                {t(
                  "Data backup",
                  "\u0627\u0644\u0646\u0633\u062E\u0629\u0020\u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629",
                )}
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-[-.03em] text-foreground">
                {t(
                  "Export database backup",
                  "\u062A\u0635\u062F\u064A\u0631\u0020\u0646\u0633\u062E\u0629\u0020\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629",
                )}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {t(
                  "Download a JSON backup containing all records (students, teachers, employees, books, borrows and academic years).",
                  "\u0642\u0645\u0020\u062A\u0646\u0632\u064A\u0644\u0020\u0646\u0633\u062E\u0629\u0020\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629\u0020\u0628\u0635\u064A\u063A\u0629\u0020JSON\u0020\u062A\u062D\u062A\u0648\u064A\u0020\u0639\u0644\u0649\u0020\u062C\u0645\u064A\u0639\u0020\u0627\u0644\u0633\u062C\u0644\u0627\u062A\u0020\u0028\u0627\u0644\u0637\u0644\u0627\u0628\u2026",
                )}
              </p>
            </div>
          </div>
          <Button
            variant="default"
            className="shrink-0"
            onClick={handleExport}
            disabled={exporting}
            data-testid="button-export-backup"
          >
            {exporting ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {exporting
              ? t("Exporting…", "\u062C\u0627\u0631\u064A\u0020\u0627\u0644\u062A\u0635\u062F\u064A\u0631\u2026")
              : t("Export JSON", "\u062A\u0635\u062F\u064A\u0631\u0020JSON")}
          </Button>
        </div>
        {exportError && (
          <p className="mt-4 flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle size={15} />
            {exportError}
          </p>
        )}
      </section>
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
          <Route path="/library/history" component={BorrowHistoryPage} />
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
  const { t, lang: language } = useT();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setIsSuccess(false);

    if (newPassword.length < 10) {
      return setMessage(
        t(
          "New password must be at least 10 characters.",
          "يجب أن تتكون كلمة المرور الجديدة من 10 خانات على الأقل.",
        ),
      );
    }
    if (newPassword !== confirmation) {
      return setMessage(
        t(
          "New passwords do not match.",
          "كلمتا المرور غير متطابقتين.",
        ),
      );
    }

    if (
      !window.alBassamDesktop &&
      (import.meta.env.VITE_FRONTEND_ONLY === "true" ||
        !import.meta.env.VITE_API_URL)
    ) {
      const result = await changeCredentials(
        currentPassword,
        newUsername,
        newPassword,
      );
      if (result.ok) {
        setIsSuccess(true);
        setMessage(
          t(
            "Credentials updated successfully.",
            "تم تحديث بيانات الدخول بنجاح.",
          ),
        );
        setCurrentPassword("");
        setNewUsername("");
        setNewPassword("");
        setConfirmation("");
      } else {
        setIsSuccess(false);
        setMessage(
          result.error ||
            t(
              "Could not change password. Please check current password.",
              "تعذر تغيير كلمة المرور. يرجى التحقق من كلمة المرور الحالية.",
            ),
        );
      }
      return;
    }

    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ currentPassword, newUsername, newPassword }),
    });

    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      setIsSuccess(true);
      setMessage(
        t(
          "Credentials updated successfully.",
          "تم تحديث بيانات الدخول بنجاح.",
        ),
      );
      setCurrentPassword("");
      setNewUsername("");
      setNewPassword("");
      setConfirmation("");
    } else {
      setIsSuccess(false);
      setMessage(
        result.error ||
          t(
            "Could not change password. Please check current password.",
            "تعذر تغيير كلمة المرور. يرجى التحقق من كلمة المرور الحالية.",
          ),
      );
    }
  };

  return (
    <section
      className="mt-6 rounded-xl border border-border bg-card p-6 soft-shadow"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
        {t("Security & Credentials", "الأمان وبيانات الدخول")}
      </div>
      <h2 className="mt-1 text-xl font-bold text-foreground">
        {t("Change username and password", "تغيير اسم المستخدم وكلمة المرور")}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {t(
          "Update the administrator account credentials used to sign in to this system.",
          "تحديث بيانات حساب المدير المسجل للدخول إلى هذا النظام.",
        )}
      </p>

      <form onSubmit={submit} className="mt-5 grid max-w-md gap-3.5">
        <label className="grid gap-1.5 text-xs font-semibold text-foreground text-start">
          <span>{t("Current password", "كلمة المرور الحالية")} *</span>
          <input
            required
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder={t("Enter current password", "أدخل كلمة المرور الحالية")}
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm font-sans"
            data-testid="input-current-password"
          />
        </label>

        <label className="grid gap-1.5 text-xs font-semibold text-foreground text-start">
          <span>{t("New username", "اسم المستخدم الجديد")} *</span>
          <input
            required
            type="text"
            value={newUsername}
            onChange={(event) => setNewUsername(event.target.value)}
            placeholder={t("Enter new username", "أدخل اسم المستخدم الجديد")}
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm font-sans"
            data-testid="input-new-username"
          />
        </label>

        <label className="grid gap-1.5 text-xs font-semibold text-foreground text-start">
          <span>{t("New password", "كلمة المرور الجديدة")} *</span>
          <input
            required
            minLength={10}
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder={t("New password (10+ characters)", "كلمة المرور الجديدة (10 خانات فأكثر)")}
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm font-sans"
            data-testid="input-new-password"
          />
        </label>

        <label className="grid gap-1.5 text-xs font-semibold text-foreground text-start">
          <span>{t("Confirm new password", "تأكيد كلمة المرور الجديدة")} *</span>
          <input
            required
            minLength={10}
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={t("Confirm new password", "أعد كتابة كلمة المرور الجديدة")}
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm font-sans"
            data-testid="input-confirm-password"
          />
        </label>

        <Button
          type="submit"
          className="mt-2 w-fit bg-primary text-primary-foreground hover:bg-primary/90"
          data-testid="button-save-credentials"
        >
          {t("Save credentials", "حفظ البيانات الجديدة")}
        </Button>

        {message && (
          <p
            className={`text-xs font-medium ${isSuccess ? "text-[#32B77E]" : "text-destructive"}`}
            data-testid="text-password-message"
          >
            {message}
          </p>
        )}
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
  const { t, lang: language, setLanguage } = useT();
  const [ready, setReady] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const frontendOnly =
    !window.alBassamDesktop &&
    (import.meta.env.VITE_FRONTEND_ONLY === "true" ||
      !import.meta.env.VITE_API_URL);

  useEffect(() => {
    if (frontendOnly) {
      let cancelled = false;
      (async () => {
        await ensureCredentials();
        if (cancelled) return;
        if (isAuthenticated()) setReady(true);
      })();
      return () => {
        cancelled = true;
      };
    }
    setAuthTokenGetter(() => authToken);
    fetch("/api/auth/status")
      .then((response) => response.json())
      .then(async (status) => {
        setSetupRequired(status.setupRequired);
        const token = authToken;
        if (status.setupRequired) return;
        if (!token) return;
        const check = await fetch("/api/dashboard/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (check.ok) setReady(true);
        else authToken = "";
      })
      .catch(() =>
        setError(
          t(
            "Could not connect to the authentication service.",
            "تعذر الاتصال بخدمة التحقق من الهوية.",
          ),
        ),
      );
    return undefined;
  }, [t, frontendOnly]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (frontendOnly) {
      const ok = await verifyLogin(username, password);
      if (!ok) {
        return setError(
          t(
            "Authentication failed. Please check your credentials.",
            "فشل تسجيل الدخول. يرجى التحقق من اسم المستخدم وكلمة المرور.",
          ),
        );
      }
      createSession();
      if (!isSeeded()) {
        seedDemoData();
        markSeeded();
      }
      setPassword("");
      setReady(true);
      return;
    }
    const endpoint = setupRequired ? "/api/auth/setup" : "/api/auth/login";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return setError(
        result.error ||
          t(
            "Authentication failed. Please check your credentials.",
            "فشل تسجيل الدخول. يرجى التحقق من اسم المستخدم وكلمة المرور.",
          ),
      );
    }
    if (setupRequired) {
      setSetupRequired(false);
      setPassword("");
      return;
    }
    authToken = result.token;
    setAuthTokenGetter(() => authToken);
    setReady(true);
  };

  if (!ready) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#FCFBF0] p-6"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        <form
          onSubmit={submit}
          className="w-full max-w-md rounded-xl border border-border bg-card p-7 soft-shadow"
        >
          {/* Header & Language Toggle */}
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">
              {t("Al-Bassam School", "مدارس البسام الأهلية")}
            </div>
            <button
              type="button"
              onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
              className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
              data-testid="button-login-lang"
            >
              {language === "ar" ? "English (EN)" : "العربية (AR)"}
            </button>
          </div>

          <h1 className="mt-3 text-2xl font-bold text-foreground">
            {setupRequired
              ? t("Create admin account", "إنشاء حساب المدير")
              : t("Sign in", "تسجيل الدخول")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {setupRequired
              ? t(
                  "Create the username and password required to access this system.",
                  "قم بإنشاء اسم المستخدم وكلمة المرور للوصول إلى النظام.",
                )
              : t(
                  "Enter your administrator credentials to access the school workspace.",
                  "أدخل اسم المس��خدم وكلمة المرور للمتابعة إلى مساحة العمل.",
                )}
          </p>

          <div className="mt-6 space-y-3.5">
            <label className="grid gap-1 text-xs font-semibold text-foreground text-start">
              <span>{t("Username", "اسم المستخدم")}</span>
              <input
                autoFocus
                required
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder={t("Username", "اسم المستخدم")}
                className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm font-sans outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                data-testid="input-login-username"
              />
            </label>

            <label className="grid gap-1 text-xs font-semibold text-foreground text-start">
              <span>{t("Password", "كلمة المرور")}</span>
              <input
                required
                minLength={10}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("Password (10+ characters)", "كلمة المرور (10 خانات فأكثر)")}
                className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm font-sans outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                data-testid="input-login-password"
              />
            </label>
          </div>

          <Button
            type="submit"
            className="mt-5 w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-sm font-bold"
            data-testid="button-login-submit"
          >
            {setupRequired
              ? t("Create account", "إنشاء الحساب")
              : t("Sign in", "تسجيل الدخول")}
          </Button>

          {error && <p className="mt-3 text-xs font-medium text-destructive">{error}</p>}
        </form>
      </div>
    );
  }

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
      <ThemeProvider>
        <ProfilePictureProvider>
<QueryClientProvider client={queryClient}>
  <LocalStoreSync />
  <TooltipProvider>
            <ConfirmProvider>
              <WouterRouter base={routerBase} hook={routerHook}>
                <AuthGate />
              </WouterRouter>
              <Toaster />
            </ConfirmProvider>
          </TooltipProvider>
        </QueryClientProvider>
        </ProfilePictureProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
