import type { AIReport } from "@/lib/storage";
import { CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

export function RiskBadge({ risk, size = "md" }: { risk: AIReport["tampering_risk"]; size?: "sm" | "md" | "lg" }) {
  const cfg = {
    Low: { Icon: CheckCircle2, bg: "bg-success/15", text: "text-success", border: "border-success/40", label: "Low Risk" },
    Medium: { Icon: AlertTriangle, bg: "bg-warning/15", text: "text-warning", border: "border-warning/40", label: "Medium Risk" },
    High: { Icon: ShieldAlert, bg: "bg-destructive/15", text: "text-destructive", border: "border-destructive/40", label: "High Risk" },
  }[risk];
  const sizes = {
    sm: "text-xs px-2 py-1 gap-1",
    md: "text-sm px-3 py-1.5 gap-1.5",
    lg: "text-base px-4 py-2 gap-2",
  }[size];
  const iconSize = size === "lg" ? "h-5 w-5" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${cfg.bg} ${cfg.text} ${cfg.border} ${sizes}`}>
      <cfg.Icon className={iconSize} />
      {cfg.label}
    </span>
  );
}
