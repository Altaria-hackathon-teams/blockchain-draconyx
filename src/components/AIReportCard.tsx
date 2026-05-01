import type { AIReport } from "@/lib/storage";
import { RiskBadge } from "./RiskBadge";
import { Brain, AlertCircle, CheckCircle2, Info } from "lucide-react";

export function AIReportCard({ report }: { report: AIReport }) {
  const tone =
    report.tampering_risk === "Low"
      ? "border-success/40 bg-success/5"
      : report.tampering_risk === "Medium"
      ? "border-warning/40 bg-warning/5"
      : "border-destructive/40 bg-destructive/5";

  const FinalIcon = report.tampering_risk === "Low" ? CheckCircle2 : AlertCircle;

  return (
    <div className={`rounded-2xl border-2 ${tone} p-6 shadow-elegant`}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">AI Integrity Analyser</div>
            <div className="font-semibold">Tamper-detection report</div>
          </div>
        </div>
        <RiskBadge risk={report.tampering_risk} size="lg" />
      </div>

      <div className={`mb-5 flex items-start gap-3 rounded-lg bg-background/40 p-4`}>
        <FinalIcon
          className={`h-5 w-5 shrink-0 ${
            report.tampering_risk === "Low" ? "text-success" : report.tampering_risk === "Medium" ? "text-warning" : "text-destructive"
          }`}
        />
        <div>
          <div className="font-semibold">{report.final_result}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Confidence: <span className="font-mono text-foreground">{report.confidence_score}%</span>
            {" · "}Metadata: <span className="font-mono text-foreground">{report.metadata_status}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="ELA Hotspots" value={report.details.elaScore} />
        <Metric label="Edge Anomaly" value={report.details.edgeAnomaly} />
        <Metric label="Compression" value={report.details.compressionAnomaly} />
      </div>

      {report.manipulation_flags.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Flags</div>
          <ul className="space-y-1.5">
            {report.manipulation_flags.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {Object.keys(report.details.exif).length > 0 && (
        <div className="mt-5">
          <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">EXIF Metadata</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg border border-border/60 bg-background/40 p-3 font-mono text-xs">
            {Object.entries(report.details.exif).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="text-muted-foreground">{k}</span>
                <span className="truncate">{v == null ? "—" : String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  const tone = value > 60 ? "text-destructive" : value > 35 ? "text-warning" : "text-success";
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-2xl font-semibold ${tone}`}>{value}</div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full ${value > 60 ? "bg-destructive" : value > 35 ? "bg-warning" : "bg-success"}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}
