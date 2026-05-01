import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { sha256File, shortHash, ipfsGatewayUrl, polygonscanUrl } from "@/lib/crypto";
import { getEvidenceByHash } from "@/lib/storage";
import { Upload, CheckCircle2, XCircle, Search, ExternalLink, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

type VerifyResult =
  | { status: "match"; recordHash: string; computed: string; record: ReturnType<typeof getEvidenceByHash> }
  | { status: "mismatch"; recordHash: string; computed: string }
  | { status: "not-found"; computed: string };

export const Route = createFileRoute("/verify")({
  validateSearch: (s: Record<string, unknown>) => ({ hash: typeof s.hash === "string" ? s.hash : undefined }),
  head: () => ({ meta: [{ title: "Verify Evidence — SilentWitness" }] }),
  component: VerifyPage,
});

function VerifyPage() {
  const { t } = useLanguage();
  const { hash } = Route.useSearch();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [hashInput, setHashInput] = useState(hash || "");

  useEffect(() => {
    if (hash) {
      const r = getEvidenceByHash(hash);
      if (r) setResult({ status: "match", recordHash: r.hash, computed: r.hash, record: r });
    }
  }, [hash]);

  async function verifyFile(file: File) {
    setBusy(true);
    try {
      const computed = await sha256File(file);
      const record = getEvidenceByHash(computed);
      if (record) {
        setResult({ status: "match", recordHash: record.hash, computed, record });
      } else if (hashInput && hashInput !== computed) {
        setResult({ status: "mismatch", recordHash: hashInput, computed });
      } else {
        setResult({ status: "not-found", computed });
      }
    } finally {
      setBusy(false);
    }
  }

  function lookup() {
    if (!hashInput) return;
    const r = getEvidenceByHash(hashInput.toLowerCase().trim());
    if (r) setResult({ status: "match", recordHash: r.hash, computed: r.hash, record: r });
    else setResult({ status: "not-found", computed: hashInput });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">{t('verify.title')}</h1>
        <p className="mt-2 text-muted-foreground">
          {t('verify.subtitle')}
        </p>

        <div className="mt-8 grid gap-4 rounded-2xl border border-border bg-gradient-card p-6 shadow-elegant">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-background/40 px-6 py-12 transition-colors hover:border-primary/60 hover:bg-primary/5 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            ) : (
              <Upload className="h-7 w-7 text-primary" />
            )}
            <div className="text-center">
              <div className="font-medium">{busy ? t('verify.btn.hashing') : t('verify.btn.upload')}</div>
              <div className="mt-1 text-xs text-muted-foreground">SHA-256 is computed locally</div>
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && verifyFile(e.target.files[0])}
          />

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">{t('verify.or')}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex gap-2">
            <input
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              placeholder={t('verify.placeholder.hash')}
              className="flex-1 rounded-lg border border-border bg-background/60 px-3 py-2.5 font-mono text-sm outline-none focus:border-primary"
            />
            <button
              onClick={lookup}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
            >
              <Search className="h-4 w-4" /> {t('verify.btn.lookup')}
            </button>
          </div>
        </div>

        {result && <ResultCard result={result} />}
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: VerifyResult }) {
  const { t } = useLanguage();
  if (result.status === "match" && result.record) {
    return (
      <div className="mt-6 rounded-2xl border-2 border-success/40 bg-success/5 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-7 w-7 shrink-0 text-success" />
          <div className="flex-1">
            <div className="text-lg font-bold text-success">{t('verify.status.match')}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Sealed {new Date(result.record.timestamp).toLocaleString()}
            </div>
            <div className="mt-4 space-y-2 rounded-lg border border-border/60 bg-background/40 p-4 font-mono text-xs">
              <div>
                <span className="text-muted-foreground">Hash · </span>
                <span className="break-all">{result.record.hash}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">CID · </span>
                <span>{shortHash(result.record.cid, 10)}</span>
                <a href={ipfsGatewayUrl(result.record.cid)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" /> View Data
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Tx · </span>
                <span>{shortHash(result.record.txHash, 10)}</span>
                <a href={polygonscanUrl(result.record.txHash)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" /> Verify on Polygonscan
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (result.status === "mismatch") {
    return (
      <div className="mt-6 rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-6">
        <div className="flex items-start gap-3">
          <XCircle className="h-7 w-7 shrink-0 text-destructive" />
          <div>
            <div className="text-lg font-bold text-destructive">{t('verify.status.mismatch')}</div>
            <div className="mt-3 space-y-2 break-all rounded-lg border border-border/60 bg-background/40 p-4 font-mono text-xs">
              <div>
                <span className="text-muted-foreground">On-chain · </span>
                {result.recordHash}
              </div>
              <div>
                <span className="text-muted-foreground">Computed · </span>
                {result.computed}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-6 rounded-2xl border-2 border-warning/40 bg-warning/5 p-6">
      <div className="flex items-start gap-3">
        <XCircle className="h-7 w-7 shrink-0 text-warning" />
        <div>
          <div className="text-lg font-bold text-warning">{t('verify.status.notFound')}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Computed SHA-256 was not found in the local ledger. In production this would query the smart contract.
          </div>
          <div className="mt-3 break-all rounded-lg border border-border/60 bg-background/40 p-3 font-mono text-xs">
            {result.computed}
          </div>
        </div>
      </div>
    </div>
  );
}
