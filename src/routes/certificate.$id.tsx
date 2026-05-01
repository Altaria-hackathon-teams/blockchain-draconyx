import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Header } from "@/components/Header";
import { AIReportCard } from "@/components/AIReportCard";
import { ForensicReportCard } from "@/components/ForensicReportCard";
import { SoulboundCard } from "@/components/SoulboundCard";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { getEvidence, updateEvidence } from "@/lib/storage";
import { ipfsGatewayUrl, polygonscanUrl, shortHash } from "@/lib/crypto";
import { mintSoulbound } from "@/lib/nft";
import { forensicImageReport } from "@/api/ai.functions";
import { canViewContent, canManageAccess, getGrants, grantAccess, revokeAccess, ROLE_LABELS, getRole, type Role } from "@/lib/roles";
import { Download, ExternalLink, Copy, Check, FlaskConical, Eye, Lock, UserPlus, UserMinus } from "lucide-react";
import { downloadCertificatePdf } from "@/lib/cert-pdf";
import { useLanguage } from "@/lib/LanguageContext";

export const Route = createFileRoute("/certificate/$id")({
  head: () => ({ meta: [{ title: "Evidence Certificate — SilentWitness" }] }),
  component: CertPage,
});

function CertPage() {
  const { t } = useLanguage();
  const { id } = useParams({ from: "/certificate/$id" });
  const [rec, setRec] = useState(() => getEvidence(id));
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState("");
  const [role, setRoleState] = useState<Role>("survivor");
  const [grants, setGrants] = useState<Role[]>([]);
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionError, setVisionError] = useState("");

  useEffect(() => {
    setRoleState(getRole());
    setGrants(getGrants(id));
  }, [id]);

  // QR code
  useEffect(() => {
    if (!rec) return;
    const payload = JSON.stringify({
      app: "SilentWitness",
      hash: rec.hash,
      cid: rec.cid,
      tx: rec.txHash,
      verifyUrl: `${window.location.origin}/verify?hash=${rec.hash}`,
    });
    QRCode.toDataURL(payload, { margin: 1, width: 280, color: { dark: "#0a1820", light: "#e7f7ee" } }).then(setQr);
  }, [rec]);

  // Mint SBT once
  useEffect(() => {
    if (!rec || rec.sbt) return;
    (async () => {
      const sbt = await mintSoulbound({
        hash: rec.hash,
        cid: rec.cid,
        txHash: rec.txHash,
        timestamp: rec.timestamp,
        aiSummary: rec.ai.final_result,
      });
      updateEvidence(rec.id, { sbt });
      setRec(getEvidence(id));
    })();
  }, [rec, id]);

  // Forensic AI vision
  useEffect(() => {
    if (!rec || rec.forensic || !rec.mimeType.startsWith("image/")) return;
    setVisionLoading(true);
    setVisionError("");
    forensicImageReport({ data: { imageDataUrl: rec.dataUrl, description: rec.description } })
      .then((r) => {
        if (r.ok) {
          updateEvidence(rec.id, { forensic: r.report });
          setRec(getEvidence(id));
        } else {
          setVisionError(r.error);
        }
      })
      .catch((e) => setVisionError(e instanceof Error ? e.message : "AI failed"))
      .finally(() => setVisionLoading(false));
  }, [rec, id]);

  if (!rec) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          <h1 className="text-2xl font-bold">{t('cert.notFound')}</h1>
          <Link to="/capture" className="mt-4 inline-block text-primary underline">
            {t('cert.btn.captureNew')}
          </Link>
        </div>
      </div>
    );
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  function toggleGrant(r: Role) {
    if (grants.includes(r)) revokeAccess(id, r);
    else grantAccess(id, r);
    setGrants(getGrants(id));
  }

  const contentVisible = canViewContent(role, id);
  const isVerifier = role === "verifier";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{t('cert.sealed')}</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{t('cert.title')}</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left: details */}
          <div className="space-y-6">
            {isVerifier ? (
              <div className="rounded-2xl border-2 border-warning/40 bg-warning/5 p-6 text-sm">
                <div className="flex items-center gap-2 font-semibold text-warning">
                  <Lock className="h-4 w-4" /> Verifier view — hash-only access
                </div>
                <p className="mt-2 text-muted-foreground">
                  As a Court Verifier you can confirm authenticity but cannot view the original media or
                  description. Use the SHA-256 hash and on-chain record below to verify.
                </p>
              </div>
            ) : contentVisible ? (
              <div className="overflow-hidden rounded-2xl border border-border bg-gradient-card shadow-elegant">
                {rec.mimeType.startsWith("image/") && (
                  <img src={rec.dataUrl} alt="" className="max-h-[360px] w-full object-contain bg-black/40" />
                )}
                {rec.mimeType.startsWith("video/") && <video src={rec.dataUrl} controls className="max-h-[360px] w-full bg-black" />}
                {rec.mimeType.startsWith("audio/") && (
                  <div className="p-6"><audio src={rec.dataUrl} controls className="w-full" /></div>
                )}
                <div className="space-y-3 border-t border-border p-5 text-sm">
                  <Field label="File" value={rec.filename} />
                  <Field label="Size" value={`${(rec.size / 1024).toFixed(1)} KB · ${rec.mimeType}`} />
                  <Field label="Captured" value={new Date(rec.timestamp).toLocaleString()} />
                  {rec.description && <Field label="Description" value={rec.description} />}
                  {rec.location && <Field label="Location" value={rec.location} />}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-gradient-card p-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Lock className="h-4 w-4 text-primary" /> Access required
                </div>
                <p className="mt-2">
                  As {ROLE_LABELS[role]} you need the survivor to grant you content access for this evidence.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-elegant">
              <div className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">{t('cert.crypto.title')}</div>
              <Row label="SHA-256" value={rec.hash} onCopy={() => copy(rec.hash, "hash")} copied={copied === "hash"} />
              <Row label="IPFS CID" value={rec.cid} onCopy={() => copy(rec.cid, "cid")} copied={copied === "cid"} href={ipfsGatewayUrl(rec.cid)} />
              <Row label="Polygon Tx" value={rec.txHash} onCopy={() => copy(rec.txHash, "tx")} copied={copied === "tx"} href={polygonscanUrl(rec.txHash)} />
              <Row label="Block" value={`#${rec.blockNumber.toLocaleString()}`} />
            </div>

            {contentVisible && <AIReportCard report={rec.ai} />}
            {contentVisible && rec.mimeType.startsWith("image/") && (
              <ForensicReportCard report={rec.forensic} loading={visionLoading && !rec.forensic} error={visionError} />
            )}
            {rec.sbt && <SoulboundCard sbt={rec.sbt} hash={rec.hash} />}
          </div>

          {/* Right: QR + actions + RBAC */}
          <div className="space-y-4">
            <RoleSwitcher onChange={(r) => { setRoleState(r); setGrants(getGrants(id)); }} />

            <div className="rounded-2xl border border-border bg-gradient-card p-6 text-center shadow-elegant">
              {qr ? <img src={qr} alt="QR" className="mx-auto rounded-lg" /> : <div className="mx-auto h-[280px] w-[280px] animate-pulse rounded-lg bg-secondary" />}
              <div className="mt-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">{t('cert.scan')}</div>
              <div className="mt-1 font-mono text-sm">{shortHash(rec.hash, 6)}</div>
            </div>

            {canManageAccess(role) && (
              <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-elegant">
                <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">{t('cert.rbac.title')}</div>
                {(["ngo", "verifier"] as Role[]).map((r) => {
                  const granted = grants.includes(r);
                  return (
                    <button
                      key={r}
                      onClick={() => toggleGrant(r)}
                      className={`mb-2 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                        granted ? "border-success/40 bg-success/10 text-success" : "border-border bg-background/40 hover:bg-secondary"
                      }`}
                    >
                      <span>{ROLE_LABELS[r]}</span>
                      <span className="flex items-center gap-1 text-xs">
                        {granted ? <><UserMinus className="h-3.5 w-3.5" /> {t('cert.rbac.revoke')}</> : <><UserPlus className="h-3.5 w-3.5" /> {t('cert.rbac.grant')}</>}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <button onClick={() => downloadCertificatePdf(rec, qr)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-primary px-4 py-3 font-medium text-primary-foreground shadow-glow">
              <Download className="h-4 w-4" /> {t('cert.btn.download')}
            </button>
            <Link to="/verify" search={{ hash: rec.hash } as never} className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card/60 px-4 py-3 text-sm transition-colors hover:bg-card">
              <Eye className="h-4 w-4" /> {t('cert.btn.verify')}
            </Link>
            <Link to="/tamper-test/$id" params={{ id: rec.id }} className="flex w-full items-center justify-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning transition-colors hover:bg-warning/20">
              <FlaskConical className="h-4 w-4" /> {t('cert.btn.tamper')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function Row({ label, value, onCopy, copied, href }: { label: string; value: string; onCopy?: () => void; copied?: boolean; href?: string }) {
  return (
    <div className="border-t border-border/40 py-3 first:border-t-0 first:pt-0">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {onCopy && (
            <button onClick={onCopy} className="text-muted-foreground transition-colors hover:text-primary">
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>
      <div className="break-all font-mono text-sm">{value}</div>
    </div>
  );
}
