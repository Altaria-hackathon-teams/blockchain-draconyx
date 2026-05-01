import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { Send, FileText, Loader2, Sparkles, Download, ShieldCheck } from "lucide-react";
import { generateFIR } from "@/api/ai.functions";
import { downloadFIRPdf, type FIR } from "@/lib/fir-pdf";
import { listEvidence } from "@/lib/storage";

export const Route = createFileRoute("/legal-chat")({
  head: () => ({ meta: [{ title: "Legal Aid Chat — SilentWitness" }] }),
  component: LegalChatPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const FIRST_MESSAGE: Msg = {
  role: "assistant",
  content:
    "Hi — I'm here to help you draft a First Information Report (FIR). Everything you share stays private and on your device until you choose to export it. Whenever you're ready, can you tell me the **date** of the incident?",
};

function LegalChatPage() {
  const [messages, setMessages] = useState<Msg[]>([FIRST_MESSAGE]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [firLoading, setFirLoading] = useState(false);
  const [fir, setFir] = useState<FIR | null>(null);
  const [err, setErr] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function send(text: string) {
    if (!text.trim() || streaming) return;
    setErr("");
    const userMsg: Msg = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);

    try {
      const resp = await fetch("/api/legal-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) setErr("Too many requests. Please wait a moment.");
        else if (resp.status === 402) setErr("AI credits exhausted. Add credits in workspace settings.");
        else setErr("AI service error. Please try again.");
        setStreaming(false);
        return;
      }

      // Append empty assistant message and stream into it
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      let acc = "";

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const p = JSON.parse(json);
            const c = p?.choices?.[0]?.delta?.content as string | undefined;
            if (c) {
              acc += c;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      setErr(e instanceof Error ? e.message : "Network error");
    } finally {
      setStreaming(false);
    }
  }

  async function makeFIR() {
    setFirLoading(true);
    setErr("");
    try {
      const latest = listEvidence()[0];
      const r = await generateFIR({
        data: {
          transcript: messages,
          evidence: latest
            ? { hash: latest.hash, cid: latest.cid, txHash: latest.txHash, timestamp: latest.timestamp }
            : undefined,
        },
      });
      if (!r.ok) {
        setErr(r.error);
      } else {
        setFir(r.fir as FIR);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to generate FIR");
    } finally {
      setFirLoading(false);
    }
  }

  function exportPdf() {
    if (!fir) return;
    const latest = listEvidence()[0];
    downloadFIRPdf(fir, latest ? { hash: latest.hash, cid: latest.cid, txHash: latest.txHash } : undefined);
  }

  const readyForFIR = messages.some((m) =>
    m.role === "assistant" && m.content.toLowerCase().includes("enough information")
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-border bg-gradient-card shadow-elegant">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">AI Legal Aid Assistant</div>
                <div className="text-xs text-muted-foreground">Trauma-informed · Confidential · Draft only</div>
              </div>
            </div>
            <span className="hidden rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-success md:inline">
              Lovable AI · Gemini
            </span>
          </div>

          <div ref={scrollRef} className="h-[480px] space-y-3 overflow-y-auto px-5 py-5">
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} text={m.content} />
            ))}
            {streaming && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="text-xs text-muted-foreground">
                <Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> Thinking…
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border p-4"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your reply…"
              disabled={streaming}
              className="flex-1 rounded-lg border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          {err && <div className="border-t border-destructive/40 bg-destructive/10 px-4 py-2 text-xs text-destructive">{err}</div>}
        </div>

        {/* FIR side panel */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-elegant">
            <div className="mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <div className="font-semibold">FIR Generator</div>
            </div>
            <p className="text-xs text-muted-foreground">
              When you&rsquo;ve answered the assistant&rsquo;s questions, generate a structured Indian-format FIR draft and export it as a PDF.
            </p>
            <button
              onClick={makeFIR}
              disabled={firLoading || messages.length < 4}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                readyForFIR
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "border border-border bg-background/40 text-foreground hover:bg-secondary"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {firLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {firLoading ? "Drafting…" : fir ? "Re-draft FIR" : "Generate FIR draft"}
            </button>
          </div>

          {fir && (
            <div className="rounded-2xl border-2 border-success/40 bg-success/5 p-5 shadow-elegant">
              <div className="text-xs uppercase tracking-wider text-success">FIR Draft Ready</div>
              <div className="mt-1 font-mono text-sm">{fir.fir_number}</div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div><span className="text-foreground">Police Station:</span> {fir.police_station}</div>
                <div><span className="text-foreground">Date:</span> {fir.incident.date} · {fir.incident.time}</div>
                <div><span className="text-foreground">Sections:</span> {fir.applicable_sections.length} preliminary</div>
              </div>
              <button
                onClick={exportPdf}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow"
              >
                <Download className="h-4 w-4" /> Download FIR PDF
              </button>
            </div>
          )}

          <div className="rounded-xl border border-border/60 bg-background/40 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Privacy</p>
            <p className="mt-1">Conversation is sent to Lovable AI for drafting only. Nothing is stored on a server.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ role, text }: { role: "user" | "assistant"; text: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-primary text-primary-foreground"
            : "border border-border bg-background/60"
        }`}
      >
        {text || <span className="opacity-50">…</span>}
      </div>
    </div>
  );
}
