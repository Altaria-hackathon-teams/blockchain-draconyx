import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { getEvidence } from "@/lib/storage";
import { sha256File } from "@/lib/crypto";
import { FlaskConical, Loader2, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/tamper-test/$id")({
  head: () => ({ meta: [{ title: "Tampering Simulation — SilentWitness" }] }),
  component: TamperPage,
});

function TamperPage() {
  const { id } = useParams({ from: "/tamper-test/$id" });
  const rec = getEvidence(id);
  const [busy, setBusy] = useState(false);
  const [tamperedHash, setTamperedHash] = useState<string>("");

  async function runTampering() {
    if (!rec) return;
    setBusy(true);
    try {
      const r = await fetch(rec.dataUrl);
      const blob = await r.blob();
      // Append a single byte → completely different hash
      const tampered = new Blob([blob, new Uint8Array([0x42])], { type: rec.mimeType });
      const h = await sha256File(tampered);
      setTamperedHash(h);
    } finally {
      setBusy(false);
    }
  }

  if (!rec) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
          <FlaskConical className="h-3.5 w-3.5" /> Demo · Tampering simulation
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Show what happens if a single byte changes</h1>
        <p className="mt-2 text-muted-foreground">
          We'll modify the file by one byte and recompute SHA-256. Even the smallest change produces a completely different hash — proving immutability.
        </p>

        <div className="mt-8 space-y-4 rounded-2xl border border-border bg-gradient-card p-6 shadow-elegant">
          <div className="rounded-lg border border-success/40 bg-success/5 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" /> Original on-chain hash
            </div>
            <div className="mt-2 break-all font-mono text-xs">{rec.hash}</div>
          </div>

          {!tamperedHash ? (
            <button
              onClick={runTampering}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-primary px-4 py-3 font-medium text-primary-foreground shadow-glow disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
              {busy ? "Tampering & re-hashing…" : "Tamper with file & recompute"}
            </button>
          ) : (
            <>
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                  <XCircle className="h-4 w-4" /> Tampered hash
                </div>
                <div className="mt-2 break-all font-mono text-xs">{tamperedHash}</div>
              </div>
              <div className="rounded-lg border-2 border-destructive/40 bg-destructive/10 p-4 text-center">
                <div className="text-sm font-bold text-destructive">MISMATCH — file would fail verification</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  This is exactly what happens in court if any party tries to alter the evidence.
                </div>
              </div>
              <button
                onClick={() => setTamperedHash("")}
                className="w-full rounded-lg border border-border bg-background/60 px-4 py-2.5 text-sm hover:bg-secondary"
              >
                Reset
              </button>
            </>
          )}
        </div>

        <Link
          to="/certificate/$id"
          params={{ id: rec.id }}
          className="mt-6 inline-block text-sm text-primary hover:underline"
        >
          ← Back to certificate
        </Link>
      </div>
    </div>
  );
}
