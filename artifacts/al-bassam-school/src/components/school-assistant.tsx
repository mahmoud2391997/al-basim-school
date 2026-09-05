import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActiveSchoolSystem, getStudents, getTeachers, getBooks, getBorrows } from "@/api-client/local";

type AssistantLang = "en" | "ar";

type Message = { role: "user" | "assistant"; content: string };

type AnswerCtx = { lang: AssistantLang };

type Intent = {
  test: RegExp;
  answer: (ctx: AnswerCtx) => Promise<string>;
};

const INTENT_REGEXES: Intent[] = [
  {
    test: /\b(available|برا|متاح|مكتبة|كتب|books?)\b/i,
    answer: async ({ lang }) => {
      const books = await getBooks();
      const available = books.reduce((sum, book) => sum + Number(book.availableCopies ?? 0), 0);
      return lang === "ar"
        ? `يوجد ${available} نسخة متاحة من ${books.length} عنوان.`
        : `There are ${available} available copies across ${books.length} titles.`;
    },
  },
  {
    test: /\b(active loans|borrowed|loans?|استعارات?|معار)\b/i,
    answer: async ({ lang }) => {
      const borrows = await getBorrows();
      const active = borrows.filter((b) => !b.returnedAt);
      return lang === "ar"
        ? `يوجد ${active.length} إعارة نشطة حالياً.`
        : `There are ${active.length} active loan${active.length === 1 ? "" : "s"} right now.`;
    },
  },
  {
    test: /\b(student|students|طالب|طلاب|تلاميذ)\b/i,
    answer: async ({ lang }) => {
      const students = await getStudents();
      const active = students.filter((s) => s.status === "active");
      return lang === "ar"
        ? `يوجد ${students.length} طالب مسجل (منهم ${active.length} نشط).`
        : `There are ${students.length} registered students (${active.length} active).`;
    },
  },
  {
    test: /\b(teacher|teachers|معلم|معلمين|مدرسين)\b/i,
    answer: async ({ lang }) => {
      const teachers = await getTeachers();
      const active = teachers.filter((t) => t.status === "active");
      return lang === "ar"
        ? `يوجد ${teachers.length} معلم (منهم ${active.length} نشط).`
        : `There are ${teachers.length} teachers (${active.length} active).`;
    },
  },
];

async function generateLocalAnswer(question: string, lang: AssistantLang): Promise<string> {
  const normalized = question.trim().toLowerCase();
  if (!normalized) {
    return lang === "ar"
      ? "اسألني عن الطلاب أو المعلمين أو الكتب أو الإعارات."
      : "Ask me about students, teachers, books, or loans.";
  }
  for (const intent of INTENT_REGEXES) {
    if (intent.test.test(question)) return intent.answer({ lang });
  }
  const [students, teachers, books, borrows, system] = await Promise.all([
    getStudents().then((items) => items.length),
    getTeachers().then((items) => items.length),
    getBooks().then((items) => items.length),
    getBorrows().then((items) => items.filter((b) => !b.returnedAt).length),
    Promise.resolve(getActiveSchoolSystem()),
  ]);
  if (lang === "ar") {
    return `يمكنني الإجابة على أسئلتك من بيانات ${system === "boys" ? "مدارس البنين" : "مدارس البنات"}. حالياً: ${students} طالب، ${teachers} معلم، ${books} عنوان كتاب، و${borrows} إعارة نشطة. جرّب أن تسأل "كم كتاب متاح" أو "كم إعارة نشطة"`;
  }
  return `I can answer questions from your ${system} system data. Currently: ${students} students, ${teachers} teachers, ${books} book titles, and ${borrows} active loans. Try asking "How many books are available?" or "How many active loans are there?"`;
}

