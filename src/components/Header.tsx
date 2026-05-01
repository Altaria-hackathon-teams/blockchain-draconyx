import { Link, useLocation } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

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
  const { language, cycleLanguage, t } = useLanguage();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary shadow-glow">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight">{t('app.title')}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{t('app.subtitle')}</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = loc.pathname === l.to;
            // Map link label to translation key
            let tKey = 'nav.home';
            if (l.label === 'Capture') tKey = 'nav.capture';
            if (l.label === 'Legal Aid') tKey = 'nav.legalAid';
            if (l.label === 'Timeline') tKey = 'nav.timeline';
            if (l.label === 'Verify') tKey = 'nav.verify';
            if (l.label === 'Disguise') tKey = 'nav.disguise';
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(tKey)}
              </Link>
            );
          })}
          <div className="ml-4">
            <button
              onClick={cycleLanguage}
              style={{
                background: 'rgba(0,180,166,0.15)',
                border: '1px solid #00b4a6',
                color: '#00b4a6',
                padding: '6px 14px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              {language === 'en' ? '🌐 हिंदी' : language === 'hi' ? '🌐 ಕನ್ನಡ' : '🌐 English'}
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
