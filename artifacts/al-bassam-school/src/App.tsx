import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  Activity, AlertTriangle, ArrowUpRight, Bell, BookOpen, CalendarDays, Check,
  ChevronDown, CircleCheck, Clock3, Filter, GraduationCap, Languages, LayoutDashboard,
  Library, Menu, MoreHorizontal, Pencil, Phone, Plus, RefreshCw, Search, Settings2,
  SlidersHorizontal, Sparkles, Trash2, UsersRound, X,
} from 'lucide-react';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import {
  type AcademicYear, type Book, type BookInput, type DashboardSummary, type Student,
  type StudentInput,
  getGetAcademicYearsQueryKey, getGetBooksQueryKey, getGetDashboardSummaryQueryKey,
  getGetStudentsQueryKey, getGetTeachersQueryKey, useCreateBook, useCreateStudent,
  useDeleteStudent, useGetAcademicYears, useGetBooks, useGetDashboardSummary, useGetStudents,
  useGetTeachers, useUpdateStudent,
} from '@workspace/api-client-react';
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

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" data-testid="brand-logo">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#efd18a] bg-[#263765] text-[#f2d28c] shadow-[0_0_0_4px_rgba(239,209,138,.12)]">
        <span className="font-serif text-3xl leading-none">B</span>
        <span className="absolute -right-1 top-1 h-2.5 w-2.5 rounded-full bg-[#46bfd0]" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-[13px] font-bold tracking-[.16em] text-white">AL-BASSAM</div>
          <div className="ar text-[10px] text-[#a7c3cf]">مدارس البسام</div>
        </div>
      )}
    </div>
  );
}