export function SchoolAssistant({ language = "en", canUse = false }: { language?: AssistantLang; canUse?: boolean }) {
  const lang: AssistantLang = language;
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        lang === "ar"
          ? "مرحباً. يمكنني الإجابة عن أسئلتك حول الطلاب والمعلمين والكتب والإعارات باستخدام بيانات النظام المحلية."
          : "Hello. I can answer questions about students, teachers, books, and loans using the local system data.",
    },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages((current) =>
      current.length === 1 && current[0].role === "assistant"
        ? [
            {
              role: "assistant" as const,
              content:
                lang === "ar"
                  ? "مرحباً. يمكنني الإجابة عن أسئلتك حول الطلاب والمعلمين والكتب والإعارات باستخدام بيانات النظام المحلية."
                  : "Hello. I can answer questions about students, teachers, books, and loans using the local system data.",
            },
          ]
        : current,
    );
  }, [lang]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) return;
    const next = [...messages, { role: "user" as const, content: message }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const answer = await generateLocalAnswer(message, lang);
      setMessages([...next, { role: "assistant", content: answer }]);
    } catch (error) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            lang === "ar"
              ? "المساعد غير متاح حالياً."
              : error instanceof Error ? error.message : "The assistant is unavailable right now.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const ask = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  if (!canUse) return null;

  return (
    <div className="fixed bottom-5 end-5 z-50 flex flex-col items-end gap-3" dir="auto">
      {open && (
        <section className="flex h-[min(620px,calc(100dvh-7rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" aria-label={lang === "ar" ? "المساعد الذكي للمدرسة" : "School AI assistant"}>
          <header className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/15"><Sparkles size={18} /></span><div><p className="font-bold">{lang === "ar" ? "المساعد المدرسي" : "School Assistant"}</p><p className="text-xs opacity-75">{lang === "ar" ? "معرفة النظام المحلية" : "Local system knowledge"}</p></div></div>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setOpen(false)} aria-label={lang === "ar" ? "إغلاق المساعد" : "Close assistant"}><X size={18} /></Button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${message.role === "user" ? "rounded-ee-sm bg-primary text-primary-foreground" : "rounded-es-sm bg-muted text-foreground"}`} dir="auto">{message.content}</div></div>)}
            {loading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Bot size={15} className="animate-pulse" /> {lang === "ar" ? "جارٍ فحص النظام المدرسي..." : "Checking the school system..."}</div>}
          </div>
          {messages.length === 1 && <div className="flex flex-wrap gap-2 px-4 pb-3"><button className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted" onClick={() => ask(lang === "ar" ? "كم كتاب متاح" : "How many books are available?")}>{lang === "ar" ? "الكتب المتاحة" : "Available books"}</button><button className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted" onClick={() => ask(lang === "ar" ? "كم إعارة نشطة" : "How many active loans are there?")}>{lang === "ar" ? "الإعارات النشطة" : "Active loans"}</button></div>}
          <form onSubmit={submit} className="flex gap-2 border-t border-border p-3"><input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder={lang === "ar" ? "اسأل عن النظام المدرسي..." : "Ask about the school system..."} className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" aria-label={lang === "ar" ? "اسأل المساعد المدرسي" : "Ask the school assistant"} /><Button type="submit" size="icon" disabled={!input.trim() || loading} aria-label={lang === "ar" ? "إرسال السؤال" : "Send question"}><Send size={16} /></Button></form>
        </section>
      )}
      <div className="flex flex-col items-end gap-2">
        {!open && (
          <button onClick={() => setOpen(true)} className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground shadow-xl transition-colors hover:bg-muted" aria-label={lang === "ar" ? "اسأل المساعد المدرسي" : "Ask the school assistant"}>
            {lang === "ar" ? "اسأل المساعد..." : "Ask the assistant..."}
          </button>
        )}
        <Button onClick={() => { setOpen((value) => !value); setTimeout(() => inputRef.current?.focus(), 0); }} className="h-14 w-14 rounded-full shadow-xl" size="icon" aria-label={open ? (lang === "ar" ? "إغلاق المساعد المدرسي" : "Close school assistant") : (lang === "ar" ? "فتح المساعد المدرسي" : "Open school assistant")}><Bot size={23} /></Button>
      </div>
    </div>
  );
}