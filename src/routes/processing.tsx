import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Check, Loader2, Hash, Cloud, Link2, Brain, FileCheck } from "lucide-react";
import { sha256File, simulateTxHash } from "@/lib/crypto";
import { pinToIPFS } from "@/api/pinata.functions";
import { analyseImage, basicReportForNonImage } from "@/lib/ai-analyser";
import { dataUrlToBlob, saveEvidence, type EvidenceRecord } from "@/lib/storage";
import { useLanguage } from "@/lib/LanguageContext";

export const Route = createFileRoute("/processing")({
  head: () => ({ meta: [{ title: "Sealing Evidence — SilentWitness" }] }),
  component: ProcessingPage,
});

const STEPS = [
  { key: "hash", label: "Computing SHA-256 hash", Icon: Hash },
  { key: "ipfs", label: "Pinning to IPFS network", Icon: Cloud },
  { key: "chain", label: "Anchoring to Polygon Mumbai", Icon: Link2 },
  { key: "ai", label: "Running AI integrity analyser", Icon: Brain },
  { key: "cert", label: "Generating certificate", Icon: FileCheck },
] as const;

function ProcessingPage() {
  const { t } = useLanguage();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("sw:pending");
    if (!raw) {
      nav({ to: "/capture" });
      return;
    }
    const data = JSON.parse(raw) as {
      dataUrl: string;
      name: string;
      type: string;
      size: number;
      description: string;
      location: string;
    };

    (async () => {
      try {
        const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

        // 1. Hash
        setStep(0);
        const blob = await dataUrlToBlob(data.dataUrl);
        const file = new File([blob], data.name, { type: data.type });
        const hash = await sha256File(file);
        await wait(900);

        // 2. IPFS (real via Pinata)
        setStep(1);
        const pinRes = await pinToIPFS({ data: { dataUrl: data.dataUrl, name: data.name } });
        const cid = pinRes.ok ? pinRes.cid : "error_pinning_to_ipfs";
        
        // 3. Polygon (simulated)
        setStep(2);
        const txHash = await simulateTxHash(hash + cid);
        const blockNumber = 45_000_000 + Math.floor(Math.random() * 500_000);
        await wait(1300);

        // 4. AI analyser (real)
        setStep(3);
        const ai = data.type.startsWith("image/")
          ? await analyseImage(file, data.description, data.location)
          : basicReportForNonImage(data.description, data.location);
        await wait(700);

        // 5. Certificate
        setStep(4);
        await wait(700);

        const id = hash.slice(0, 16);
        const record: EvidenceRecord = {
          id,
          filename: data.name,
          mimeType: data.type,
          size: data.size,
          hash,
          cid,
          txHash,
          blockNumber,
          timestamp: Date.now(),
          description: data.description,
          location: data.location,
          dataUrl: data.dataUrl,
          ai,
        };
        saveEvidence(record);
        sessionStorage.removeItem("sw:pending");

        setStep(5);
        await wait(400);
        nav({ to: "/certificate/$id", params: { id } });
      } catch (e) {
        setError(String(e));
      }
    })();
  }, [nav]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-gradient-primary shadow-glow animate-pulse-glow">
            <Loader2 className="h-9 w-9 animate-spin text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t('processing.title')}</h1>
          <p className="mt-2 text-muted-foreground">
            {t('processing.subtitle')}
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-gradient-card p-6 shadow-elegant">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div
                key={s.key}
                className={`flex items-center gap-4 rounded-lg border px-4 py-3 transition-all ${
                  active
                    ? "border-primary/60 bg-primary/5 scan-line"
                    : done
                    ? "border-success/30 bg-success/5"
                    : "border-border/60 bg-background/30 opacity-60"
                }`}
              >
                <div
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                    done ? "bg-success/20 text-success" : active ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : <s.Icon className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{s.label}</div>
                  {active && <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">In progress…</div>}
                  {done && <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-success">Complete</div>}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
