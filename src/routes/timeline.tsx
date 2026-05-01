import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { listEvidence } from "@/lib/storage";
import { RiskBadge } from "@/components/RiskBadge";
import { shortHash } from "@/lib/crypto";
import { FileImage, FileVideo, FileAudio, File as FileIcon, ChevronRight, Plus } from "lucide-react";

export const Route = createFileRoute("/timeline")({
  head: () => ({ meta: [{ title: "Evidence Timeline — SilentWitness" }] }),
  component: TimelinePage,
});

function iconFor(mime: string) {
  if (mime.startsWith("image/")) return FileImage;
  if (mime.startsWith("video/")) return FileVideo;
  if (mime.startsWith("audio/")) return FileAudio;
  return FileIcon;
}

function TimelinePage() {
  const items = listEvidence();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Evidence Timeline</h1>
            <p className="mt-2 text-muted-foreground">Chronological ledger of sealed evidence. Data is secure on this device and IPFS.</p>
          </div>
          <Link
            to="/capture"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow"
          >
            <Plus className="h-4 w-4" /> New evidence
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-gradient-card p-12 text-center">
            <p className="text-muted-foreground">No evidence sealed yet.</p>
            <Link to="/capture" className="mt-4 inline-block text-primary underline">
              Capture your first evidence
            </Link>
          </div>
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-8">
            {items.map((rec) => {
              const Icon = iconFor(rec.mimeType);
              return (
                <li key={rec.id} className="relative">
                  <span className="absolute -left-10 top-4 h-3 w-3 rounded-full bg-gradient-primary shadow-glow" />
                  <Link
                    to="/certificate/$id"
                    params={{ id: rec.id }}
                    className="group flex items-center gap-4 rounded-xl border border-border bg-gradient-card p-4 shadow-elegant transition-all hover:border-primary/40"
                  >
                    {rec.mimeType.startsWith("image/") ? (
                      <img src={rec.dataUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover bg-black/40" />
                    ) : (
                      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-secondary">
                        <Icon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{rec.filename}</span>
                        <RiskBadge risk={rec.ai.tampering_risk} size="sm" />
                      </div>
                      <div className="mt-1 truncate text-sm text-muted-foreground">
                        {rec.description || "No description"}
                      </div>
                      <div className="mt-1 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        <span>{new Date(rec.timestamp).toLocaleString()}</span>
                        <span>·</span>
                        <span>{shortHash(rec.hash, 6)}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
