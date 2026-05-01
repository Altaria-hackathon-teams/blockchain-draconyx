// Local IndexedDB-lite via localStorage (file blobs as data URLs for demo)
export type ForensicObservation = {
  observed_features: string[];
  approximate_age_estimate: { stage: string; rationale: string };
  anatomical_location: string;
  characteristics: string[];
  image_quality_notes: string[];
  confidence_visual: number;
  disclaimer: string;
};

export type SoulboundTokenRecord = {
  tokenId: string;
  contract: string;
  owner: string;
  nonTransferable: true;
};

export type EvidenceRecord = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  hash: string;
  cid: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  description: string;
  location?: string;
  dataUrl: string; // small preview / re-fetch source
  ai: AIReport;
  forensic?: ForensicObservation;
  sbt?: SoulboundTokenRecord;
};

export function updateEvidence(id: string, patch: Partial<EvidenceRecord>) {
  const all = listEvidence();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], ...patch };
  localStorage.setItem(KEY, JSON.stringify(all));
}

export type AIReport = {
  tampering_risk: "Low" | "Medium" | "High";
  metadata_status: "Valid" | "Missing" | "Suspicious";
  manipulation_flags: string[];
  confidence_score: number;
  final_result: string;
  details: {
    exif: Record<string, string | number | null>;
    elaScore: number;
    edgeAnomaly: number;
    compressionAnomaly: number;
    consistencyIssues: string[];
  };
};

const KEY = "silentwitness:evidence";

export function listEvidence(): EvidenceRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveEvidence(rec: EvidenceRecord) {
  const all = listEvidence();
  all.unshift(rec);
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 50)));
}

export function getEvidence(id: string): EvidenceRecord | undefined {
  return listEvidence().find((r) => r.id === id);
}

export function getEvidenceByHash(hash: string): EvidenceRecord | undefined {
  return listEvidence().find((r) => r.hash === hash);
}

export function getEvidenceByTxHash(txHash: string): EvidenceRecord | undefined {
  return listEvidence().find((r) => r.txHash === txHash);
}

export async function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const r = await fetch(dataUrl);
  return r.blob();
}
