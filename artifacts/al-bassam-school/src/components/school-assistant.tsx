import { FormEvent, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Message = { role: "user" | "assistant"; content: string };

export function SchoolAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello. I can answer questions about students, teachers, books, loans, and school metrics using the live system data." },
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
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, history: messages.slice(-8) }) });
      const result = await response.json() as { answer?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "The assistant is unavailable.");
      setMessages([...next, { role: "assistant", content: result.answer || "I could not find an answer." }]);
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
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/15"><Sparkles size={18} /></span><div><p className="font-bold">School Assistant</p><p className="text-xs opacity-75">Live system knowledge</p></div></div>
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
