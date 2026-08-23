import { createContext, type FormEvent, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  Activity, AlertTriangle, ArrowUpRight, Barcode, Bell, BookOpen, Briefcase, CalendarDays, Check,
  ChevronDown, CircleCheck, Clock3, Filter, GraduationCap, Languages, LayoutDashboard,
  Library, Menu, MoreHorizontal, Pencil, Plus, RefreshCw, Search, Settings2,
  SlidersHorizontal, Sparkles, Trash2, UsersRound, X,
} from 'lucide-react';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import {
  type AcademicYear, type Book, type BookInput, type DashboardSummary, type Employee,
  type EmployeeInput, type Student, type StudentInput, type Teacher, type TeacherInput,
  getGetAcademicYearsQueryKey, getGetBooksQueryKey, getGetDashboardSummaryQueryKey,
  getGetEmployeesQueryKey, getGetStudentsQueryKey, getGetTeachersQueryKey, useCreateBook,
  useCreateEmployee, useCreateStudent, useCreateTeacher, useDeleteBook, useDeleteEmployee,
  useDeleteStudent, useDeleteTeacher, useGetAcademicYears, useGetBooks, useGetDashboardSummary,
  useGetEmployees, useGetStudents, useGetTeachers, useUpdateBook, useUpdateEmployee,
  useUpdateStudent, useUpdateTeacher,
} from '@workspace/api-client-react';
import { getBooks } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

const fallbackSummary: DashboardSummary = {
  students: 0, teachers: 0, books: 0, attendanceRate: 0, recentActivity: [],
};

type Language = 'en' | 'ar';
type Translation = { lang: Language; setLanguage: (lang: Language) => void; t: (english: string, arabic: string) => string };
const LanguageContext = createContext<Translation>({ lang: 'en', setLanguage: () => undefined, t: (english) => english });
const useT = () => useContext(LanguageContext);

function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('al-bassam-language') === 'ar' ? 'ar' : 'en'));
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.body.dataset.language = language;
    localStorage.setItem('al-bassam-language', language);
  }, [language]);
  const t = useCallback((english: string, arabic: string) => (language === 'ar' ? arabic : english), [language]);
  return <LanguageContext.Provider value={{ lang: language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5" data-testid="brand-logo">
      <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-[0_0_0_1px_rgba(239,209,138,.4),0_3px_12px_rgba(0,0,0,.28)] ${compact ? 'h-10 w-10' : 'h-10 w-[74px] px-1.5'}`}>
        <img src="/al-bassam-logo.png" alt="Al-Bassam School" className="h-full w-full object-contain" />
      </div>
      {!compact && (
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[13px] font-bold tracking-[.16em] text-white">AL-BASSAM</div>
          <div className="ar truncate text-[10px] text-[#a7c3cf]">مدارس البسام</div>
        </div>
      )}
    </div>
  );
}

const navItems = [
  { href: '/', label: 'Overview', arabic: 'نظرة عامة', icon: LayoutDashboard, tabs: [] },
  { href: '/employees', label: 'Employees', arabic: 'الموظفون', icon: Briefcase, tabs: [{ label: 'Teachers', arabic: 'المعلمون', href: '/teachers' }, { label: 'Staff records', arabic: 'سجلات الموظفين', href: '/employees' }] },
  { href: '/students', label: 'Students', arabic: 'الطلاب', icon: GraduationCap, tabs: [{ label: 'Student records', arabic: 'سجلات الطلاب', href: '/students' }, { label: 'Student distribution', arabic: 'توزيع الطلاب', href: '/students/distribution' }] },
  { href: '/library', label: 'Library', arabic: 'المكتبة', icon: Library, tabs: [{ label: 'Books', arabic: 'الكتب', href: '/library' }, { label: 'Categories', arabic: 'تصنيفات الكتب', href: '/library/categories' }, { label: 'Index', arabic: 'الفهرس', href: '/library/index' }] },
];

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang: language, setLanguage, t } = useT();
  const academic = useGetAcademicYears({
    query: { queryKey: getGetAcademicYearsQueryKey() },
  });
  const years = academic.data ?? [];
  const current = years.find((year) => year.isCurrent) ?? years[0];
  const [selectedYear, setSelectedYear] = useState<string | undefined>(() => localStorage.getItem('al-bassam-year') ?? undefined);

  const selectYear = (year: AcademicYear) => {
    setSelectedYear(String(year.id));
    localStorage.setItem('al-bassam-year', String(year.id));
  };
  const activeYear = years.find((year) => String(year.id) === selectedYear) ?? current;
  const text = t;

  return (
    <div className={`app-noise min-h-[100dvh] bg-background text-foreground ${language === 'ar' ? 'font-arabic' : ''}`}>
      <aside className={`fixed inset-y-0 z-40 flex w-[248px] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 md:translate-x-0 ${language === 'ar' ? 'right-0' : 'left-0'} ${mobileOpen ? 'translate-x-0' : language === 'ar' ? 'translate-x-full' : '-translate-x-full'}`} dir={language === 'ar' ? 'rtl' : 'ltr'} data-testid="sidebar-navigation">
        <div className="flex h-[88px] items-center border-b border-sidebar-border px-7">
          <LogoMark />
          <button onClick={() => setMobileOpen(false)} className={`${language === 'ar' ? 'mr-auto' : 'ml-auto'} rounded-md p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-white md:hidden`} data-testid="button-close-mobile-menu" aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-sidebar-foreground/45">Workspace</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const groupHrefs = [item.href, ...item.tabs.map((tab) => tab.href)];
              const active = item.href === '/' ? location === '/' : groupHrefs.some((href) => location === href || location.startsWith(`${href}/`));
              const Icon = item.icon;
              return (
                <div key={item.href}>
                <Link href={item.href} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-lg px-3 py-3 transition-all hover:bg-sidebar-accent ${active ? 'nav-active bg-sidebar-accent text-white' : 'text-sidebar-foreground/65'}`} data-testid={`link-nav-${item.label.toLowerCase()}`}>
                  <Icon size={18} strokeWidth={active ? 2.2 : 1.8} className={active ? 'text-[#61c8d6]' : 'group-hover:text-[#61c8d6]'} />
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  <span className={`text-[11px] ${active ? 'text-[#a7dfe4]' : 'text-sidebar-foreground/35'}`}>{text(item.label, item.arabic)}</span>
                </Link>
                {active && item.tabs.length > 0 && <div className={`mt-1 space-y-0.5 border-sidebar-border pb-1 ${language === 'ar' ? 'mr-9 border-r-2 border-r-[#61c8d6]-50 pr-3' : 'ml-9 border-l-2 border-l-[#61c8d6]-50 pl-3'}`}>{item.tabs.map((tab) => <Link key={tab.href} href={tab.href} className={`block rounded-md px-3 py-2 text-[11px] transition-colors ${location === tab.href ? 'bg-sidebar-accent/70 font-semibold text-white' : 'text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-white'}`} data-testid={`link-nav-tab-${tab.href.replaceAll('/', '-')}`}>{text(tab.label, tab.arabic)}</Link>)}</div>}
                </div>
              );
            })}
          </nav>
          <p className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-sidebar-foreground/45">{text('Administration', 'الإدارة')}</p>
          <Link href="/settings" onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-lg px-3 py-3 transition-all hover:bg-sidebar-accent ${location === '/settings' ? 'nav-active bg-sidebar-accent text-white' : 'text-sidebar-foreground/65'}`} data-testid="link-nav-settings">
            <Settings2 size={18} className={location === '/settings' ? 'text-[#61c8d6]' : 'group-hover:text-[#61c8d6]'} />
            <span className="flex-1 text-sm font-medium">{text('Settings', 'الإعدادات')}</span>
          </Link>
        </div>
        <div className="mt-auto p-5">
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#efd18a]"><CalendarDays size={13} /> Academic year</div>
            <select value={activeYear ? String(activeYear.id) : ''} onChange={(event) => { const year = years.find((item) => String(item.id) === event.target.value); if (year) selectYear(year); }} className="w-full cursor-pointer appearance-none bg-transparent text-sm font-semibold text-white outline-none" data-testid="select-academic-year" disabled={!years.length}>
              {years.length ? years.map((year) => <option key={year.id} value={year.id} className="bg-[#263765]">{year.label}</option>) : <option>Loading years…</option>}
            </select>
            <div className="mt-1 text-[11px] text-sidebar-foreground/45">{activeYear ? `${formatDate(activeYear.startDate)} — ${formatDate(activeYear.endDate)}` : 'Academic calendar'}</div>
          </div>
          <div className="mt-5 flex items-center gap-3 border-t border-sidebar-border pt-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#efd18a] text-xs font-bold text-[#263765]">SA</div>
            <div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold text-white">School Admin</div><div className="truncate text-[10px] text-sidebar-foreground/45">Administration office</div></div>
            <button className="text-sidebar-foreground/45 hover:text-white" data-testid="button-user-menu" aria-label="Open user menu"><MoreHorizontal size={17} /></button>
          </div>
        </div>
      </aside>
      {mobileOpen && <button onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-[#172541]/50 md:hidden" aria-label="Close navigation overlay" data-testid="button-mobile-overlay" />}
      <main className={`min-h-[100dvh] ${language === 'ar' ? 'md:pr-[248px]' : 'md:pl-[248px]'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden" data-testid="button-open-mobile-menu" aria-label={text('Open navigation menu', 'فتح قائمة التنقل')}><Menu size={21} /></button>
            <div className="hidden text-xs text-muted-foreground sm:block"><span className="font-medium text-foreground">Al-Bassam School</span><span className="mx-2 text-border">/</span><span>{(() => { if (location === '/settings') return 'Settings'; const parent = navItems.find((item) => item.href !== '/' && (location === item.href || location.startsWith(`${item.href}/`))); if (!parent) return 'Workspace'; const tab = parent.tabs.find((entry) => entry.href === location); return tab ? `${parent.label} / ${text(tab.label, tab.arabic)}` : parent.label; })()}</span></div>
            <span className="ar hidden text-[11px] text-muted-foreground sm:block">البسام</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5 text-[10px] font-semibold" dir="ltr"><button onClick={() => setLanguage('en')} className={`rounded-md px-2 py-1 transition-colors ${language === 'en' ? 'bg-[#263765] text-white' : 'text-muted-foreground'}`} data-testid="button-language-en">EN</button><button onClick={() => setLanguage('ar')} className={`rounded-md px-2 py-1 transition-colors ${language === 'ar' ? 'bg-[#263765] text-white' : 'text-muted-foreground'}`} data-testid="button-language-ar">ع</button></div>
            <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground md:flex"><Search size={14} /><span>Search workspace</span><kbd className="ml-4 rounded border border-border px-1.5 py-0.5 font-mono text-[9px]">⌘ K</kbd></div>
            <button className="relative rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-card hover:text-primary" data-testid="button-notifications" aria-label="View notifications"><Bell size={18} /><span className={`absolute top-2 h-1.5 w-1.5 rounded-full bg-[#efd18a] ${language === 'ar' ? 'left-2' : 'right-2'}`} /></button>
            <div className="hidden h-7 w-px bg-border sm:block" />
            <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d8edf0] text-[10px] font-bold text-[#176d7e]">SA</div><span className="hidden text-xs font-semibold sm:block">School Admin</span><ChevronDown size={14} className="hidden text-muted-foreground sm:block" /></div>
          </div>
        </header>
        <div className="px-5 py-7 sm:px-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const locale = typeof document !== 'undefined' && document.documentElement.lang === 'ar' ? 'ar' : 'en';
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function PageHeading({ eyebrow, eyebrowAr, title, arabic, description, descriptionAr, action }: { eyebrow: string; eyebrowAr?: string; title: string; arabic: string; description: string; descriptionAr?: string; action?: ReactNode }) {
  const { t } = useT();
  return <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-primary"><span className="h-1.5 w-1.5 rounded-full bg-accent" />{t(eyebrow, eyebrowAr ?? eyebrow)}</div><div className="flex flex-wrap items-baseline gap-3"><h1 className="text-3xl font-bold tracking-[-.04em] text-[#263765] sm:text-[40px]">{t(title, arabic)}</h1><span className={`text-sm text-muted-foreground ${t('en', 'ar') === 'ar' ? '' : 'ar'}`}>{t(arabic, title)}</span></div><p className="mt-2 max-w-xl text-sm text-muted-foreground">{t(description, descriptionAr ?? description)}</p></div>{action}</div>;
}

function LoadingCards({ count = 4 }: { count?: number }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: count }).map((_, index) => <div className="h-[126px] rounded-xl border border-border bg-card p-5" key={index}><div className="skeleton mb-4 h-3 w-20 rounded" /><div className="skeleton h-8 w-28 rounded" /><div className="skeleton mt-3 h-2 w-16 rounded" /></div>)}</div>;
}

