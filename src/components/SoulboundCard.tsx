import type { SoulboundTokenRecord } from "@/lib/storage";
import { Sparkles, Lock } from "lucide-react";
import { shortHash } from "@/lib/crypto";

export function SoulboundCard({ sbt, hash }: { sbt: SoulboundTokenRecord; hash: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-primary/40 bg-gradient-card p-5 shadow-elegant">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/20 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Soulbound NFT</div>
            <div className="font-semibold">Non-transferable evidence token</div>
          </div>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] uppercase tracking-wider text-primary">
          <Lock className="h-3 w-3" /> Soulbound
        </div>
      </div>

      <div className="relative mt-4 grid gap-2 text-sm">
        <Row k="Token ID" v={sbt.tokenId} />
        <Row k="Contract" v={shortHash(sbt.contract, 6)} />
        <Row k="Owner" v={shortHash(sbt.owner, 6)} />
        <Row k="Bound to" v={shortHash(hash, 8)} />
      </div>

      <p className="relative mt-4 text-xs text-muted-foreground">
        This token is permanently bound to the survivor&rsquo;s wallet — it cannot be sold, transferred, or
        destroyed. It serves as on-chain proof of evidence ownership.
      </p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{k}</span>
      <span className="font-mono text-xs">{v}</span>
    </div>
  );
}
