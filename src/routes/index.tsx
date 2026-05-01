import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Shield, Camera, Brain, Link2, FileCheck, Lock, Activity } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SilentWitness — Tamper-Proof Evidence" },
      { name: "description", content: "Secure evidence on Polygon + IPFS with AI integrity analysis." },
    ],
  }),
  component: HomePage,
});

const features = [
  { Icon: Shield, title: "Cryptographic Sealing", body: "Every file is SHA-256 hashed and anchored to Polygon Mumbai — immutable forever." },
  { Icon: Brain, title: "AI Integrity Analyser", body: "Client-side ELA, edge & compression checks plus EXIF audit detect digital tampering." },
  { Icon: Link2, title: "IPFS Decentralised", body: "Files are pinned to IPFS via Pinata — no single party can erase the record." },
  { Icon: FileCheck, title: "QR Verification", body: "A scannable certificate lets anyone re-verify authenticity in seconds." },
  { Icon: Lock, title: "Disguise Mode", body: "App appears as a calculator. Survivors enter a secret code to unlock." },
  { Icon: Activity, title: "Timeline & Export", body: "Chronological evidence ledger with downloadable legal certificate." },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Hackathon MVP · Polygon · IPFS · AI
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Evidence that <span className="text-gradient-primary">cannot be erased</span>, denied, or doctored.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            SilentWitness seals digital evidence into the blockchain and runs an on-device AI integrity analyser to flag tampering — built for survivors who need their truth preserved.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/capture"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-6 py-3 font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
            >
              <Camera className="h-4 w-4" /> Capture Evidence
            </Link>
            <Link
              to="/verify"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/60 px-6 py-3 font-medium text-foreground backdrop-blur transition-colors hover:bg-card"
            >
              <FileCheck className="h-4 w-4" /> Verify a File
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-6 text-center md:max-w-lg">
            <Stat label="SHA-256" value="Immutable" />
            <Stat label="Polygon" value="On-chain" />
            <Stat label="On-device" value="AI Audit" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">A complete chain of custody</h2>
          <p className="mt-3 text-muted-foreground">From capture to courtroom — sealed end-to-end.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-border bg-gradient-card p-6 shadow-elegant transition-all hover:border-primary/40"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <f.Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-2xl border border-border bg-gradient-card p-10 shadow-elegant">
          <h2 className="text-2xl font-bold tracking-tight">The 6-step chain of custody</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              "Capture media in browser",
              "SHA-256 hash computed locally",
              "File pinned to IPFS",
              "Hash + CID written to Polygon",
              "AI integrity analyser runs",
              "QR certificate generated",
            ].map((step, i) => (
              <li key={step} className="flex gap-3 rounded-lg border border-border/60 bg-background/40 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-primary font-mono text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        SilentWitness · Built for survivors · Hackathon MVP
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 px-3 py-3 backdrop-blur">
      <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
