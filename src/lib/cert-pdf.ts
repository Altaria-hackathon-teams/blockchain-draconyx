import { jsPDF } from "jspdf";
import type { EvidenceRecord } from "./storage";
import { format } from "date-fns";
import { shortHash } from "./crypto";

export function downloadCertificatePdf(rec: EvidenceRecord, qrDataUrl: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  function addPageIfNeeded(extra = 0) {
    if (y + extra > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function writeText(text: string, font: "helvetica", style: "normal" | "bold", size: number, color: [number, number, number] = [0, 0, 0]) {
    doc.setFont(font, style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, pageW - margin * 2);
    addPageIfNeeded(lines.length * size * 1.2);
    doc.text(lines, margin, y);
    y += lines.length * size * 1.2 + 10;
  }

  function writeLine(label: string, value: string) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(label, margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(value, pageW - margin * 2);
    addPageIfNeeded(lines.length * 11 * 1.2);
    doc.text(lines, margin, y);
    y += lines.length * 11 * 1.2 + 12;
  }

  // Header
  writeText("SILENTWITNESS", "helvetica", "bold", 24, [10, 24, 32]);
  y -= 5;
  writeText("DIGITAL EVIDENCE CERTIFICATE", "helvetica", "bold", 12, [0, 163, 108]);
  y += 20;

  // Metadata
  writeText("This document certifies that a digital file was securely hashed and its cryptographic fingerprint was recorded.", "helvetica", "normal", 11);
  y += 20;

  writeLine("File Name", rec.filename);
  writeLine("File Type / Size", `${rec.mimeType} / ${(rec.size / 1024).toFixed(2)} KB`);
  writeLine("Description", rec.description || "N/A");
  if (rec.location) writeLine("Location", rec.location);
  writeLine("Capture Date (Local)", format(new Date(rec.timestamp), "PPpp"));
  
  y += 20;
  writeText("CRYPTOGRAPHIC RECORD", "helvetica", "bold", 14);
  y += 10;

  writeLine("SHA-256 Hash", rec.hash);
  writeLine("IPFS Content Identifier (CID)", rec.cid);
  writeLine("Blockchain Transaction Hash", rec.txHash);
  writeLine("Block Number", rec.blockNumber.toString());

  if (rec.sbt) {
    y += 20;
    writeText("SOULBOUND TOKEN (SBT)", "helvetica", "bold", 14);
    y += 10;
    writeLine("Token ID", rec.sbt.tokenId);
    writeLine("Contract Address", rec.sbt.contract);
    writeLine("Owner Address", rec.sbt.owner);
  }

  if (rec.ai?.final_result) {
    y += 20;
    writeText("AI PRELIMINARY ANALYSIS", "helvetica", "bold", 14);
    y += 10;
    writeText(rec.ai.final_result, "helvetica", "normal", 11);
  }

  if (rec.forensic) {
    y += 20;
    writeText("CLINICAL / FORENSIC OBSERVATIONS", "helvetica", "bold", 14);
    y += 10;
    writeLine("Features", rec.forensic.observed_features.join(", ") || "None observed");
    writeLine("Age Estimate", `${rec.forensic.approximate_age_estimate.stage} — ${rec.forensic.approximate_age_estimate.rationale}`);
    writeLine("Location", rec.forensic.anatomical_location);
    writeLine("Disclaimer", rec.forensic.disclaimer);
  }

  // QR Code
  if (qrDataUrl) {
    addPageIfNeeded(150);
    y += 20;
    try {
      doc.addImage(qrDataUrl, "PNG", margin, y, 120, 120);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Scan to verify this certificate on SilentWitness", margin + 140, y + 60);
      y += 130;
    } catch(e) {
      console.error(e);
    }
  }

  // Footer
  y += 40;
  addPageIfNeeded(40);
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 20;
  writeText("This digital certificate is cryptographically verifiable. Do not modify the original media file. Generated on: " + format(new Date(), "PPpp"), "helvetica", "normal", 9, [150, 150, 150]);

  doc.save(`Evidence_Certificate_${shortHash(rec.hash)}.pdf`);
}
