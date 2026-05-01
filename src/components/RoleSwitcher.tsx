import { useEffect, useState } from "react";
import type { Role } from "@/lib/roles";
import { getRole, setRole, ROLE_LABELS } from "@/lib/roles";
import { Users } from "lucide-react";

const ROLES: Role[] = ["survivor", "ngo", "verifier"];

export function RoleSwitcher({ onChange }: { onChange?: (r: Role) => void }) {
  const [role, setLocalRole] = useState<Role>("survivor");

  useEffect(() => {
    setLocalRole(getRole());
  }, []);

  function pick(r: Role) {
    setRole(r);
    setLocalRole(r);
    onChange?.(r);
  }

  return (
    <div className="rounded-xl border border-border bg-gradient-card p-4 shadow-elegant">
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Users className="h-3.5 w-3.5" /> Demo · Active role
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ROLES.map((r) => {
          const active = r === role;
          return (
            <button
              key={r}
              onClick={() => pick(r)}
              className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                active
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-background/40 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {ROLE_LABELS[r].split(" ")[0]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