const navItems = [
  { href: '/', label: 'Overview', arabic: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/students', label: 'Students', arabic: 'الطلاب', icon: GraduationCap },
  { href: '/teachers', label: 'Teachers', arabic: 'المعلمون', icon: UsersRound },
  { href: '/library', label: 'Library', arabic: 'المكتبة', icon: Library },
];

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
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

  return (
    <div className="app-noise min-h-[100dvh] bg-background text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`} data-testid="sidebar-navigation">
        <div className="flex h-[88px] items-center border-b border-sidebar-border px-7">
          <LogoMark />
          <button onClick={() => setMobileOpen(false)} className="ml-auto rounded-md p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-white md:hidden" data-testid="button-close-mobile-menu" aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-sidebar-foreground/45">Workspace</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = location === item.href || (item.href !== '/' && location.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-lg px-3 py-3 transition-all hover:bg-sidebar-accent ${active ? 'nav-active bg-sidebar-accent text-white' : 'text-sidebar-foreground/65'}`} data-testid={`link-nav-${item.label.toLowerCase()}`}>
                  <Icon size={18} strokeWidth={active ? 2.2 : 1.8} className={active ? 'text-[#61c8d6]' : 'group-hover:text-[#61c8d6]'} />
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  <span className={`ar text-[10px] ${active ? 'text-[#a7dfe4]' : 'text-sidebar-foreground/35'}`}>{item.arabic}</span>
                </Link>
              );
            })}
          </nav>
          <p className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-sidebar-foreground/45">Administration</p>
          <Link href="/settings" onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-lg px-3 py-3 transition-all hover:bg-sidebar-accent ${location === '/settings' ? 'nav-active bg-sidebar-accent text-white' : 'text-sidebar-foreground/65'}`} data-testid="link-nav-settings">
            <Settings2 size={18} className={location === '/settings' ? 'text-[#61c8d6]' : 'group-hover:text-[#61c8d6]'} />
            <span className="flex-1 text-sm font-medium">Settings</span>
            <span className="ar text-[10px] text-sidebar-foreground/35">الإعدادات</span>
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
      <main className="min-h-[100dvh] md:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden" data-testid="button-open-mobile-menu" aria-label="Open navigation menu"><Menu size={21} /></button>
            <div className="hidden text-xs text-muted-foreground sm:block"><span className="font-medium text-foreground">Al-Bassam School</span><span className="mx-2 text-border">/</span><span>{navItems.find((item) => item.href === location)?.label ?? (location === '/settings' ? 'Settings' : 'Workspace')}</span></div>
            <span className="ar hidden text-[11px] text-muted-foreground sm:block">البسام</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground md:flex"><Search size={14} /><span>Search workspace</span><kbd className="ml-4 rounded border border-border px-1.5 py-0.5 font-mono text-[9px]">⌘ K</kbd></div>
            <button className="relative rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-card hover:text-primary" data-testid="button-notifications" aria-label="View notifications"><Bell size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#efd18a]" /></button>
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
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function PageHeading({ eyebrow, title, arabic, description, action }: { eyebrow: string; title: string; arabic: string; description: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-primary"><span className="h-1.5 w-1.5 rounded-full bg-accent" />{eyebrow}</div><div className="flex flex-wrap items-baseline gap-3"><h1 className="text-3xl font-bold tracking-[-.04em] text-[#263765] sm:text-[40px]">{title}</h1><span className="ar text-sm text-muted-foreground">{arabic}</span></div><p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p></div>{action}</div>;
}

function LoadingCards({ count = 4 }: { count?: number }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: count }).map((_, index) => <div className="h-[126px] rounded-xl border border-border bg-card p-5" key={index}><div className="skeleton mb-4 h-3 w-20 rounded" /><div className="skeleton h-8 w-28 rounded" /><div className="skeleton mt-3 h-2 w-16 rounded" /></div>)}</div>;
}

function ErrorState({ label, onRetry }: { label: string; onRetry: () => void }) {
  return <div className="flex flex-col items-center justify-center rounded-xl border border-[#efd7d3] bg-[#fff8f6] px-6 py-16 text-center"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#fbe5df] text-[#c35d4d]"><AlertTriangle size={19} /></div><h3 className="font-semibold text-[#7e3f38]">Could not load {label}</h3><p className="mt-1 text-sm text-[#a56b63]">The workspace will try again when you ask it to.</p><Button variant="outline" size="sm" onClick={onRetry} className="mt-5 border-[#e5c2bc] bg-transparent text-[#a24f45]" data-testid={`button-retry-${label.toLowerCase().replaceAll(' ', '-')}`}><RefreshCw size={14} /> Try again</Button></div>;
}

function EmptyState({ icon: Icon, title, detail, action }: { icon: typeof BookOpen; title: string; detail: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary"><Icon size={25} strokeWidth={1.6} /></div><h3 className="font-semibold text-[#263765]">{title}</h3><p className="mt-2 max-w-sm text-sm text-muted-foreground">{detail}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

function StatCard({ label, arabic, value, icon: Icon, tone, note }: { label: string; arabic: string; value: string | number; icon: typeof UsersRound; tone: 'navy' | 'teal' | 'gold' | 'sky'; note: string }) {
  const tones = { navy: 'bg-[#263765] text-white', teal: 'bg-[#d9f0ed] text-[#176d70]', gold: 'bg-[#fff3d9] text-[#946d23]', sky: 'bg-[#dff2f5] text-[#19768a]' };
  return <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 soft-shadow transition-transform duration-300 hover:-translate-y-1" data-testid={`card-stat-${label.toLowerCase()}`}><div className={`mb-5 flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}><Icon size={18} /></div><div className="flex items-end justify-between gap-2"><div><div className="text-[11px] font-semibold uppercase tracking-[.13em] text-muted-foreground">{label}</div><div className="ar mt-0.5 text-[10px] text-muted-foreground/70">{arabic}</div></div><strong className="font-mono text-[29px] tracking-[-.06em] text-[#263765]">{value}</strong></div><div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{note}</div><div className="absolute -right-7 -top-7 h-24 w-24 rounded-full border-[12px] border-primary/5 transition-transform duration-500 group-hover:scale-125" /></div>;
}

