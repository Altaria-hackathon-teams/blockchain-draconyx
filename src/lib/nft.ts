// Simulated Soulbound NFT (SBT) — non-transferable token tied to evidence record.
// Demo-only: deterministic token id from hash, fake contract address.

import { sha256String } from "./crypto";

export type SoulboundToken = {
  tokenId: string;
  contract: string;
  owner: string;
  nonTransferable: true;
  metadata: {
    name: string;
    description: string;
    hash: string;
    cid: string;
    txHash: string;
    timestamp: number;
    aiSummary: string;
  };
};

const SBT_CONTRACT = "0x517B0bC1d8A5f2C5F0e8e0d6c5A3A0B0D9F0aA01"; // demo

export async function mintSoulbound(args: {
  hash: string;
  cid: string;
  txHash: string;
  timestamp: number;
  aiSummary: string;
  ownerSeed?: string;
}): Promise<SoulboundToken> {
  const tokenIdHash = await sha256String("sbt:" + args.hash);
  const ownerHash = await sha256String("owner:" + (args.ownerSeed ?? args.hash));
  return {
    tokenId: "0x" + tokenIdHash.slice(0, 16),
    contract: SBT_CONTRACT,
    owner: "0x" + ownerHash.slice(0, 40),
    nonTransferable: true,
    metadata: {
      name: `SilentWitness Evidence #${tokenIdHash.slice(0, 6).toUpperCase()}`,
      description:
        "Soulbound (non-transferable) certificate of evidence preservation. Bound permanently to the survivor's wallet.",
      hash: args.hash,
      cid: args.cid,
      txHash: args.txHash,
      timestamp: args.timestamp,
      aiSummary: args.aiSummary,
    },
  };
}
