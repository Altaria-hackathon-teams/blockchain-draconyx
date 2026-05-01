import { Link, useLocation } from "@tanstack/react-router";
import { Shield } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/capture", label: "Capture" },
  { to: "/legal-chat", label: "Legal Aid" },
  { to: "/timeline", label: "Timeline" },
  { to: "/verify", label: "Verify" },
  { to: "/disguise", label: "Disguise" },
];

export function Header() {
  const loc = useLocation();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary shadow-glow">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight">SilentWitness</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">AI Evidence Ledger</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = loc.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