function Dashboard() {
  const [, setLocation] = useLocation();
  const summaryQuery = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const summary = summaryQuery.data ?? fallbackSummary;
  const activity = summary.recentActivity ?? [];
  const activityIcon = (type: string) => type === 'library' ? <Library size={15} /> : type === 'teacher' ? <UsersRound size={15} /> : type === 'student' ? <GraduationCap size={15} /> : <Activity size={15} />;
  return <div className="rise-in">
    <PageHeading eyebrow="School pulse · 01" title="Good morning, admin." arabic="صباح الخير" description="A composed view of the people, places and pages moving through Al-Bassam today." action={<Button onClick={() => setLocation('/students')} className="h-11 rounded-lg bg-[#263765] px-5 text-sm hover:bg-[#1c2b55]" data-testid="button-open-students"><ArrowUpRight size={16} /> Open student records</Button>} />
    {summaryQuery.isLoading ? <LoadingCards /> : summaryQuery.isError ? <ErrorState label="dashboard data" onRetry={() => summaryQuery.refetch()} /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Students" arabic="الطلاب" value={summary.students.toLocaleString()} icon={GraduationCap} tone="navy" note="Active enrolment" /><StatCard label="Teachers" arabic="المعلمون" value={summary.teachers.toLocaleString()} icon={UsersRound} tone="teal" note="Faculty directory" /><StatCard label="Library books" arabic="كتب المكتبة" value={summary.books.toLocaleString()} icon={BookOpen} tone="gold" note="Titles in catalogue" /><StatCard label="Attendance" arabic="الحضور" value={`${summary.attendanceRate}%`} icon={CircleCheck} tone="sky" note="This academic year" /></div>}
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
      <section className="rounded-xl border border-border bg-card p-6 soft-shadow"><div className="mb-6 flex items-start justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">Recent activity</div><h2 className="mt-1 text-xl font-bold tracking-[-.03em] text-[#263765]">The school, in motion</h2></div><button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary" data-testid="button-activity-options" aria-label="Activity options"><MoreHorizontal size={18} /></button></div>{summaryQuery.isLoading ? <div className="space-y-5">{[1, 2, 3, 4].map((item) => <div className="flex gap-4" key={item}><div className="skeleton h-9 w-9 rounded-lg" /><div className="flex-1"><div className="skeleton h-3 w-3/5 rounded" /><div className="skeleton mt-2 h-2 w-2/5 rounded" /></div></div>)}</div> : activity.length ? <div className="space-y-1">{activity.slice(0, 6).map((item) => <div className="group flex items-center gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-secondary/60" key={item.id} data-testid={`activity-item-${item.id}`}><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">{activityIcon(item.type)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-[#263765]">{item.title}</p><p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground"><Clock3 size={11} />{formatDate(item.timestamp)}</p></div><ArrowUpRight size={14} className="text-border transition-colors group-hover:text-primary" /></div>)}</div> : <div className="py-10 text-center text-sm text-muted-foreground">Your activity stream will appear here.</div>}</section>
      <section className="relative overflow-hidden rounded-xl bg-[#19768a] p-7 text-white"><div className="relative z-10"><div className="mb-10 flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-[#efd18a]"><Sparkles size={18} /></div><div className="text-[10px] font-bold uppercase tracking-[.2em] text-[#b4e0e2]">A note from the office</div><h2 className="mt-3 max-w-xs text-2xl font-bold leading-tight tracking-[-.04em]">Small records build a remarkable school.</h2><p className="mt-3 max-w-xs text-sm leading-6 text-[#d2edef]">Keep today’s details close. The right information, at the right moment, makes room for better teaching.</p></div><div className="absolute -bottom-14 -right-12 h-48 w-48 rounded-full border-[22px] border-white/10" /><div className="absolute -right-5 top-10 h-24 w-24 rounded-full border border-[#efd18a]/50" /></section>
    </div>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d9e8ea] bg-[#f2faf9] px-5 py-4 text-sm"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d4efeb] text-[#176d70]"><Languages size={15} /></div><span className="font-medium text-[#28545c]">Workspace is ready in English and Arabic</span></div><span className="ar text-xs text-[#538188]">مساحة العمل جاهزة بالعربية والإنجليزية</span></div>
  </div>;
}

type StudentFormValue = StudentInput & { id?: number };
const blankStudent: StudentFormValue = { fullName: '', fullNameArabic: '', studentNumber: '', nationalId: '', grade: '', className: '', guardianName: '', guardianPhone: '', enrollmentDate: new Date().toISOString().slice(0, 10) };

function StudentDialog({ open, onOpenChange, editing, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; editing?: Student; onSaved: (message: string) => void }) {
  const [form, setForm] = useState<StudentFormValue>(editing ? { ...editing } : blankStudent);
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
  const fields: { key: keyof StudentFormValue; label: string; arabic: string; placeholder: string }[] = [
    { key: 'fullName', label: 'Full name', arabic: 'الاسم الكامل', placeholder: 'e.g. Sara Al-Harbi' },
    { key: 'fullNameArabic', label: 'Arabic name', arabic: 'الاسم بالعربية', placeholder: 'مثال: سارة الحربي' },
    { key: 'studentNumber', label: 'Student number', arabic: 'رقم الطالب', placeholder: 'AB-2024-014' },
    { key: 'nationalId', label: 'National ID', arabic: 'الهوية الوطنية', placeholder: '10xxxxxxxx' },
    { key: 'grade', label: 'Grade', arabic: 'الصف', placeholder: 'Grade 8' },
    { key: 'className', label: 'Class', arabic: 'الفصل', placeholder: '8A' },
    { key: 'guardianName', label: 'Guardian name', arabic: 'اسم ولي الأمر', placeholder: 'Guardian full name' },
    { key: 'guardianPhone', label: 'Guardian phone', arabic: 'هاتف ولي الأمر', placeholder: '+966 5x xxx xxxx' },
  ];
  return <Dialog open={open} onOpenChange={(value) => { if (!value) setForm(editing ? { ...editing } : blankStudent); onOpenChange(value); }}><DialogContent className="max-w-2xl border-border bg-[#f8fbfc] p-0"><form onSubmit={submit}><DialogHeader className="border-b border-border bg-card px-6 py-5 text-left"><div className="flex items-start justify-between pr-8"><div><div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">{isEditing ? 'Edit record' : 'New enrolment'}</div><DialogTitle className="mt-1 text-2xl text-[#263765]">{isEditing ? 'Update student' : 'Add a student'}</DialogTitle><DialogDescription className="mt-1">Keep the directory details accurate and easy to find.</DialogDescription></div><span className="ar text-xs text-muted-foreground">{isEditing ? 'تعديل السجل' : 'تسجيل طالب جديد'}</span></div></DialogHeader><div className="grid gap-4 px-6 py-6 sm:grid-cols-2">{fields.map((field) => <label className="block" key={field.key}><span className="mb-1.5 flex items-baseline justify-between text-xs font-semibold text-[#385268]"><span>{field.label}</span><span className="ar text-[9px] font-normal text-muted-foreground">{field.arabic}</span></span><input required={!['guardianName', 'guardianPhone'].includes(field.key)} value={String(form[field.key] ?? '')} onChange={(event) => set(field.key, event.target.value)} placeholder={field.placeholder} className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/10" data-testid={`input-student-${field.key}`} /></label>)}<label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#385268]">Enrollment date</span><input type="date" required value={form.enrollmentDate} onChange={(event) => set('enrollmentDate', event.target.value)} className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary" data-testid="input-student-enrollment-date" /></label></div><DialogFooter className="border-t border-border bg-card px-6 py-4"><Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-student">Cancel</Button><Button type="submit" disabled={pending} className="bg-[#263765] hover:bg-[#1c2b55]" data-testid="button-save-student">{pending ? 'Saving…' : <><Check size={15} /> {isEditing ? 'Save changes' : 'Add student'}</>}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function StudentRow({ student, onEdit, onDelete }: { student: Student; onEdit: (student: Student) => void; onDelete: (student: Student) => void }) {
  return <div className="group grid min-w-[760px] grid-cols-[2.2fr_1fr_1fr_1.25fr_1fr_92px] items-center border-b border-border/70 px-5 py-4 transition-colors hover:bg-secondary/40" data-testid={`row-student-${student.id}`}><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e0f0f1] text-xs font-bold text-[#19768a]">{student.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><div><div className="text-sm font-semibold text-[#263765]">{student.fullName}</div><div className="ar text-[10px] text-muted-foreground">{student.fullNameArabic}</div></div></div><span className="font-mono text-xs text-muted-foreground">{student.studentNumber}</span><div><div className="text-xs font-medium text-[#385268]">{student.grade}</div><div className="text-[10px] text-muted-foreground">{student.className}</div></div><div className="text-xs text-muted-foreground">{student.guardianName || 'Not provided'}<div className="mt-0.5 text-[10px]">{student.guardianPhone}</div></div><span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${student.status === 'active' ? 'bg-[#dff2eb] text-[#277461]' : student.status === 'graduated' ? 'bg-[#fff0d1] text-[#8d6823]' : 'bg-muted text-muted-foreground'}`}>{student.status}</span><div className="flex justify-end gap-1 opacity-40 transition-opacity group-hover:opacity-100"><button onClick={() => onEdit(student)} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-primary" data-testid={`button-edit-student-${student.id}`} aria-label={`Edit ${student.fullName}`}><Pencil size={14} /></button><button onClick={() => onDelete(student)} className="rounded-md p-2 text-muted-foreground hover:bg-[#fff0ee] hover:text-destructive" data-testid={`button-delete-student-${student.id}`} aria-label={`Delete ${student.fullName}`}><Trash2 size={14} /></button></div></div>;
}

function StudentsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Student | undefined>();
  const [toast, setToast] = useState('');
  const query = useGetStudents({ search: search || undefined, status: (status || undefined) as 'active' | 'inactive' | 'graduated' | undefined }, { query: { queryKey: getGetStudentsQueryKey({ search: search || undefined, status: (status || undefined) as 'active' | 'inactive' | 'graduated' | undefined }) } });
  const deletion = useDeleteStudent();
  const queryClient = useQueryClient();
  const students = query.data ?? [];
  const filtered = useMemo(() => students, [students]);
  const openNew = () => { setEditing(undefined); setDialogOpen(true); };
  const edit = (student: Student) => { setEditing(student); setDialogOpen(true); };
  const remove = (student: Student) => { if (!window.confirm(`Delete ${student.fullName} from the directory?`)) return; deletion.mutate({ id: student.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetStudentsQueryKey() }); setToast('Student record deleted'); } }); };
  return <div className="rise-in"><PageHeading eyebrow="People · 02" title="Students" arabic="الطلاب" description="A clear, current directory for every learner in the Al-Bassam community." action={<Button onClick={openNew} className="h-11 rounded-lg bg-[#263765] px-5 hover:bg-[#1c2b55]" data-testid="button-add-student"><Plus size={17} /> Add student</Button>} />
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row"><div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:max-w-md"><Search size={16} className="text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or student number" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" data-testid="input-search-students" /></div><div className="flex gap-2"><div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3"><Filter size={14} className="text-muted-foreground" /><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 bg-transparent text-xs font-medium outline-none" data-testid="select-student-status"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="graduated">Graduated</option></select></div><button onClick={() => query.refetch()} className="rounded-lg border border-border bg-card px-3 text-muted-foreground transition-colors hover:border-primary hover:text-primary" data-testid="button-refresh-students" aria-label="Refresh students"><RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} /></button></div></div>
    {toast && <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#c8e5dc] bg-[#effaf5] px-4 py-3 text-sm text-[#277461] rise-in" data-testid="status-student-action"><Check size={16} />{toast}<button className="ml-auto text-[#277461]/60 hover:text-[#277461]" onClick={() => setToast('')} data-testid="button-dismiss-student-toast"><X size={14} /></button></div>}
    {query.isLoading ? <div className="rounded-xl border border-border bg-card p-5"><div className="space-y-5">{[1, 2, 3, 4, 5].map((item) => <div className="flex gap-4" key={item}><div className="skeleton h-9 w-9 rounded-full" /><div className="skeleton h-4 w-48 rounded" /></div>)}</div></div> : query.isError ? <ErrorState label="students" onRetry={() => query.refetch()} /> : !filtered.length ? <EmptyState icon={GraduationCap} title={search || status ? 'No students match this view' : 'Start your student directory'} detail={search || status ? 'Try another search term or clear the filters.' : 'Add the first student record to begin building the directory.'} action={!search && !status ? <Button onClick={openNew} data-testid="button-empty-add-student"><Plus size={15} /> Add first student</Button> : undefined} /> : <div className="overflow-x-auto rounded-xl border border-border bg-card soft-shadow"><div className="grid min-w-[760px] grid-cols-[2.2fr_1fr_1fr_1.25fr_1fr_92px] border-b border-border bg-[#f5f9fa] px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground"><span>Student</span><span>Number</span><span>Class</span><span>Guardian</span><span>Status</span><span /></div>{filtered.map((student) => <StudentRow key={student.id} student={student} onEdit={edit} onDelete={remove} />)}</div>}
    <StudentDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} onSaved={setToast} />
  </div>;
}