function ErrorState({ label, labelAr, onRetry }: { label: string; labelAr?: string; onRetry: () => void }) {
  const { t } = useT();
  return <div className="flex flex-col items-center justify-center rounded-xl border border-[#efd7d3] bg-[#fff8f6] px-6 py-16 text-center"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#fbe5df] text-[#c35d4d]"><AlertTriangle size={19} /></div><h3 className="font-semibold text-[#7e3f38]">{t(`Could not load ${label}`, `تعذّر تحميل ${labelAr ?? label}`)}</h3><p className="mt-1 text-sm text-[#a56b63]">{t('The workspace will try again when you ask it to.', 'ستحاول مساحة العمل مجددًا بمجرد طلب ذلك.')}</p><Button variant="outline" size="sm" onClick={onRetry} className="mt-5 border-[#e5c2bc] bg-transparent text-[#a24f45]" data-testid={`button-retry-${label.toLowerCase().replaceAll(' ', '-')}`}><RefreshCw size={14} /> {t('Try again', 'حاول مجددًا')}</Button></div>;
}

function EmptyState({ icon: Icon, title, detail, action }: { icon: typeof BookOpen; title: string; detail: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary"><Icon size={25} strokeWidth={1.6} /></div><h3 className="font-semibold text-[#263765]">{title}</h3><p className="mt-2 max-w-sm text-sm text-muted-foreground">{detail}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

function StatCard({ label, arabic, value, icon: Icon, tone, note }: { label: string; arabic: string; value: string | number; icon: typeof UsersRound; tone: 'navy' | 'teal' | 'gold' | 'sky'; note: string }) {
  const { t } = useT();
  const tones = { navy: 'bg-[#263765] text-white', teal: 'bg-[#d9f0ed] text-[#176d70]', gold: 'bg-[#fff3d9] text-[#946d23]', sky: 'bg-[#dff2f5] text-[#19768a]' };
  return <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 soft-shadow transition-transform duration-300 hover:-translate-y-1" data-testid={`card-stat-${label.toLowerCase()}`}><div className={`mb-5 flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}><Icon size={18} /></div><div className="flex items-end justify-between gap-2"><div><div className="text-[11px] font-semibold uppercase tracking-[.13em] text-muted-foreground">{t(label, arabic)}</div><div className={`mt-0.5 text-[10px] text-muted-foreground/70 ${t('ar', 'en') === 'ar' ? '' : 'ar'}`}>{t(arabic, label)}</div></div><strong className="font-mono text-[29px] tracking-[-.06em] text-[#263765]">{value}</strong></div><div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{note}</div><div className="absolute -right-7 -top-7 h-24 w-24 rounded-full border-[12px] border-primary/5 transition-transform duration-500 group-hover:scale-125" /></div>;
}

function Dashboard() {
  const [, setLocation] = useLocation();
  const { t } = useT();
  const summaryQuery = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const summary = summaryQuery.data ?? fallbackSummary;
  const activity = summary.recentActivity ?? [];
  const activityIcon = (type: string) => type === 'library' ? <Library size={15} /> : type === 'teacher' ? <UsersRound size={15} /> : type === 'student' ? <GraduationCap size={15} /> : <Activity size={15} />;
  return <div className="rise-in">
    <PageHeading eyebrow="School pulse · 01" eyebrowAr="نبض المدرسة · 01" title={t('Good morning, admin.', 'صباح الخير، أيها المدير.')} arabic={t('صباح الخير', 'Good morning')} description={t('A composed view of the people, places and pages moving through Al-Bassam today.', 'نظرة هادئة على الأشخاص والأماكن والصفحات المتحركة في البسام اليوم.')} action={<Button onClick={() => setLocation('/students')} className="h-11 rounded-lg bg-[#263765] px-5 text-sm hover:bg-[#1c2b55]" data-testid="button-open-students"><ArrowUpRight size={16} /> {t('Open student records', 'فتح سجلات الطلاب')}</Button>} />
    {summaryQuery.isLoading ? <LoadingCards /> : summaryQuery.isError ? <ErrorState label="dashboard data" labelAr="بيانات لوحة التحكم" onRetry={() => summaryQuery.refetch()} /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Students" arabic="الطلاب" value={summary.students.toLocaleString()} icon={GraduationCap} tone="navy" note={t('Active enrolment', 'التحاق نشط')} /><StatCard label="Teachers" arabic="المعلمون" value={summary.teachers.toLocaleString()} icon={UsersRound} tone="teal" note={t('Faculty directory', 'دليل أعضاء هيئة التدريس')} /><StatCard label="Library books" arabic="كتب المكتبة" value={summary.books.toLocaleString()} icon={BookOpen} tone="gold" note={t('Titles in catalogue', 'عناوين في الفهرس')} /><StatCard label="Attendance" arabic="الحضور" value={`${summary.attendanceRate}%`} icon={CircleCheck} tone="sky" note={t('This academic year', 'هذا العام الدراسي')} /></div>}
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
      <section className="rounded-xl border border-border bg-card p-6 soft-shadow"><div className="mb-6 flex items-start justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">{t('Recent activity', 'النشاط الأخير')}</div><h2 className="mt-1 text-xl font-bold tracking-[-.03em] text-[#263765]">{t('The school, in motion', 'المدرسة في حِركة مستمرة')}</h2></div><button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary" data-testid="button-activity-options" aria-label={t('Activity options', 'خيارات النشاط')}><MoreHorizontal size={18} /></button></div>{summaryQuery.isLoading ? <div className="space-y-5">{[1, 2, 3, 4].map((item) => <div className="flex gap-4" key={item}><div className="skeleton h-9 w-9 rounded-lg" /><div className="flex-1"><div className="skeleton h-3 w-3/5 rounded" /><div className="skeleton mt-2 h-2 w-2/5 rounded" /></div></div>)}</div> : activity.length ? <div className="space-y-1">{activity.slice(0, 6).map((item) => <div className="group flex items-center gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-secondary/60" key={item.id} data-testid={`activity-item-${item.id}`}><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">{activityIcon(item.type)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-[#263765]">{item.title}</p><p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground"><Clock3 size={11} />{formatDate(item.timestamp)}</p></div><ArrowUpRight size={14} className="text-border transition-colors group-hover:text-primary" /></div>)}</div> : <div className="py-10 text-center text-sm text-muted-foreground">{t('Your activity stream will appear here.', 'سيظهر سجل نشاطاتك هنا.')}</div>}</section>
      <section className="relative overflow-hidden rounded-xl bg-[#19768a] p-7 text-white"><div className="relative z-10"><div className="mb-10 flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-[#efd18a]"><Sparkles size={18} /></div><div className="text-[10px] font-bold uppercase tracking-[.2em] text-[#b4e0e2]">{t('A note from the office', 'ملاحظة من الإدارة')}</div><h2 className="mt-3 max-w-xs text-2xl font-bold leading-tight tracking-[-.04em]">{t('Small records build a remarkable school.', 'السجلات الصغيرة تبني مدرسة متميزة.')}</h2><p className="mt-3 max-w-xs text-sm leading-6 text-[#d2edef]">{t('Keep today’s details close. The right information, at the right moment, makes room for better teaching.', 'حافظ على تفاصيل اليوم قريبة؛ فالمعلومة الصحيحة في اللحظة المناسبة تصنع مساحة أفضل للتعليم.')}</p></div><div className="absolute -bottom-14 -right-12 h-48 w-48 rounded-full border-[22px] border-white/10" /><div className="absolute -right-5 top-10 h-24 w-24 rounded-full border border-[#efd18a]/50" /></section>
    </div>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d9e8ea] bg-[#f2faf9] px-5 py-4 text-sm"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d4efeb] text-[#176d70]"><Languages size={15} /></div><span className="font-medium text-[#28545c]">{t('Workspace is ready in English and Arabic', 'مساحة العمل جاهزة بالعربية والإنجليزية')}</span></div><span className={`text-xs text-[#538188] ${t('ar', 'en') === 'ar' ? '' : 'ar'}`}>{t('مساحة العمل جاهزة بالعربية والإنجليزية', 'Workspace is ready in English and Arabic')}</span></div>
  </div>;
}

type StudentFormValue = StudentInput & { id?: number };
const blankStudent: StudentFormValue = { fullName: '', fullNameArabic: '', studentNumber: '', nationalId: '', grade: '', className: '', guardianName: '', guardianPhone: '', enrollmentDate: new Date().toISOString().slice(0, 10) };

function StudentDialog({ open, onOpenChange, editing, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; editing?: Student; onSaved: (message: string) => void }) {
  const [form, setForm] = useState<StudentFormValue>(blankStudent);
  useEffect(() => {
    if (open) setForm(editing ? { ...editing, enrollmentDate: (editing.enrollmentDate || '').slice(0, 10) } : blankStudent);
  }, [open, editing]);
  const create = useCreateStudent();
  const update = useUpdateStudent();
  const queryClient = useQueryClient();
  const isEditing = Boolean(editing);
  const set = (key: keyof StudentFormValue, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.fullName || !form.fullNameArabic || !form.studentNumber || !form.nationalId || !form.grade || !form.className) return;
    const data: StudentInput = { fullName: form.fullName, fullNameArabic: form.fullNameArabic, studentNumber: form.studentNumber, nationalId: form.nationalId, grade: form.grade, className: form.className, guardianName: form.guardianName, guardianPhone: form.guardianPhone, enrollmentDate: form.enrollmentDate };
    const done = () => { queryClient.invalidateQueries({ queryKey: getGetStudentsQueryKey() }); onOpenChange(false); onSaved(isEditing ? 'Student record updated' : 'Student added to the directory'); };
    if (isEditing && editing) update.mutate({ id: editing.id, data }, { onSuccess: done });
    else create.mutate({ data }, { onSuccess: done });
  };
  const pending = create.isPending || update.isPending;
  const saveError = create.isError || update.isError;
  const { t } = useT();
  const fields: { key: keyof StudentFormValue; label: string; arabic: string; placeholder: string }[] = [
    { key: 'fullName', label: 'Full name', arabic: 'الاسم الكامل', placeholder: t('e.g. Sara Al-Harbi', 'مثال: سارة الحربي') },
    { key: 'fullNameArabic', label: 'Arabic name', arabic: 'الاسم بالعربية', placeholder: 'مثال: سارة الحربي' },
    { key: 'studentNumber', label: 'Student number', arabic: 'رقم الطالب', placeholder: 'AB-2024-014' },
    { key: 'nationalId', label: 'National ID', arabic: 'الهوية الوطنية', placeholder: '10xxxxxxxx' },
    { key: 'grade', label: 'Grade', arabic: 'الصف', placeholder: t('Grade 8', 'الصف الثامن') },
    { key: 'className', label: 'Class', arabic: 'الفصل', placeholder: '8A' },
    { key: 'guardianName', label: 'Guardian name', arabic: 'اسم ولي الأمر', placeholder: t('Guardian full name', 'اسم ولي الأمر الكامل') },
    { key: 'guardianPhone', label: 'Guardian phone', arabic: 'هاتف ولي الأمر', placeholder: '+966 5x xxx xxxx' },
  ];
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-2xl border-border bg-[#f8fbfc] p-0"><form onSubmit={submit}><DialogHeader className="border-b border-border bg-card px-6 py-5 text-left"><div className="flex items-start justify-between pr-8"><div><div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">{t(isEditing ? 'Edit record' : 'New enrolment', isEditing ? 'تعديل السجل' : 'تسجيل جديد')}</div><DialogTitle className="mt-1 text-2xl text-[#263765]">{t(isEditing ? 'Update student' : 'Add a student', isEditing ? 'تحديث بيانات طالب' : 'إضافة طالب')}</DialogTitle><DialogDescription className="mt-1">{t('Keep the directory details accurate and easy to find.', 'حافظ على دقة تفاصيل الدليل وسهولة الوصول إليها.')}</DialogDescription></div><span className={`text-xs text-muted-foreground ${t('ar', 'en') === 'ar' ? '' : 'ar'}`}>{t('تعديل السجل', 'Edit record')}</span></div></DialogHeader><div className="grid gap-4 px-6 py-6 sm:grid-cols-2">{fields.map((field) => <label className="block" key={field.key}><span className="mb-1.5 flex items-baseline justify-between text-xs font-semibold text-[#385268]"><span>{t(field.label, field.arabic)}</span><span className={`text-[9px] font-normal text-muted-foreground ${t('ar', 'en') === 'ar' ? '' : 'ar'}`}>{t(field.arabic, field.label)}</span></span><input required={!['guardianName', 'guardianPhone'].includes(field.key)} value={String(form[field.key] ?? '')} onChange={(event) => set(field.key, event.target.value)} placeholder={field.placeholder} className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/10" data-testid={`input-student-${field.key}`} /></label>)}<label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#385268]">{t('Enrollment date', 'تاريخ التسجيل')}</span><input type="date" required value={form.enrollmentDate} onChange={(event) => set('enrollmentDate', event.target.value)} className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary" data-testid="input-student-enrollmentDate" /></label></div>{saveError && <div className="mx-6 mb-4 rounded-lg border border-destructive/30 bg-[#fff0ee] px-4 py-3 text-sm text-destructive" data-testid="error-student-dialog">{t('Could not save — the student number or national ID may already be in use.', 'تعذر الحفظ — قد يكون رقم الطالب أو الهوية الوطنية مستخدماً بالفعل.')}</div>}<DialogFooter className="border-t border-border bg-card px-6 py-4"><Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-student">{t('Cancel', 'إلغاء')}</Button><Button type="submit" disabled={pending} className="bg-[#263765] hover:bg-[#1c2b55]" data-testid="button-save-student">{pending ? t('Saving…', 'جارٍ الحفظ…') : isEditing ? t('Save changes', 'حفظ التغييرات') : t('Add student', 'إضافة الطالب')}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function StudentRow({ student, onEdit, onDelete }: { student: Student; onEdit: (student: Student) => void; onDelete: (student: Student) => void }) {
  const { t } = useT();
  const statusLabel = { active: t('active', 'نشط'), graduated: t('graduated', 'متخرج'), inactive: t('inactive', 'غير نشط') }[student.status] ?? student.status;
  return <div className="group grid min-w-[940px] grid-cols-[2fr_1fr_1.15fr_.8fr_1.25fr_1fr_.75fr_88px] items-center border-b border-border/70 px-5 py-3 transition-colors hover:bg-secondary/40" data-testid={`row-student-${student.id}`}><div className="flex items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e0f0f1] text-xs font-bold text-[#19768a]">{student.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><div><div className="text-sm font-semibold text-[#263765]">{student.fullName}</div><div className="ar text-[10px] text-muted-foreground">{student.fullNameArabic}</div></div></div><span className="font-mono text-xs text-muted-foreground" dir="ltr">{student.studentNumber}</span><span className="font-mono text-xs text-muted-foreground" dir="ltr">{student.nationalId}</span><div><div className="text-xs font-medium text-[#385268]">{student.grade}</div><div className="text-[10px] text-muted-foreground" dir="auto">{student.className}</div></div><div className="text-xs text-muted-foreground">{student.guardianName || t('Not provided', 'غير مُدخل')}<div className="mt-0.5 text-[10px]" dir="ltr">{student.guardianPhone}</div></div><span className="font-mono text-xs text-muted-foreground" dir="auto">{formatDate(student.enrollmentDate)}</span><span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${student.status === 'active' ? 'bg-[#dff2eb] text-[#277461]' : student.status === 'graduated' ? 'bg-[#fff0d1] text-[#8d6823]' : 'bg-muted text-muted-foreground'}`}>{statusLabel}</span><div className="flex justify-end gap-1 opacity-40 transition-opacity group-hover:opacity-100"><button onClick={() => onEdit(student)} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-primary" data-testid={`button-edit-student-${student.id}`} aria-label={`Edit ${student.fullName}`}><Pencil size={14} /></button><button onClick={() => onDelete(student)} className="rounded-md p-2 text-muted-foreground hover:bg-[#fff0ee] hover:text-destructive" data-testid={`button-delete-student-${student.id}`} aria-label={`Delete ${student.fullName}`}><Trash2 size={14} /></button></div></div>;
}

function StudentsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Student | undefined>();
  const [toast, setToast] = useState('');
  const { t } = useT();
  const query = useGetStudents({ search: search || undefined, status: (status || undefined) as 'active' | 'inactive' | 'graduated' | undefined }, { query: { queryKey: getGetStudentsQueryKey({ search: search || undefined, status: (status || undefined) as 'active' | 'inactive' | 'graduated' | undefined }) } });
  const deletion = useDeleteStudent();
  const queryClient = useQueryClient();
  const students = query.data ?? [];
  const filtered = useMemo(() => students, [students]);
  const openNew = () => { setEditing(undefined); setDialogOpen(true); };
  const edit = (student: Student) => { setEditing(student); setDialogOpen(true); };
  const remove = (student: Student) => { if (!window.confirm(t(`Delete ${student.fullName} from the directory?`, `حذف ${student.fullName} من الدليل؟`))) return; deletion.mutate({ id: student.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetStudentsQueryKey() }); setToast(t('Student record deleted', 'تم حذف سجل الطالب')); } }); };
  return <div className="rise-in"><PageHeading eyebrow="People · 03" eyebrowAr="الأشخاص · 03" title="Students" arabic="الطلاب" description="A clear, current directory for every learner in the Al-Bassam community." descriptionAr="دليل واضح ومحدّث لكل متعلم في مجتمع البسام التعليمية." action={<Button onClick={openNew} className="h-11 rounded-lg bg-[#263765] px-5 hover:bg-[#1c2b55]" data-testid="button-add-student"><Plus size={17} /> {t('Add student', 'إضافة طالب')}</Button>} />
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row"><div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:max-w-md"><Search size={16} className="text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('Search by name or student number', 'ابحث بالاسم أو رقم الطالب')} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" data-testid="input-search-students" /></div><div className="flex gap-2"><div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3"><Filter size={14} className="text-muted-foreground" /><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 bg-transparent text-xs font-medium outline-none" data-testid="select-student-status"><option value="">{t('All statuses', 'جميع الحالات')}</option><option value="active">{t('Active', 'نشط')}</option><option value="inactive">{t('Inactive', 'غير نشط')}</option><option value="graduated">{t('Graduated', 'متخرج')}</option></select></div><button onClick={() => query.refetch()} className="rounded-lg border border-border bg-card px-3 text-muted-foreground transition-colors hover:border-primary hover:text-primary" data-testid="button-refresh-students" aria-label={t('Refresh students', 'تحديث الطلاب')}><RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} /></button></div></div>
    {toast && <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#c8e5dc] bg-[#effaf5] px-4 py-3 text-sm text-[#277461] rise-in" data-testid="status-student-action"><Check size={16} />{toast}<button className="ml-auto text-[#277461]/60 hover:text-[#277461]" onClick={() => setToast('')} data-testid="button-dismiss-student-toast"><X size={14} /></button></div>}
    {query.isLoading ? <div className="rounded-xl border border-border bg-card p-5"><div className="space-y-5">{[1, 2, 3, 4, 5].map((item) => <div className="flex gap-4" key={item}><div className="skeleton h-9 w-9 rounded-full" /><div className="skeleton h-4 w-48 rounded" /></div>)}</div></div> : query.isError ? <ErrorState label="students" labelAr="الطلاب" onRetry={() => query.refetch()} /> : !filtered.length ? <EmptyState icon={GraduationCap} title={search || status ? t('No students match this view', 'لا يوجد طلاب مطابقون لهذا العرض') : t('Start your student directory', 'ابدأ دليل الطلاب')} detail={search || status ? t('Try another search term or clear the filters.', 'جرّب كلمة بحث أخرى أو امسح عوامل التصفية.') : t('Add the first student record to begin building the directory.', 'أضف أول سجل طالب لبدء بناء الدليل.')} action={!search && !status ? <Button onClick={openNew} data-testid="button-empty-add-student"><Plus size={15} /> {t('Add first student', 'إضافة أول طالب')}</Button> : undefined} /> : <div className="overflow-x-auto rounded-xl border border-border bg-card soft-shadow"><div className="grid min-w-[940px] grid-cols-[2fr_1fr_1.15fr_.8fr_1.25fr_1fr_.75fr_88px] border-b border-border bg-[#f5f9fa] px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground"><span>{t('Student', 'الطالب')}</span><span>{t('Number', 'الرقم')}</span><span>{t('National ID', 'الهوية الوطنية')}</span><span>{t('Class', 'الفصل')}</span><span>{t('Guardian', 'ولي الأمر')}</span><span>{t('Enrolled', 'تاريخ التسجيل')}</span><span>{t('Status', 'الحالة')}</span><span /></div>{filtered.map((student) => <StudentRow key={student.id} student={student} onEdit={edit} onDelete={remove} />)}</div>}
    <StudentDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} onSaved={setToast} />
  </div>;
}

type TeacherFormValue = TeacherInput & { id?: number };
const blankTeacher: TeacherFormValue = { fullName: '', fullNameArabic: '', employeeNumber: '', nationalId: '', subject: '', phone: '', status: 'active' };

function TeacherDialog({ open, onOpenChange, editing, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; editing?: Teacher; onSaved: (message: string) => void }) {
  const [form, setForm] = useState<TeacherFormValue>(blankTeacher);
  useEffect(() => {
    if (open) setForm(editing ? { ...editing } : blankTeacher);
  }, [open, editing]);
  const create = useCreateTeacher();
  const update = useUpdateTeacher();
  const queryClient = useQueryClient();
  const isEditing = Boolean(editing);
  const set = (key: keyof TeacherFormValue, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.fullName || !form.fullNameArabic || !form.employeeNumber || !form.nationalId || !form.subject || !form.phone) return;
    const data: TeacherInput = { fullName: form.fullName, fullNameArabic: form.fullNameArabic, employeeNumber: form.employeeNumber, nationalId: form.nationalId, subject: form.subject, phone: form.phone, status: form.status };
    const done = () => { queryClient.invalidateQueries({ queryKey: getGetTeachersQueryKey() }); onOpenChange(false); onSaved(isEditing ? t('Teacher record updated', 'تم تحديث سجل المعلم') : t('Teacher added to the faculty', 'تمت إضافة المعلم إلى هيئة التدريس')); };
    if (isEditing && editing) update.mutate({ id: editing.id, data }, { onSuccess: done });
    else create.mutate({ data }, { onSuccess: done });
  };
  const pending = create.isPending || update.isPending;
  const saveError = create.isError || update.isError;
  const { t } = useT();
  const fields: { key: keyof TeacherInput; label: string; arabic: string; placeholder: string }[] = [
    { key: 'fullName', label: 'Full name', arabic: 'الاسم الكامل', placeholder: t('e.g. Ahmad Al-Hares', 'مثال: أحمد الحارس') },
    { key: 'fullNameArabic', label: 'Arabic name', arabic: 'الاسم بالعربية', placeholder: 'مثال: أحمد الحارس' },
    { key: 'employeeNumber', label: 'Employee number', arabic: 'الرقم الوظيفي', placeholder: 'EMP-014' },
    { key: 'nationalId', label: 'National ID', arabic: 'الهوية الوطنية', placeholder: '10xxxxxxxx' },
    { key: 'subject', label: 'Subject', arabic: 'المادة', placeholder: t('Mathematics', 'الرياضيات') },
    { key: 'phone', label: 'Phone', arabic: 'الهاتف', placeholder: '+966 5x xxx xxxx' },
  ];
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-2xl border-border bg-[#f8fbfc] p-0"><form onSubmit={submit}><DialogHeader className="border-b border-border bg-card px-6 py-5 text-left"><div className="flex items-start justify-between pr-8"><div><div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">{t(isEditing ? 'Edit record' : 'New faculty member', isEditing ? 'تعديل السجل' : 'عضو هيئة تدريس جديد')}</div><DialogTitle className="mt-1 text-2xl text-[#263765]">{t(isEditing ? 'Update teacher' : 'Add a teacher', isEditing ? 'تحديث بيانات معلم' : 'إضافة معلم')}</DialogTitle><DialogDescription className="mt-1">{t('Keep the faculty directory accurate and easy to find.', 'حافظ على دقة دليل هيئة التدريس وسهولة الوصول إليها.')}</DialogDescription></div><span className={`text-xs text-muted-foreground ${t('ar', 'en') === 'ar' ? '' : 'ar'}`}>{t('تعديل السجل', 'Edit record')}</span></div></DialogHeader><div className="grid gap-4 px-6 py-6 sm:grid-cols-2">{fields.map((field) => <label className="block" key={field.key}><span className="mb-1.5 flex items-baseline justify-between text-xs font-semibold text-[#385268]"><span>{t(field.label, field.arabic)}</span><span className={`text-[9px] font-normal text-muted-foreground ${t('ar', 'en') === 'ar' ? '' : 'ar'}`}>{t(field.arabic, field.label)}</span></span><input required value={String(form[field.key] ?? '')} onChange={(event) => set(field.key, event.target.value)} placeholder={field.placeholder} className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/10" data-testid={`input-teacher-${field.key}`} /></label>)}<label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#385268]">{t('Status', 'الحالة')}</span><select value={form.status} onChange={(event) => set('status', event.target.value)} className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary" data-testid="input-teacher-status"><option value="active">{t('Active', 'نشط')}</option><option value="inactive">{t('Inactive', 'غير نشط')}</option></select></label></div>{saveError && <div className="mx-6 mb-4 rounded-lg border border-destructive/30 bg-[#fff0ee] px-4 py-3 text-sm text-destructive" data-testid="error-teacher-dialog">{t('Could not save — the employee number or national ID may already be in use.', 'تعذر الحفظ — قد يكون الرقم الوظيفي أو الهوية الوطنية مستخدماً بالفعل.')}</div>}<DialogFooter className="border-t border-border bg-card px-6 py-4"><Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-teacher">{t('Cancel', 'إلغاء')}</Button><Button type="submit" disabled={pending} className="bg-[#263765] hover:bg-[#1c2b55]" data-testid="button-save-teacher">{pending ? t('Saving…', 'جارٍ الحفظ…') : isEditing ? t('Save changes', 'حفظ التغييرات') : t('Add teacher', 'إضافة المعلم')}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function TeacherRow({ teacher, onEdit, onDelete }: { teacher: Teacher; onEdit: (teacher: Teacher) => void; onDelete: (teacher: Teacher) => void }) {
  const { t } = useT();
  const statusLabel = teacher.status === 'active' ? t('active', 'نشط') : t('inactive', 'غير نشط');
  return <div className="group grid min-w-[900px] grid-cols-[2fr_.9fr_1fr_1.15fr_1fr_.7fr_88px] items-center border-b border-border/70 px-5 py-3 transition-colors hover:bg-secondary/40" data-testid={`row-teacher-${teacher.id}`}><div className="flex items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d9f0ed] text-xs font-bold text-[#176d70]">{teacher.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><div><div className="text-sm font-semibold text-[#263765]">{teacher.fullName}</div><div className="ar text-[10px] text-muted-foreground">{teacher.fullNameArabic}</div></div></div><span className="font-mono text-xs text-muted-foreground" dir="ltr">{teacher.employeeNumber}</span><div className="text-xs font-medium text-[#385268]">{teacher.subject}</div><span className="font-mono text-xs text-muted-foreground" dir="ltr">{teacher.nationalId}</span><span className="text-xs text-muted-foreground" dir="ltr">{teacher.phone}</span><span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${teacher.status === 'active' ? 'bg-[#dff2eb] text-[#277461]' : 'bg-muted text-muted-foreground'}`}>{statusLabel}</span><div className="flex justify-end gap-1 opacity-40 transition-opacity group-hover:opacity-100"><button onClick={() => onEdit(teacher)} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-primary" data-testid={`button-edit-teacher-${teacher.id}`} aria-label={`Edit ${teacher.fullName}`}><Pencil size={14} /></button><button onClick={() => onDelete(teacher)} className="rounded-md p-2 text-muted-foreground hover:bg-[#fff0ee] hover:text-destructive" data-testid={`button-delete-teacher-${teacher.id}`} aria-label={`Delete ${teacher.fullName}`}><Trash2 size={14} /></button></div></div>;
}

const blankEmployee: EmployeeFormValue = { fullName: '', fullNameArabic: '', employeeNumber: '', nationalId: '', jobTitle: '', phone: '', status: 'active' };
type EmployeeFormValue = EmployeeInput & { status?: 'active' | 'inactive' };

function EmployeeDialog({ open, onOpenChange, editing, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; editing?: Employee; onSaved: (message: string) => void }) {
  const [form, setForm] = useState<EmployeeFormValue>(blankEmployee);
  useEffect(() => {
    if (open) setForm(editing ? { ...editing } : blankEmployee);
  }, [open, editing]);
  const create = useCreateEmployee();
  const update = useUpdateEmployee();
  const queryClient = useQueryClient();
  const isEditing = Boolean(editing);
  const set = (key: keyof EmployeeFormValue, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.fullName || !form.fullNameArabic || !form.employeeNumber || !form.nationalId || !form.jobTitle || !form.phone) return;
    const data: EmployeeInput = { fullName: form.fullName, fullNameArabic: form.fullNameArabic, employeeNumber: form.employeeNumber, nationalId: form.nationalId, jobTitle: form.jobTitle, phone: form.phone, status: form.status };
    const done = () => { queryClient.invalidateQueries({ queryKey: getGetEmployeesQueryKey() }); onOpenChange(false); onSaved(isEditing ? t('Employee record updated', 'تم تحديث سجل الموظف') : t('Employee added to the staff directory', 'تمت إضافة الموظف إلى سجل الموظفين')); };
    if (isEditing && editing) update.mutate({ id: editing.id, data }, { onSuccess: done });
    else create.mutate({ data }, { onSuccess: done });
  };
  const pending = create.isPending || update.isPending;
  const saveError = create.isError || update.isError;
  const { t } = useT();
  const fields: { key: keyof EmployeeInput; label: string; arabic: string }[] = [
    { key: 'fullName', label: 'Full name', arabic: 'الاسم الكامل' },
    { key: 'fullNameArabic', label: 'Arabic name', arabic: 'الاسم بالعربية' },
    { key: 'employeeNumber', label: 'Employee number', arabic: 'الرقم الوظيفي' },
    { key: 'nationalId', label: 'National ID', arabic: 'الهوية الوطنية' },
    { key: 'jobTitle', label: 'Job title', arabic: 'المسمى الوظيفي' },
    { key: 'phone', label: 'Phone', arabic: 'الهاتف' },
  ];
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-2xl border-border bg-[#f8fbfc] p-0"><form onSubmit={submit}><DialogHeader className="border-b border-border bg-card px-6 py-5 text-left"><div className="flex items-start justify-between pr-8"><div><div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">{t(isEditing ? 'Edit record' : 'New staff member', isEditing ? 'تعديل السجل' : 'موظف جديد')}</div><DialogTitle className="mt-1 text-2xl text-[#263765]">{t(isEditing ? 'Update employee' : 'Add an employee', isEditing ? 'تحديث بيانات موظف' : 'إضافة موظف')}</DialogTitle><DialogDescription className="mt-1">{t('Keep the staff directory accurate and easy to find.', 'حافظ على دقة سجل الموظفين وسهولة الوصول إليه.')}</DialogDescription></div><span className={`text-xs text-muted-foreground ${t('ar', 'en') === 'ar' ? '' : 'ar'}`}>{t('تعديل السجل', 'Edit record')}</span></div></DialogHeader><div className="grid gap-4 px-6 py-6 sm:grid-cols-2">{fields.map((field) => <label className="block" key={field.key}><span className="mb-1.5 flex items-baseline justify-between text-xs font-semibold text-[#385268]"><span>{t(field.label, field.arabic)}</span><span className={`text-[9px] font-normal text-muted-foreground ${t('ar', 'en') === 'ar' ? '' : 'ar'}`}>{t(field.arabic, field.label)}</span></span><input required value={String(form[field.key] ?? '')} onChange={(event) => set(field.key, event.target.value)} placeholder={field.key === 'employeeNumber' ? 'EMP-014' : undefined} className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/10" data-testid={`input-employee-${field.key}`} /></label>)}<label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#385268]">{t('Status', 'الحالة')}</span><select value={form.status} onChange={(event) => set('status', event.target.value)} className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary" data-testid="input-employee-status"><option value="active">{t('Active', 'نشط')}</option><option value="inactive">{t('Inactive', 'غير نشط')}</option></select></label></div>{saveError && <div className="mx-6 mb-4 rounded-lg border border-destructive/30 bg-[#fff0ee] px-4 py-3 text-sm text-destructive" data-testid="error-employee-dialog">{t('Could not save — the employee number or national ID may already be in use.', 'تعذر الحفظ — قد يكون الرقم الوظيفي أو الهوية الوطنية مستخدماً بالفعل.')}</div>}<DialogFooter className="border-t border-border bg-card px-6 py-4"><Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-employee">{t('Cancel', 'إلغاء')}</Button><Button type="submit" disabled={pending} className="bg-[#263765] hover:bg-[#1c2b55]" data-testid="button-save-employee">{pending ? t('Saving…', 'جارٍ الحفظ…') : isEditing ? t('Save changes', 'حفظ التغييرات') : t('Add employee', 'إضافة الموظف')}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function EmployeeRow({ employee, onEdit, onDelete }: { employee: Employee; onEdit: (employee: Employee) => void; onDelete: (employee: Employee) => void }) {
  const { t } = useT();
  const statusLabel = employee.status === 'active' ? t('active', 'نشط') : t('inactive', 'غير نشط');
  return <div className="group grid min-w-[900px] grid-cols-[2fr_.9fr_1fr_1.15fr_1fr_.7fr_88px] items-center border-b border-border/70 px-5 py-3 transition-colors hover:bg-secondary/40" data-testid={`row-employee-${employee.id}`}><div className="flex items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8e4f6] text-xs font-bold text-[#5a4a9c]">{employee.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><div><div className="text-sm font-semibold text-[#263765]">{employee.fullName}</div><div className="ar text-[10px] text-muted-foreground">{employee.fullNameArabic}</div></div></div><span className="font-mono text-xs text-muted-foreground" dir="ltr">{employee.employeeNumber}</span><div className="text-xs font-medium text-[#385268]">{employee.jobTitle}</div><span className="font-mono text-xs text-muted-foreground" dir="ltr">{employee.nationalId}</span><span className="text-xs text-muted-foreground" dir="ltr">{employee.phone}</span><span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${employee.status === 'active' ? 'bg-[#dff2eb] text-[#277461]' : 'bg-muted text-muted-foreground'}`}>{statusLabel}</span><div className="flex justify-end gap-1 opacity-40 transition-opacity group-hover:opacity-100"><button onClick={() => onEdit(employee)} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-primary" data-testid={`button-edit-employee-${employee.id}`} aria-label={`Edit ${employee.fullName}`}><Pencil size={14} /></button><button onClick={() => onDelete(employee)} className="rounded-md p-2 text-muted-foreground hover:bg-[#fff0ee] hover:text-destructive" data-testid={`button-delete-employee-${employee.id}`} aria-label={`Delete ${employee.fullName}`}><Trash2 size={14} /></button></div></div>;
}

function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | undefined>();
  const [toast, setToast] = useState('');
  const { t } = useT();
  const query = useGetEmployees({ search: search || undefined }, { query: { queryKey: getGetEmployeesQueryKey({ search: search || undefined }) } });
  const deletion = useDeleteEmployee();
  const queryClient = useQueryClient();
  const employees = query.data ?? [];
  const openNew = () => { setEditing(undefined); setDialogOpen(true); };
  const edit = (employee: Employee) => { setEditing(employee); setDialogOpen(true); };
  const remove = (employee: Employee) => { if (!window.confirm(t(`Delete ${employee.fullName} from the staff directory?`, `هل تريد حذف ${employee.fullName} من سجل الموظفين؟`))) return; deletion.mutate({ id: employee.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetEmployeesQueryKey() }); setToast(t('Employee record deleted', 'تم حذف سجل الموظف')); } }); };
  return <div className="rise-in" dir={t('ltr', 'rtl')}><PageHeading eyebrow="Employees · 02" eyebrowAr="الموظفون · ٠٢" title="Employees" arabic="الموظفون" description={t('The staff behind the school day — administration, operations and support.', 'الفريق خلف اليوم الدراسي — الإدارة والتشغيل والدعم.')} action={<Button onClick={openNew} className="h-11 rounded-lg bg-[#263765] px-5 hover:bg-[#1c2b55]" data-testid="button-add-employee"><Plus size={17} /> {t('Add employee', 'إضافة موظف')}</Button>} />
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row"><div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:max-w-md"><Search size={16} className="text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('Search by name or job title', 'ابحث بالاسم أو المسمى الوظيفي')} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" data-testid="input-search-employees" /></div><button onClick={() => query.refetch()} className="h-fit rounded-lg border border-border bg-card px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary" data-testid="button-refresh-employees" aria-label={t('Refresh employees', 'تحديث الموظفين')}><RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} /></button></div>
    {toast && <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#c8e5dc] bg-[#effaf5] px-4 py-3 text-sm text-[#277461] rise-in" data-testid="status-employee-action"><Check size={16} />{toast}<button className="ml-auto text-[#277461]/60 hover:text-[#277461]" onClick={() => setToast('')} data-testid="button-dismiss-employee-toast"><X size={14} /></button></div>}
    {query.isLoading ? <LoadingCards count={3} /> : query.isError ? <ErrorState label="employees" labelAr="الموظفون" onRetry={() => query.refetch()} /> : !employees.length ? <EmptyState icon={Briefcase} title={search ? t('No employees match this view', 'لا يوجد موظفون يطابقون هذا البحث') : t('The staff directory is quiet', 'سجل الموظفين فارغ')} detail={search ? t('Try another search term or clear the filters.', 'جرّب مصطلح بحث آخر أو امسح عوامل التصفية.') : t('When employee records are added, they will live here with their roles and contact details.', 'عند إضافة سجلات الموظفين، ستظهر هنا مع وظائفهم وبيانات التواصل.')} action={!search ? <Button onClick={openNew} data-testid="button-empty-add-employee"><Plus size={15} /> {t('Add employee', 'إضافة موظف')}</Button> : undefined} /> : <div className="overflow-x-auto rounded-xl border border-border bg-card soft-shadow"><div className="grid min-w-[900px] grid-cols-[2fr_.9fr_1fr_1.15fr_1fr_.7fr_88px] border-b border-border bg-[#f5f9fa] px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground"><span>{t('Employee', 'الموظف')}</span><span>{t('Employee No', 'الرقم الوظيفي')}</span><span>{t('Job title', 'المسمى الوظيفي')}</span><span>{t('National ID', 'الهوية الوطنية')}</span><span>{t('Phone', 'الهاتف')}</span><span>{t('Status', 'الحالة')}</span><span /></div>{employees.map((employee) => <EmployeeRow key={employee.id} employee={employee} onEdit={edit} onDelete={remove} />)}</div>}
    <EmployeeDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} onSaved={setToast} />
  </div>;
}

function TeachersPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | undefined>();
  const [toast, setToast] = useState('');
  const { t } = useT();
  const query = useGetTeachers({ search: search || undefined }, { query: { queryKey: getGetTeachersQueryKey({ search: search || undefined }) } });
  const deletion = useDeleteTeacher();
  const queryClient = useQueryClient();
  const teachers = query.data ?? [];
  const openNew = () => { setEditing(undefined); setDialogOpen(true); };
  const edit = (teacher: Teacher) => { setEditing(teacher); setDialogOpen(true); };
  const remove = (teacher: Teacher) => { if (!window.confirm(t(`Delete ${teacher.fullName} from the faculty directory?`, `هل تريد حذف ${teacher.fullName} من دليل هيئة التدريس؟`))) return; deletion.mutate({ id: teacher.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetTeachersQueryKey() }); setToast(t('Teacher record deleted', 'تم حذف سجل المعلم')); } }); };
  return <div className="rise-in" dir={t('ltr', 'rtl')}><PageHeading eyebrow="Employees · 02 · Teachers" eyebrowAr="الموظفون · ٠٢ · المعلمون" title="Teachers" arabic="المعلمون" description={t('The faculty directory, arranged for quick context before the next conversation.', 'دليل هيئة التدريس، مرتبة لسياق سريع قبل المحادثة القادمة.')} action={<Button onClick={openNew} className="h-11 rounded-lg bg-[#263765] px-5 hover:bg-[#1c2b55]" data-testid="button-add-teacher"><Plus size={17} /> {t('Add teacher', 'إضافة معلم')}</Button>} />
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row"><div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:max-w-md"><Search size={16} className="text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('Search by name or subject', 'ابحث بالاسم أو المادة')} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" data-testid="input-search-teachers" /></div><button onClick={() => query.refetch()} className="h-fit rounded-lg border border-border bg-card px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary" data-testid="button-refresh-teachers" aria-label={t('Refresh teachers', 'تحديث المعلمين')}><RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} /></button></div>
    {toast && <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#c8e5dc] bg-[#effaf5] px-4 py-3 text-sm text-[#277461] rise-in" data-testid="status-teacher-action"><Check size={16} />{toast}<button className="ml-auto text-[#277461]/60 hover:text-[#277461]" onClick={() => setToast('')} data-testid="button-dismiss-teacher-toast"><X size={14} /></button></div>}
    {query.isLoading ? <LoadingCards count={3} /> : query.isError ? <ErrorState label="teachers" labelAr="المعلمون" onRetry={() => query.refetch()} /> : !teachers.length ? <EmptyState icon={UsersRound} title={search ? t('No teachers match this view', 'لا يوجد معلمون يطابقون هذا البحث') : t('The faculty directory is quiet', 'دليل هيئة التدريس فارغ')} detail={search ? t('Try another search term or clear the filters.', 'جرّب مصطلح بحث آخر أو امسح عوامل التصفية.') : t('When teacher records are added, they will live here with their subjects and contact details.', 'عند إضافة سجلات المعلمين، ستظهر هنا مع موادهم وبيانات التواصل.')} action={!search ? <Button onClick={openNew} data-testid="button-empty-add-teacher"><Plus size={15} /> {t('Add teacher', 'إضافة معلم')}</Button> : undefined} /> : <div className="overflow-x-auto rounded-xl border border-border bg-card soft-shadow"><div className="grid min-w-[900px] grid-cols-[2fr_.9fr_1fr_1.15fr_1fr_.7fr_88px] border-b border-border bg-[#f5f9fa] px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground"><span>{t('Teacher', 'المعلم')}</span><span>{t('Employee No', 'الرقم الوظيفي')}</span><span>{t('Subject', 'المادة')}</span><span>{t('National ID', 'الهوية الوطنية')}</span><span>{t('Phone', 'الهاتف')}</span><span>{t('Status', 'الحالة')}</span><span /></div>{teachers.map((teacher) => <TeacherRow key={teacher.id} teacher={teacher} onEdit={edit} onDelete={remove} />)}</div>}
    <TeacherDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} onSaved={setToast} />
  </div>;
}

function BookDialog({ open, onOpenChange, editing, onSaved, presetBarcode }: { open: boolean; onOpenChange: (open: boolean) => void; editing?: Book; onSaved: (message: string) => void; presetBarcode?: string }) {
  const blank: BookInput = { title: '', author: '', isbn: '', category: '', copies: 1, language: 'English', shelf: '' };
  const [form, setForm] = useState<BookInput>(blank);
  useEffect(() => {
    if (open) setForm(editing ? { ...editing } : { ...blank, isbn: presetBarcode ?? blank.isbn });
  }, [open, editing, presetBarcode]);
  const create = useCreateBook();
  const update = useUpdateBook();
  const queryClient = useQueryClient();
  const isEditing = Boolean(editing);
  const set = (key: keyof BookInput, value: string | number) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.title || !form.author || !form.category || form.copies < 0) return;
    const done = () => { queryClient.invalidateQueries({ queryKey: getGetBooksQueryKey() }); onOpenChange(false); onSaved(isEditing ? 'Book record updated' : 'Book added to the library'); };
    if (isEditing && editing) update.mutate({ id: editing.id, data: form }, { onSuccess: done });
    else create.mutate({ data: form }, { onSuccess: done });
  };
  const pending = create.isPending || update.isPending;
  const saveError = create.isError || update.isError;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-xl border-border bg-[#f8fbfc] p-0"><form onSubmit={submit}><DialogHeader className="border-b border-border bg-card px-6 py-5 text-left"><div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">Library catalogue</div><DialogTitle className="mt-1 text-2xl text-[#263765]">{isEditing ? 'Update book' : 'Add a book'}</DialogTitle><DialogDescription className="mt-1">{isEditing ? 'Keep this record in step with the shelves.' : 'Give the library a useful new reference.'}</DialogDescription></DialogHeader><div className="grid gap-4 px-6 py-6 sm:grid-cols-2">{[['title', 'Title', 'عنوان الكتاب'], ['author', 'Author', 'المؤلف'], ['isbn', 'Barcode', 'الباركود'], ['category', 'Category', 'التصنيف'], ['shelf', 'Shelf', 'الرف']].map(([key, label, arabic]) => <label key={key} className="block"><span className="mb-1.5 flex justify-between text-xs font-semibold text-[#385268]"><span>{label}</span><span className="ar text-[9px] font-normal text-muted-foreground">{arabic}</span></span><input required={key !== 'isbn' && key !== 'shelf'} value={String(form[key as keyof BookInput] ?? '')} onChange={(event) => set(key as keyof BookInput, event.target.value)} placeholder={key === 'isbn' ? 'Scan or type the barcode' : undefined} className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" data-testid={`input-book-${key}`} /></label>)}<label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#385268]">Copies</span><input type="number" min="0" required value={form.copies} onChange={(event) => set('copies', Number(event.target.value))} className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary" data-testid="input-book-copies" /></label><label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#385268]">Language</span><select value={form.language} onChange={(event) => set('language', event.target.value)} className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary" data-testid="select-book-language"><option value="English">English</option><option value="Arabic">Arabic</option><option value="French">French</option></select></label></div>{saveError && <div className="mx-6 mb-4 rounded-lg border border-destructive/30 bg-[#fff0ee] px-4 py-3 text-sm text-destructive" data-testid="error-book-dialog">Could not save this book. Please check the details and try again.</div>}<DialogFooter className="border-t border-border bg-card px-6 py-4"><Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-book">Cancel</Button><Button type="submit" disabled={pending} className="bg-[#263765] hover:bg-[#1c2b55]" data-testid="button-save-book">{pending ? 'Saving…' : isEditing ? 'Save changes' : 'Add book'}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function LibraryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Book | undefined>();
  const [toast, setToast] = useState('');
  const [scan, setScan] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState<{ status: 'found'; book: Book } | { status: 'missing'; code: string } | undefined>();
  const [presetBarcode, setPresetBarcode] = useState<string | undefined>();
  const { t } = useT();
  const query = useGetBooks({ search: search || undefined, category: category || undefined }, { query: { queryKey: getGetBooksQueryKey({ search: search || undefined, category: category || undefined }) } });
  const deletion = useDeleteBook();
  const queryClient = useQueryClient();
  const books = query.data ?? [];
  const categories = useMemo(() => Array.from(new Set(books.map((book) => book.category).filter(Boolean))), [books]);
  const openNew = () => { setPresetBarcode(undefined); setEditing(undefined); setDialogOpen(true); };
  const edit = (book: Book) => { setEditing(book); setDialogOpen(true); };
  const remove = (book: Book) => { if (!window.confirm(t(`Delete “${book.title}” from the catalogue?`, `هل تريد حذف "${book.title}" من الفهرس؟`))) return; deletion.mutate({ id: book.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetBooksQueryKey() }); setScanned(undefined); setToast(t('Book removed from the catalogue', 'تم حذف الكتاب من الفهرس')); } }); };
  const scannedBook = scanned?.status === 'found' ? scanned.book : undefined;
  const handleScan = async (event: FormEvent) => {
    event.preventDefault();
    const code = scan.trim();
    if (!code || scanning) return;
    setScanning(true);
    try {
      const results = await getBooks({ search: code });
      const match = results.find((book) => (book.isbn || '').trim() === code);
      if (match) setScanned({ status: 'found', book: match });
      else setScanned({ status: 'missing', code });
    } catch {
      setScanned({ status: 'missing', code });
    } finally {
      setScanning(false);
      setScan('');
    }
  };
  return <div className="rise-in" dir={t('ltr', 'rtl')}><PageHeading eyebrow="Resources · 04" eyebrowAr="المصادر · ٠٤" title="Library" arabic="المكتبة" description={t('A living catalogue for the stories, references and discoveries on every shelf.', 'فهرس حيّ للقصص والمراجع والاكتشافات على كل رف.')} action={<Button onClick={openNew} className="h-11 rounded-lg bg-[#263765] px-5 hover:bg-[#1c2b55]" data-testid="button-add-book"><Plus size={17} /> {t('Add book', 'إضافة كتاب')}</Button>} />
    <form onSubmit={handleScan} className="mb-5 flex flex-col gap-2 rounded-xl border border-[#efd18a66] bg-gradient-to-l from-[#fffaf0] to-[#fdf6e7] p-4 sm:flex-row sm:items-center" data-testid="form-scan-barcode"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#263765] text-[#efd18a]"><Barcode size={22} /></div><div className="min-w-0 flex-1"><div className="text-xs font-bold uppercase tracking-[.14em] text-[#a27526]">{t('Scanner station', 'محطة الماسح الضوئي')}</div><input autoFocus value={scan} onChange={(event) => setScan(event.target.value)} placeholder={t('Scan a book barcode, then press Enter…', 'امسح باركود الكتاب ثم اضغط Enter…')} className="mt-1 h-10 w-full rounded-lg border border-input bg-card px-3 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" data-testid="input-scan-barcode" /></div>{scanning && <span className="text-xs text-muted-foreground">{t('Looking up…', 'جارٍ البحث…')}</span>}</form>
    {scanned && (scanned.status === 'found' ? <div className="mb-5 flex flex-col gap-4 rounded-xl border border-[#c8e5dc] bg-[#f4fbf8] p-4 sm:flex-row sm:items-center rise-in" data-testid={`panel-scanned-book-${scanned.book.id}`}><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#fff1d1] text-[#a27526]"><BookOpen size={22} strokeWidth={1.7} /></div><div className="min-w-0 flex-1"><div className="line-clamp-1 text-sm font-bold text-[#263765]">{scanned.book.title}</div><div className="mt-0.5 text-xs text-muted-foreground">{scanned.book.author} · {t('Shelf', 'الرف')} {scanned.book.shelf || '—'} · <span className="font-mono">{(scanned.book.availableCopies ?? scanned.book.copies)}/{scanned.book.copies}</span> {t('available', 'متاح')} · <span className="font-mono" dir="ltr">{scanned.book.isbn}</span></div></div><div className="flex shrink-0 gap-2"><Button onClick={() => { if (scannedBook) edit(scannedBook); }} className="h-9 bg-[#263765] px-3 text-xs hover:bg-[#1c2b55]" data-testid="button-scanned-edit"><Pencil size={14} /> {t('Edit record', 'تعديل السجل')}</Button><Button variant="outline" onClick={() => { if (scannedBook) remove(scannedBook); }} className="h-9 border-destructive/30 px-3 text-xs text-destructive hover:bg-[#fff0ee]" data-testid="button-scanned-delete"><Trash2 size={14} /> {t('Remove', 'حذف')}</Button><button onClick={() => setScanned(undefined)} className="rounded-md p-2 text-muted-foreground hover:text-primary" data-testid="button-scanned-dismiss" aria-label={t('Dismiss', 'إغلاق')}><X size={16} /></button></div></div> : <div className="mb-5 flex flex-col gap-3 rounded-xl border border-destructive/25 bg-[#fff6f4] p-4 sm:flex-row sm:items-center rise-in" data-testid="panel-scanned-missing"><AlertTriangle size={20} className="shrink-0 text-destructive" /><div className="min-w-0 flex-1 text-sm text-[#8a3b2e]">{t('No book carries this barcode yet.', 'لا يوجد كتاب يحمل هذا الباركود بعد.')} <span className="font-mono" dir="ltr">{scanned.status === 'missing' ? scanned.code : ''}</span></div><Button onClick={() => { setPresetBarcode(scanned.status === 'missing' ? scanned.code : undefined); setEditing(undefined); setDialogOpen(true); }} className="h-9 shrink-0 bg-[#263765] px-3 text-xs hover:bg-[#1c2b55]" data-testid="button-scan-add-new"><Plus size={14} /> {t('Catalogue it now', 'أضفه للفهرس الآن')}</Button><button onClick={() => setScanned(undefined)} className="rounded-md p-2 text-muted-foreground hover:text-primary" data-testid="button-scanned-dismiss-missing" aria-label={t('Dismiss', 'إغلاق')}><X size={16} /></button></div>)}
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row"><div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:max-w-md"><Search size={16} className="text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('Search title, author or barcode', 'ابحث بالعنوان أو المؤلف أو الباركود')} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" data-testid="input-search-books" /></div><div className="flex gap-2"><div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3"><SlidersHorizontal size={14} className="text-muted-foreground" /><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 bg-transparent text-xs font-medium outline-none" data-testid="select-book-category"><option value="">All categories</option>{categories.map((item) => <option value={item} key={item}>{item}</option>)}</select></div><button onClick={() => query.refetch()} className="h-fit rounded-lg border border-border bg-card px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary" data-testid="button-refresh-books" aria-label="Refresh books"><RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} /></button></div></div>
    {toast && <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#c8e5dc] bg-[#effaf5] px-4 py-3 text-sm text-[#277461]" data-testid="status-book-action"><Check size={16} />{toast}<button className="ml-auto" onClick={() => setToast('')} data-testid="button-dismiss-book-toast"><X size={14} /></button></div>}
    {query.isLoading ? <LoadingCards count={3} /> : query.isError ? <ErrorState label="library books" onRetry={() => query.refetch()} /> : !books.length ? <EmptyState icon={Library} title={search || category ? 'No books match this view' : 'The shelves are waiting'} detail={search || category ? 'Try another search term or clear the filters.' : 'Add the first title to give your library a useful beginning.'} action={!search && !category ? <Button onClick={openNew} data-testid="button-empty-add-book"><Plus size={15} /> Add first book</Button> : undefined} /> : <div className="overflow-x-auto rounded-xl border border-border bg-card soft-shadow"><div className="grid min-w-[920px] grid-cols-[2fr_1fr_.75fr_1.25fr_.65fr_1.1fr_88px] border-b border-border bg-[#f5f9fa] px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground"><span>Book</span><span>Author</span><span>Language</span><span>Copies</span><span>{t('Shelf', 'الرف')}</span><span>{t('Barcode', 'الباركود')}</span><span /></div>{books.map((book) => <BookRow key={book.id} book={book} onEdit={edit} onDelete={remove} />)}</div>}
    <BookDialog open={dialogOpen} onOpenChange={(value) => { if (!value) setPresetBarcode(undefined); setDialogOpen(value); }} editing={editing} onSaved={setToast} presetBarcode={presetBarcode} />
  </div>;
}

function BookRow({ book, onEdit, onDelete }: { book: Book; onEdit: (book: Book) => void; onDelete: (book: Book) => void }) {
  const available = book.availableCopies ?? book.copies;
  const percent = book.copies ? Math.round((available / book.copies) * 100) : 0;
  return <div className="group grid min-w-[920px] grid-cols-[2fr_1fr_.75fr_1.25fr_.65fr_1.1fr_88px] items-center border-b border-border/70 px-5 py-3 transition-colors hover:bg-secondary/40" data-testid={`row-book-${book.id}`}><div className="flex items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff1d1] text-[#a27526]"><BookOpen size={17} strokeWidth={1.7} /></div><div><div className="line-clamp-1 text-sm font-semibold text-[#263765]">{book.title}</div><div className="text-[10px] uppercase tracking-[.12em] text-muted-foreground">{book.category}</div></div></div><span className="text-xs text-muted-foreground">{book.author}</span><span className="w-fit rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-primary">{book.language}</span><div className="flex items-center gap-3"><div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${percent > 50 ? 'bg-primary' : percent ? 'bg-accent' : 'bg-destructive'}`} style={{ width: `${percent}%` }} /></div><span className="font-mono text-xs font-bold text-[#263765]">{available}/{book.copies}</span></div><span className="text-xs text-muted-foreground">{book.shelf ? `Shelf ${book.shelf}` : '—'}</span><span className="font-mono text-xs text-muted-foreground" dir="ltr">{book.isbn || '—'}</span><div className="flex justify-end gap-1 opacity-40 transition-opacity group-hover:opacity-100"><button onClick={() => onEdit(book)} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-primary" data-testid={`button-edit-book-${book.id}`} aria-label={`Edit ${book.title}`}><Pencil size={14} /></button><button onClick={() => onDelete(book)} className="rounded-md p-2 text-muted-foreground hover:bg-[#fff0ee] hover:text-destructive" data-testid={`button-delete-book-${book.id}`} aria-label={`Delete ${book.title}`}><Trash2 size={14} /></button></div></div>;
}

function DistributionPage() {
  const query = useGetStudents(undefined, { query: { queryKey: getGetStudentsQueryKey(undefined) } });
  const students = query.data ?? [];
  const groups = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const student of students) {
      const grade = student.grade || 'Unassigned';
      const klass = student.className || '—';
      if (!map.has(grade)) map.set(grade, new Map());
      map.get(grade)!.set(klass, (map.get(grade)!.get(klass) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
  }, [students]);
  const total = students.length;
  return <div className="rise-in"><PageHeading eyebrow="People · 03 · Distribution" title="Student distribution" arabic="توزيع الطلاب" description="How learners are spread across grades and classes this academic year." />
    {query.isLoading ? <LoadingCards /> : query.isError ? <ErrorState label="student distribution" onRetry={() => query.refetch()} /> : !total ? <EmptyState icon={GraduationCap} title="No students to distribute yet" detail="Add student records first, then their grade and class spread will appear here." action={<Link href="/students"><Button data-testid="button-empty-distribution"><Plus size={15} /> Add students first</Button></Link>} /> : <>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{groups.slice(0, 4).map(([grade, classes]) => <div key={grade} className="rounded-xl border border-border bg-card p-5 soft-shadow" data-testid={`card-distribution-${grade.toLowerCase().replaceAll(' ', '-')}`}><div className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">{grade}</div><div className="ar mt-0.5 text-[10px] text-muted-foreground/70">الصف</div><strong className="mt-3 block font-mono text-[26px] tracking-[-.05em] text-[#263765]">{Array.from(classes.values()).reduce((sum, count) => sum + count, 0)}</strong><div className="mt-2 text-[11px] text-muted-foreground">{classes.size} classes</div></div>)}</div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card soft-shadow"><div className="grid min-w-[640px] grid-cols-[1.5fr_1fr_1fr_1.6fr] border-b border-border bg-[#f5f9fa] px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground"><span>Grade</span><span>Class</span><span>Students</span><span>Share of school</span></div>{groups.flatMap(([grade, classes]) => Array.from(classes.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([klass, count]) => { const percent = total ? Math.round((count / total) * 100) : 0; return <div key={`${grade}-${klass}`} className="grid min-w-[640px] grid-cols-[1.5fr_1fr_1fr_1.6fr] items-center border-b border-border/70 px-5 py-3 transition-colors last:border-b-0 hover:bg-secondary/40" data-testid={`row-distribution-${grade.toLowerCase().replaceAll(' ', '-')}-${klass.toLowerCase()}`}><span className="text-sm font-semibold text-[#263765]">{grade}</span><span className="font-mono text-xs text-muted-foreground">{klass}</span><strong className="font-mono text-sm text-[#263765]">{count}</strong><div className="flex items-center gap-3"><div className="h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} /></div><span className="font-mono text-[11px] text-muted-foreground">{percent}%</span></div></div>; }))}<div className="grid min-w-[640px] grid-cols-[1.5fr_1fr_1fr_1.6fr] items-center bg-[#f5f9fa] px-5 py-3 text-xs font-bold uppercase tracking-[.12em] text-muted-foreground"><span>Total</span><span /></div></div>
    </>}
  </div>;
}

function CategoriesPage() {
  const query = useGetBooks(undefined, { query: { queryKey: getGetBooksQueryKey(undefined) } });
  const books = query.data ?? [];
  const groups = useMemo(() => {
    const map = new Map<string, Book[]>();
    for (const book of books) {
      const key = book.category || 'Uncategorised';
      map.set(key, [...(map.get(key) ?? []), book]);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [books]);
  return <div className="rise-in"><PageHeading eyebrow="Resources · 04 · Catalogue" title="Book categories" arabic="تصنيفات الكتب" description="Every shelf in the library, grouped by how the collection is organised." />
    {query.isLoading ? <LoadingCards count={3} /> : query.isError ? <ErrorState label="book categories" onRetry={() => query.refetch()} /> : !groups.length ? <EmptyState icon={Library} title="No categories yet" detail="Once books are added to the library, their categories will be summarised here." action={<Link href="/library"><Button data-testid="button-goto-books"><Plus size={15} /> Add your first book</Button></Link>} /> : <div className="overflow-x-auto rounded-xl border border-border bg-card soft-shadow">{groups.map(([category, group], index) => { const copies = group.reduce((sum, book) => sum + book.copies, 0); const available = group.reduce((sum, book) => sum + (book.availableCopies ?? book.copies), 0); return <div key={category} className={index ? 'border-t-2 border-border' : ''}><div className="flex flex-wrap items-center justify-between gap-3 bg-[#f5f9fa] px-5 py-3" data-testid={`row-category-${category.toLowerCase().replaceAll(' ', '-')}`}><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff1d1] text-[#a27526]"><BookOpen size={17} strokeWidth={1.8} /></div><div><div className="text-sm font-bold uppercase tracking-[.08em] text-[#263765]">{category}</div><div className="ar text-[10px] text-muted-foreground">التصنيف</div></div></div><div className="flex items-center gap-5 text-[11px] text-muted-foreground"><span><strong className="font-mono text-[#263765]">{group.length}</strong> titles</span><span><strong className="font-mono text-[#263765]">{copies}</strong> copies</span><span><strong className="font-mono text-[#277461]">{available}</strong> available</span></div></div>{group.map((book) => <div key={book.id} className="grid min-w-[720px] grid-cols-[2fr_1fr_.8fr_.8fr_1.1fr_88px] items-center border-t border-border/70 px-5 py-2.5 transition-colors hover:bg-secondary/40" data-testid={`row-category-book-${book.id}`}><div className="line-clamp-1 text-sm font-medium text-[#263765]">{book.title}</div><span className="text-xs text-muted-foreground">{book.author}</span><span className="text-xs text-muted-foreground">{book.language}</span><span className="text-xs text-muted-foreground">{book.shelf ? `Shelf ${book.shelf}` : '—'}</span><span className="font-mono text-xs text-muted-foreground" dir="ltr">{book.isbn || '—'}</span><span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${(book.availableCopies ?? book.copies) > 0 ? 'bg-[#dff2eb] text-[#277461]' : 'bg-[#fbe5df] text-[#c35d4d]'}`}>{(book.availableCopies ?? book.copies) > 0 ? 'on shelf' : 'all out'}</span></div>)}</div>; })}</div>}
  </div>;
}

function IndexPage() {
  const [search, setSearch] = useState('');
  const query = useGetBooks({ search: search || undefined }, { query: { queryKey: getGetBooksQueryKey({ search: search || undefined }) } });
  const books = useMemo(() => [...(query.data ?? [])].sort((a, b) => a.title.localeCompare(b.title)), [query.data]);
  return <div className="rise-in"><PageHeading eyebrow="Resources · 04 · Index" title="Library index" arabic="الفهرس" description="The complete catalogue in one alphabetical listing, ready for quick lookup." />
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row"><div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:max-w-md"><Search size={16} className="text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter the index by title or author" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" data-testid="input-search-index" /></div></div>
    {query.isLoading ? <LoadingCards count={3} /> : query.isError ? <ErrorState label="the library index" onRetry={() => query.refetch()} /> : !books.length ? <EmptyState icon={BookOpen} title={search ? 'Nothing in the index matches' : 'The index is empty'} detail={search ? 'Try another search term or clear the filters.' : 'Add books to build the master index of the library.'} action={!search ? <Link href="/library"><Button data-testid="button-empty-index-add"><Plus size={15} /> Add first book</Button></Link> : undefined} /> : <div className="overflow-x-auto rounded-xl border border-border bg-card soft-shadow"><div className="grid min-w-[880px] grid-cols-[2fr_1.2fr_1fr_.7fr_.7fr_1.1fr_.7fr] border-b border-border bg-[#f5f9fa] px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground"><span>Title</span><span>Author</span><span>Category</span><span>Language</span><span>Shelf</span><span>Barcode</span><span>Copies</span></div>{books.map((book) => <div key={book.id} className="grid min-w-[880px] grid-cols-[2fr_1.2fr_1fr_.7fr_.7fr_1.1fr_.7fr] items-center border-b border-border/70 px-5 py-2.5 transition-colors hover:bg-secondary/40" data-testid={`row-index-book-${book.id}`}><span className="line-clamp-1 text-sm font-medium text-[#263765]">{book.title}</span><span className="line-clamp-1 text-xs text-muted-foreground">{book.author}</span><span className="text-xs text-muted-foreground">{book.category}</span><span className="text-xs text-muted-foreground">{book.language}</span><span className="font-mono text-xs text-muted-foreground" dir="ltr">{book.shelf || '—'}</span><span className="font-mono text-xs text-muted-foreground" dir="ltr">{book.isbn || '—'}</span><span className="font-mono text-xs font-bold text-[#263765]">{book.availableCopies ?? book.copies}/{book.copies}</span></div>)}</div>}
  </div>;
}

function SettingsPage() {
  const query = useGetAcademicYears({ query: { queryKey: getGetAcademicYearsQueryKey() } });
  const years = query.data ?? [];
  const [selected, setSelected] = useState<number | undefined>();
  return <div className="rise-in"><PageHeading eyebrow="Administration · 05" title="Settings" arabic="الإعدادات" description="Keep the school workspace aligned with its current academic rhythm." /><div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]"><section className="rounded-xl border border-border bg-card p-6 soft-shadow"><div className="flex items-start justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">Academic years</div><h2 className="mt-1 text-xl font-bold tracking-[-.03em] text-[#263765]">Choose your school year</h2><p className="mt-2 text-sm text-muted-foreground">The selected year stays with this device and shapes your workspace context.</p></div><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary"><CalendarDays size={18} /></div></div>{query.isLoading ? <div className="mt-7 space-y-3">{[1, 2, 3].map((item) => <div className="skeleton h-16 rounded-lg" key={item} />)}</div> : query.isError ? <div className="mt-7"><ErrorState label="academic years" onRetry={() => query.refetch()} /></div> : !years.length ? <div className="mt-7"><EmptyState icon={CalendarDays} title="No academic years yet" detail="Academic years will appear once they are configured by the school office." /></div> : <div className="mt-7 space-y-3">{years.map((year) => { const active = year.isCurrent || selected === year.id; return <button key={year.id} onClick={() => setSelected(year.id)} className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${active ? 'border-primary bg-secondary/70' : 'border-border hover:border-primary/40 hover:bg-muted/50'}`} data-testid={`button-academic-year-${year.id}`}><div className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>{active ? <Check size={16} /> : <CalendarDays size={16} />}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="font-semibold text-[#263765]">{year.label}</span>{year.isCurrent && <span className="rounded-full bg-[#dff2eb] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#277461]">Current</span>}</div><div className="mt-1 text-xs text-muted-foreground">{formatDate(year.startDate)} — {formatDate(year.endDate)}</div></div><ChevronDown size={16} className="-rotate-90 text-muted-foreground" /></button>; })}</div>}</section><section className="rounded-xl bg-[#263765] p-7 text-white"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#efd18a] text-[#263765]"><SlidersHorizontal size={18} /></div><h2 className="mt-7 text-2xl font-bold leading-tight tracking-[-.04em]">Workspace preferences</h2><p className="mt-3 text-sm leading-6 text-[#b9cbd4]">A few quiet choices keep the command center feeling like yours.</p><div className="mt-8 space-y-4 border-t border-white/10 pt-5"><div className="flex items-center justify-between"><span className="text-sm">Interface language</span><span className="ar text-xs text-[#b9cbd4]">ثنائي اللغة</span></div><div className="flex items-center justify-between"><span className="text-sm">Date format</span><span className="font-mono text-[11px] text-[#efd18a]">MMM DD, YYYY</span></div><div className="flex items-center justify-between"><span className="text-sm">Product edition</span><span className="text-[11px] text-[#b9cbd4]">Staff workspace</span></div></div></section></div></div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Shell><Switch><Route path="/" component={Dashboard} /><Route path="/students" component={StudentsPage} /><Route path="/students/distribution" component={DistributionPage} /><Route path="/teachers" component={TeachersPage} /><Route path="/employees" component={EmployeesPage} /><Route path="/library" component={LibraryPage} /><Route path="/library/categories" component={CategoriesPage} /><Route path="/library/index" component={IndexPage} /><Route path="/settings" component={SettingsPage} /><Route component={NotFound} /></Switch></Shell></ErrorBoundary>;
}

function App() {
  return <LanguageProvider><QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider></LanguageProvider>;
}

export default App;