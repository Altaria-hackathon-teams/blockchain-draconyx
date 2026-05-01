import type { ForensicObservation } from "@/lib/storage";
import { Stethoscope, Loader2, AlertTriangle } from "lucide-react";

export function ForensicReportCard({
  report,
  loading,
  error,
}: {
  report?: ForensicObservation;
  loading?: boolean;
  error?: string;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-elegant">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          AI vision is analysing the image…
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-warning/40 bg-warning/5 p-6">
        <div className="flex items-center gap-2 text-sm text-warning">
          <AlertTriangle className="h-4 w-4" />
          AI vision unavailable: {error}
        </div>
      </div>
    );
  }
  if (!report) return null;

  return (
    <div className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-6 shadow-elegant">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent/15 text-accent">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">AI Forensic Vision</div>
            <div className="font-semibold">Neutral observation report</div>
          </div>
        </div>
        <div className="rounded-md border border-accent/40 bg-accent/10 px-2 py-1 font-mono text-xs text-accent">
          {report.confidence_visual}% visual confidence
        </div>
      </div>

      <div className="space-y-4 text-sm">
        <Section title="Observed features">
          {report.observed_features.length ? (
            <ul className="list-disc space-y-1 pl-5">
              {report.observed_features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          ) : (
            <p className="text-muted-foreground">None reported.</p>
          )}
        </Section>

        <div className="grid gap-4 sm:grid-cols-2">
          <Section title="Approximate age">
            <p className="font-medium">{report.approximate_age_estimate.stage}</p>
            <p className="mt-1 text-xs text-muted-foreground">{report.approximate_age_estimate.rationale}</p>
          </Section>
          <Section title="Anatomical location">
            <p>{report.anatomical_location}</p>
          </Section>
        </div>

        <Section title="Characteristics">
          {report.characteristics.length ? (
            <div className="flex flex-wrap gap-1.5">
              {report.characteristics.map((c, i) => (
                <span key={i} className="rounded-md border border-border bg-background/40 px-2 py-0.5 text-xs">
                  {c}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">—</p>
          )}
        </Section>

        {report.image_quality_notes.length > 0 && (
          <Section title="Image quality">
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              {report.image_quality_notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          </Section>
        )}
      </div>

      <p className="mt-5 rounded-lg border border-border/60 bg-background/40 p-3 text-xs italic text-muted-foreground">
        {report.disclaimer}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}