function TeachersPage() {
  const query = useGetTeachers({ query: { queryKey: getGetTeachersQueryKey() } });
  const teachers = query.data ?? [];
  return <div className="rise-in"><PageHeading eyebrow="People · 03" title="Teachers" arabic="المعلمون" description="The faculty directory, arranged for quick context before the next conversation." action={<Button onClick={() => alert('Teacher creation will be available in the next release.')} variant="outline" className="h-11 rounded-lg border-primary/30 bg-card text-primary" data-testid="button-add-teacher"><Plus size={17} /> Add teacher</Button>} />
    {query.isLoading ? <LoadingCards count={3} /> : query.isError ? <ErrorState label="teachers" onRetry={() => query.refetch()} /> : !teachers.length ? <EmptyState icon={UsersRound} title="The faculty directory is quiet" detail="When teacher records are added, they will live here with their subjects and contact details." action={<Button onClick={() => alert('Teacher creation will be available in the next release.')} data-testid="button-empty-add-teacher"><Plus size={15} /> Add teacher</Button>} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{teachers.map((teacher) => <div key={teacher.id} className="group rounded-xl border border-border bg-card p-5 soft-shadow transition-all duration-300 hover:-translate-y-1 hover:border-primary/30" data-testid={`card-teacher-${teacher.id}`}><div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d9f0ed] text-[#176d70]"><span className="text-sm font-bold">{teacher.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span></div><button className="rounded-md p-2 text-muted-foreground opacity-50 hover:bg-muted hover:text-primary group-hover:opacity-100" data-testid={`button-teacher-options-${teacher.id}`} aria-label={`More options for ${teacher.fullName}`}><MoreHorizontal size={17} /></button></div><div className="mt-5"><h3 className="font-semibold text-[#263765]">{teacher.fullName}</h3><p className="ar mt-1 text-xs text-muted-foreground">{teacher.fullNameArabic}</p></div><div className="mt-5 flex items-center justify-between border-t border-border pt-4"><div><div className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Subject</div><div className="mt-1 text-sm font-medium text-[#385268]">{teacher.subject}</div></div><div className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${teacher.status === 'active' ? 'bg-[#dff2eb] text-[#277461]' : 'bg-muted text-muted-foreground'}`}>{teacher.status}</div></div><div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Phone size={13} />{teacher.phone}<span className="ml-auto font-mono text-[10px]">{teacher.employeeNumber}</span></div></div>)}</div>}
  </div>;
}

function BookDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; onSaved: (message: string) => void }) {
  const [form, setForm] = useState<BookInput>({ title: '', author: '', isbn: '', category: '', copies: 1, language: 'English', shelf: '' });
  const create = useCreateBook();
  const queryClient = useQueryClient();
  const set = (key: keyof BookInput, value: string | number) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => { event.preventDefault(); if (!form.title || !form.author || !form.category || form.copies < 0) return; create.mutate({ data: form }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetBooksQueryKey() }); onOpenChange(false); onSaved('Book added to the library'); } }); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-xl border-border bg-[#f8fbfc] p-0"><form onSubmit={submit}><DialogHeader className="border-b border-border bg-card px-6 py-5 text-left"><div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">Library catalogue</div><DialogTitle className="mt-1 text-2xl text-[#263765]">Add a book</DialogTitle><DialogDescription className="mt-1">Give the library a useful new reference.</DialogDescription></DialogHeader><div className="grid gap-4 px-6 py-6 sm:grid-cols-2">{[['title', 'Title', 'عنوان الكتاب'], ['author', 'Author', 'المؤلف'], ['isbn', 'ISBN', 'الرقم الدولي'], ['category', 'Category', 'التصنيف'], ['shelf', 'Shelf', 'الرف']].map(([key, label, arabic]) => <label key={key} className="block"><span className="mb-1.5 flex justify-between text-xs font-semibold text-[#385268]"><span>{label}</span><span className="ar text-[9px] font-normal text-muted-foreground">{arabic}</span></span><input required={key !== 'isbn' && key !== 'shelf'} value={String(form[key as keyof BookInput] ?? '')} onChange={(event) => set(key as keyof BookInput, event.target.value)} className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" data-testid={`input-book-${key}`} /></label>)}<label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#385268]">Copies</span><input type="number" min="0" required value={form.copies} onChange={(event) => set('copies', Number(event.target.value))} className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary" data-testid="input-book-copies" /></label><label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#385268]">Language</span><select value={form.language} onChange={(event) => set('language', event.target.value)} className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary" data-testid="select-book-language"><option value="English">English</option><option value="Arabic">Arabic</option><option value="French">French</option></select></label></div><DialogFooter className="border-t border-border bg-card px-6 py-4"><Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-book">Cancel</Button><Button type="submit" disabled={create.isPending} className="bg-[#263765] hover:bg-[#1c2b55]" data-testid="button-save-book">{create.isPending ? 'Saving…' : <><Check size={15} /> Add book</>}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function LibraryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState('');
  const query = useGetBooks({ search: search || undefined, category: category || undefined }, { query: { queryKey: getGetBooksQueryKey({ search: search || undefined, category: category || undefined }) } });
  const books = query.data ?? [];
  const categories = useMemo(() => Array.from(new Set(books.map((book) => book.category).filter(Boolean))), [books]);
  return <div className="rise-in"><PageHeading eyebrow="Resources · 04" title="Library" arabic="المكتبة" description="A living catalogue for the stories, references and discoveries on every shelf." action={<Button onClick={() => setDialogOpen(true)} className="h-11 rounded-lg bg-[#263765] px-5 hover:bg-[#1c2b55]" data-testid="button-add-book"><Plus size={17} /> Add book</Button>} />
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row"><div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:max-w-md"><Search size={16} className="text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, author or ISBN" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" data-testid="input-search-books" /></div><div className="flex gap-2"><div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3"><SlidersHorizontal size={14} className="text-muted-foreground" /><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 bg-transparent text-xs font-medium outline-none" data-testid="select-book-category"><option value="">All categories</option>{categories.map((item) => <option value={item} key={item}>{item}</option>)}</select></div></div></div>
    {toast && <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#c8e5dc] bg-[#effaf5] px-4 py-3 text-sm text-[#277461]" data-testid="status-book-action"><Check size={16} />{toast}<button className="ml-auto" onClick={() => setToast('')} data-testid="button-dismiss-book-toast"><X size={14} /></button></div>}
    {query.isLoading ? <LoadingCards count={3} /> : query.isError ? <ErrorState label="library books" onRetry={() => query.refetch()} /> : !books.length ? <EmptyState icon={Library} title="The shelves are waiting" detail={search || category ? 'No books match the current filters.' : 'Add the first title to give your library a useful beginning.'} action={!search && !category ? <Button onClick={() => setDialogOpen(true)} data-testid="button-empty-add-book"><Plus size={15} /> Add first book</Button> : undefined} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{books.map((book) => <BookCard key={book.id} book={book} />)}</div>}
    <BookDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={setToast} />
  </div>;
}

function BookCard({ book }: { book: Book }) {
  const available = book.availableCopies ?? book.copies;
  const percent = book.copies ? Math.round((available / book.copies) * 100) : 0;
  return <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 soft-shadow transition-all duration-300 hover:-translate-y-1 hover:border-primary/30" data-testid={`card-book-${book.id}`}><div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff1d1] text-[#a27526]"><BookOpen size={20} strokeWidth={1.7} /></div><span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-primary">{book.language}</span></div><div className="mt-5"><div className="mb-1 text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">{book.category}</div><h3 className="line-clamp-2 min-h-[48px] text-lg font-bold leading-6 tracking-[-.03em] text-[#263765]">{book.title}</h3><p className="mt-2 text-xs text-muted-foreground">{book.author}</p></div><div className="mt-5 border-t border-border pt-4"><div className="mb-2 flex justify-between text-[11px]"><span className="text-muted-foreground">Available copies</span><span className="font-mono font-bold text-[#263765]">{available} / {book.copies}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${percent > 50 ? 'bg-primary' : percent ? 'bg-accent' : 'bg-destructive'}`} style={{ width: `${percent}%` }} /></div><div className="mt-3 flex justify-between text-[10px] text-muted-foreground"><span>{book.shelf ? `Shelf ${book.shelf}` : 'Shelf not assigned'}</span><span className="font-mono">{book.isbn || 'No ISBN'}</span></div></div></div>;
}

function SettingsPage() {
  const query = useGetAcademicYears({ query: { queryKey: getGetAcademicYearsQueryKey() } });
  const years = query.data ?? [];
  const [selected, setSelected] = useState<number | undefined>();
  return <div className="rise-in"><PageHeading eyebrow="Administration · 05" title="Settings" arabic="الإعدادات" description="Keep the school workspace aligned with its current academic rhythm." /><div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]"><section className="rounded-xl border border-border bg-card p-6 soft-shadow"><div className="flex items-start justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">Academic years</div><h2 className="mt-1 text-xl font-bold tracking-[-.03em] text-[#263765]">Choose your school year</h2><p className="mt-2 text-sm text-muted-foreground">The selected year stays with this device and shapes your workspace context.</p></div><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary"><CalendarDays size={18} /></div></div>{query.isLoading ? <div className="mt-7 space-y-3">{[1, 2, 3].map((item) => <div className="skeleton h-16 rounded-lg" key={item} />)}</div> : query.isError ? <div className="mt-7"><ErrorState label="academic years" onRetry={() => query.refetch()} /></div> : !years.length ? <div className="mt-7"><EmptyState icon={CalendarDays} title="No academic years yet" detail="Academic years will appear once they are configured by the school office." /></div> : <div className="mt-7 space-y-3">{years.map((year) => { const active = year.isCurrent || selected === year.id; return <button key={year.id} onClick={() => setSelected(year.id)} className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${active ? 'border-primary bg-secondary/70' : 'border-border hover:border-primary/40 hover:bg-muted/50'}`} data-testid={`button-academic-year-${year.id}`}><div className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>{active ? <Check size={16} /> : <CalendarDays size={16} />}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="font-semibold text-[#263765]">{year.label}</span>{year.isCurrent && <span className="rounded-full bg-[#dff2eb] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#277461]">Current</span>}</div><div className="mt-1 text-xs text-muted-foreground">{formatDate(year.startDate)} — {formatDate(year.endDate)}</div></div><ChevronDown size={16} className="-rotate-90 text-muted-foreground" /></button>; })}</div>}</section><section className="rounded-xl bg-[#263765] p-7 text-white"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#efd18a] text-[#263765]"><SlidersHorizontal size={18} /></div><h2 className="mt-7 text-2xl font-bold leading-tight tracking-[-.04em]">Workspace preferences</h2><p className="mt-3 text-sm leading-6 text-[#b9cbd4]">A few quiet choices keep the command center feeling like yours.</p><div className="mt-8 space-y-4 border-t border-white/10 pt-5"><div className="flex items-center justify-between"><span className="text-sm">Interface language</span><span className="ar text-xs text-[#b9cbd4]">ثنائي اللغة</span></div><div className="flex items-center justify-between"><span className="text-sm">Date format</span><span className="font-mono text-[11px] text-[#efd18a]">MMM DD, YYYY</span></div><div className="flex items-center justify-between"><span className="text-sm">Product edition</span><span className="text-[11px] text-[#b9cbd4]">Staff workspace</span></div></div></section></div></div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Shell><Switch><Route path="/" component={Dashboard} /><Route path="/students" component={StudentsPage} /><Route path="/teachers" component={TeachersPage} /><Route path="/library" component={LibraryPage} /><Route path="/settings" component={SettingsPage} /><Route component={NotFound} /></Switch></Shell></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;