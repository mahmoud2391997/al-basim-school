import { FormEvent, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActiveSchoolSystem } from "@/api-client/local";
import { getStudents, getTeachers, getBooks, getBorrows } from "@/api-client/local";

type Message = { role: "user" | "assistant"; content: string };

const INTENT_REGEXES: Array<{ test: RegExp; answer: () => Promise<string> }> = [
  {
    test: /\b(available|برا|متاح|مكتبة|كتب|books?)\b/i,
    answer: async () => {
      const books = await getBooks();
      const available = books.reduce((sum, book) => sum + Number(book.availableCopies ?? 0), 0);
      return `There are ${available} available copies across ${books.length} titles.`;
    },
  },
  {
    test: /\b(active loans|borrowed|loans?|استعارات?|معار)\b/i,
    answer: async () => {
      const borrows = await getBorrows();
      const active = borrows.filter((b) => !b.returnedAt);
      return `There are ${active.length} active loan${active.length === 1 ? "" : "s"} right now.`;
    },
  },
  {
    test: /\b(student|students|طالب|طلاب|تلاميذ)\b/i,
    answer: async () => {
      const students = await getStudents();
      const active = students.filter((s) => s.status === "active");
      return `There are ${students.length} registered students (${active.length} active).`;
    },
  },
  {
    test: /\b(teacher|teachers|معلم|معلمين|مدرسين)\b/i,
    answer: async () => {
      const teachers = await getTeachers();
      const active = teachers.filter((t) => t.status === "active");
      return `There are ${teachers.length} teachers (${active.length} active).`;
    },
  },
];

async function generateLocalAnswer(question: string): Promise<string> {
  const normalized = question.trim().toLowerCase();
  if (!normalized) return "Ask me about students, teachers, books, or loans.";
  for (const intent of INTENT_REGEXES) {
    if (intent.test.test(question)) return intent.answer();
  }
  const [students, teachers, books, borrows] = await Promise.all([
    getStudents().then((items) => items.length),
    getTeachers().then((items) => items.length),
    getBooks().then((items) => items.length),
    getBorrows().then((items) => items.filter((b) => !b.returnedAt).length),
  ]);
  return `I can answer questions from your ${getActiveSchoolSystem()} system data. Currently: ${students} students, ${teachers} teachers, ${books} book titles, and ${borrows} active loans. Try asking "How many books are available?" or "How many active loans are there?"`;
}

export function SchoolAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello. I can answer questions about students, teachers, books, and loans using the local system data." },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) return;
    const next = [...messages, { role: "user" as const, content: message }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const answer = await generateLocalAnswer(message);
      setMessages([...next, { role: "assistant", content: answer }]);
    } catch (error) {
      setMessages([...next, { role: "assistant", content: error instanceof Error ? error.message : "The assistant is unavailable right now." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const ask = (question: string) => { setInput(question); inputRef.current?.focus(); };

  return (
    <div className="fixed bottom-5 end-5 z-50" dir="auto">
      {open && (
        <section className="mb-3 flex h-[min(620px,calc(100dvh-7rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" aria-label="School AI assistant">
          <header className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/15"><Sparkles size={18} /></span><div><p className="font-bold">School Assistant</p><p className="text-xs opacity-75">Local system knowledge</p></div></div>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setOpen(false)} aria-label="Close assistant"><X size={18} /></Button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${message.role === "user" ? "rounded-ee-sm bg-primary text-primary-foreground" : "rounded-es-sm bg-muted text-foreground"}`}>{message.content}</div></div>)}
            {loading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Bot size={15} className="animate-pulse" /> Checking the school system...</div>}
          </div>
          {messages.length === 1 && <div className="flex flex-wrap gap-2 px-4 pb-3"><button className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted" onClick={() => ask("How many books are available?")}>Available books</button><button className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted" onClick={() => ask("How many active loans are there?")}>Active loans</button></div>}
          <form onSubmit={submit} className="flex gap-2 border-t border-border p-3"><input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about the school system..." className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" aria-label="Ask the school assistant" /><Button type="submit" size="icon" disabled={!input.trim() || loading} aria-label="Send question"><Send size={16} /></Button></form>
        </section>
      )}
      <Button onClick={() => { setOpen((value) => !value); setTimeout(() => inputRef.current?.focus(), 0); }} className="h-14 w-14 rounded-full shadow-xl" size="icon" aria-label={open ? "Close school assistant" : "Open school assistant"}><Bot size={23} /></Button>
    </div>
  );
}