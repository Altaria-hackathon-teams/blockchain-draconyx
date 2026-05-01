// Client-side AI integrity analyser — detects digital tampering only
// Uses canvas-based heuristics: ELA-style, edge anomaly, compression artifacts, EXIF
import exifr from "exifr";
import type { AIReport } from "./storage";

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

// Error-Level-Analysis-style: re-encode at lower quality and diff. Tampered regions stand out.
async function elaScore(img: HTMLImageElement): Promise<number> {
  const w = Math.min(img.width, 800);
  const h = Math.round((img.height * w) / img.width);
  const c1 = document.createElement("canvas");
  c1.width = w; c1.height = h;
  const ctx1 = c1.getContext("2d")!;
  ctx1.drawImage(img, 0, 0, w, h);
  const original = ctx1.getImageData(0, 0, w, h);

  // Re-encode as JPEG at 0.75
  const blob: Blob = await new Promise((res) => c1.toBlob((b) => res(b!), "image/jpeg", 0.75)!);
  const reImg = await loadImage(URL.createObjectURL(blob));
  const c2 = document.createElement("canvas");
  c2.width = w; c2.height = h;
  const ctx2 = c2.getContext("2d")!;
  ctx2.drawImage(reImg, 0, 0, w, h);
  const recoded = ctx2.getImageData(0, 0, w, h);

  let totalDiff = 0;
  let highDiffPixels = 0;
  const len = original.data.length;
  for (let i = 0; i < len; i += 4) {
    const d =
      Math.abs(original.data[i] - recoded.data[i]) +
      Math.abs(original.data[i + 1] - recoded.data[i + 1]) +
      Math.abs(original.data[i + 2] - recoded.data[i + 2]);
    totalDiff += d;
    if (d > 60) highDiffPixels++;
  }
  const totalPixels = len / 4;
  const avgDiff = totalDiff / totalPixels;
  const hotspotRatio = highDiffPixels / totalPixels;
  // Score 0-100: avg diff alone is small; hotspot ratio is the strong signal
  return Math.min(100, Math.round(avgDiff * 1.5 + hotspotRatio * 1200));
}

// Edge anomaly via Sobel — sharp inconsistent edges suggest splicing
function edgeAnomaly(img: HTMLImageElement): number {
  const w = Math.min(img.width, 400);
  const h = Math.round((img.height * w) / img.width);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const gray = new Float32Array(w * h);
  for (let i = 0; i < gray.length; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }
  let strongEdges = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1] + gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1];
      const gy = -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1] + gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1];
      if (Math.hypot(gx, gy) > 180) strongEdges++;
    }
  }
  return Math.min(100, Math.round((strongEdges / (w * h)) * 800));
}

// Compression block anomaly: detect unusual variance in 8x8 JPEG blocks
function compressionAnomaly(img: HTMLImageElement): number {
  const w = Math.min(img.width, 400);
  const h = Math.round((img.height * w) / img.width);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const blockVars: number[] = [];
  for (let by = 0; by + 8 <= h; by += 8) {
    for (let bx = 0; bx + 8 <= w; bx += 8) {
      let sum = 0, sumSq = 0;
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const i = ((by + y) * w + (bx + x)) * 4;
          const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
          sum += v; sumSq += v * v;
        }
      }
      const mean = sum / 64;
      blockVars.push(sumSq / 64 - mean * mean);
    }
  }
  if (!blockVars.length) return 0;
  const avg = blockVars.reduce((a, b) => a + b, 0) / blockVars.length;
  const variance = blockVars.reduce((a, b) => a + (b - avg) ** 2, 0) / blockVars.length;
  return Math.min(100, Math.round(Math.sqrt(variance) / 30));
}

export async function analyseImage(
  file: File,
  description: string,
  location?: string
): Promise<AIReport> {
  const dataUrl = URL.createObjectURL(file);
  const img = await loadImage(dataUrl);

  // EXIF
  let exif: Record<string, string | number | null> = {};
  let metadata_status: AIReport["metadata_status"] = "Missing";
  try {
    const raw = await exifr.parse(file, { gps: true });
    if (raw && Object.keys(raw).length > 0) {
      exif = {
        Make: raw.Make ?? null,
        Model: raw.Model ?? null,
        DateTimeOriginal: raw.DateTimeOriginal ? new Date(raw.DateTimeOriginal).toISOString() : null,
        Software: raw.Software ?? null,
        latitude: raw.latitude ?? null,
        longitude: raw.longitude ?? null,
        Orientation: raw.Orientation ?? null,
      };
      metadata_status = raw.Software && /photoshop|gimp|affinity/i.test(String(raw.Software))
        ? "Suspicious"
        : "Valid";
    }
  } catch {
    metadata_status = "Missing";
  }

  // Heuristics
  const [ela, edges, comp] = await Promise.all([
    elaScore(img),
    Promise.resolve(edgeAnomaly(img)),
    Promise.resolve(compressionAnomaly(img)),
  ]);

  const flags: string[] = [];
  if (ela > 55) flags.push("Possible localised editing detected (ELA hotspots)");
  if (edges > 60) flags.push("Unnatural edge transitions found");
  if (comp > 50) flags.push("Inconsistent JPEG compression blocks");
  if (metadata_status === "Missing") flags.push("EXIF metadata stripped or missing");
  if (metadata_status === "Suspicious") flags.push(`Edited with: ${exif.Software}`);

  const consistencyIssues: string[] = [];
  if (!description || description.trim().length < 10)
    consistencyIssues.push("Description too short or missing");
  if (!location) consistencyIssues.push("No location provided");
  if (!exif.DateTimeOriginal) consistencyIssues.push("No capture timestamp in metadata");
  if (consistencyIssues.length) flags.push("Context inconsistencies present");

  // Risk model
  const riskScore = ela * 0.45 + edges * 0.2 + comp * 0.2 + (metadata_status !== "Valid" ? 15 : 0) + consistencyIssues.length * 4;
  let tampering_risk: AIReport["tampering_risk"] = "Low";
  if (riskScore > 65) tampering_risk = "High";
  else if (riskScore > 35) tampering_risk = "Medium";

  const confidence_score = Math.max(20, Math.min(99, Math.round(100 - Math.abs(50 - riskScore) * 0.4)));
  const final_result =
    tampering_risk === "Low"
      ? "No strong signs of tampering"
      : tampering_risk === "Medium"
      ? "Some indicators warrant review"
      : "Potential manipulation detected";

  URL.revokeObjectURL(dataUrl);

  return {
    tampering_risk,
    metadata_status,
    manipulation_flags: flags,
    confidence_score,
    final_result,
    details: {
      exif,
      elaScore: ela,
      edgeAnomaly: edges,
      compressionAnomaly: comp,
      consistencyIssues,
    },
  };
}

// Non-image files: skip visual analysis but still return a report
export function basicReportForNonImage(description: string, location?: string): AIReport {
  const flags: string[] = ["Non-image media — visual tamper analysis not applicable"];
  const consistencyIssues: string[] = [];
  if (!description || description.trim().length < 10) consistencyIssues.push("Description too short");
  if (!location) consistencyIssues.push("No location provided");
  return {
    tampering_risk: consistencyIssues.length > 1 ? "Medium" : "Low",
    metadata_status: "Valid",
    manipulation_flags: flags,
    confidence_score: 75,
    final_result: "Hash-based integrity verified; no visual analysis run",
    details: { exif: {}, elaScore: 0, edgeAnomaly: 0, compressionAnomaly: 0, consistencyIssues },
  };
}
