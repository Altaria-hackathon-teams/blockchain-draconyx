// Server functions calling Lovable AI Gateway for SilentWitness.
// - forensicImageReport: structured non-conclusive observations on an image
// - generateFIR: structured Indian-format First Information Report from chat transcript

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

function getKey(): string {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("GEMINI_API_KEY is not configured");
  return k;
}

// ============ Forensic image observation ============
const VisionInput = z.object({
  imageDataUrl: z.string().min(20),
  description: z.string().max(2000).optional().default(""),
});

export const forensicImageReport = createServerFn({ method: "POST" })
  .inputValidator((input) => VisionInput.parse(input))
  .handler(async ({ data }) => {
    try {
      const apiKey = getKey();

      const systemPrompt = `You are a clinical forensic observation assistant.
Your role is STRICTLY DESCRIPTIVE — you observe and document, never conclude or accuse.
You NEVER state that abuse occurred, who caused an injury, or assign blame.
Use neutral, medical / forensic language only.
If the image does not show a person or relevant detail, still respond in the required schema with empty arrays and a low confidence_visual.`;

      const userPrompt = `Provide a structured forensic-style observation report for this image. Survivor description (if any): "${data.description}".

Respond ONLY by calling the function "submit_forensic_observation" with these fields:
- observed_features: list of neutral physical observations (e.g. "linear discoloration on left forearm", "swelling around right eye area"). Empty array if none.
- approximate_age_estimate: object with "stage" (one of: "fresh / recent (0-2 days)", "intermediate (2-7 days)", "older (>7 days)", "indeterminate") and "rationale" (short neutral reasoning based on color / healing pattern).
- anatomical_location: short phrase (e.g. "lateral upper arm"). Use "not applicable" when no person present.
- characteristics: list of neutral descriptors (e.g. "linear", "circular", "diffuse", "ecchymotic discoloration").
- image_quality_notes: list of capture-related observations (lighting, focus, framing).
- confidence_visual: integer 0-100 reflecting how clearly the features are visible.
- disclaimer: a fixed string reminding the reader this is observational only, not a medical or legal conclusion.`;

      const tool = {
        type: "function",
        function: {
          name: "submit_forensic_observation",
          description: "Return a structured neutral forensic observation report.",
          parameters: {
            type: "object",
            properties: {
              observed_features: { type: "array", items: { type: "string" } },
              approximate_age_estimate: {
                type: "object",
                properties: {
                  stage: { type: "string" },
                  rationale: { type: "string" },
                },
                required: ["stage", "rationale"],
                additionalProperties: false,
              },
              anatomical_location: { type: "string" },
              characteristics: { type: "array", items: { type: "string" } },
              image_quality_notes: { type: "array", items: { type: "string" } },
              confidence_visual: { type: "integer", minimum: 0, maximum: 100 },
              disclaimer: { type: "string" },
            },
            required: [
              "observed_features",
              "approximate_age_estimate",
              "anatomical_location",
              "characteristics",
              "image_quality_notes",
              "confidence_visual",
              "disclaimer",
            ],
            additionalProperties: false,
          },
        },
      };

      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                { type: "image_url", image_url: { url: data.imageDataUrl } },
              ],
            },
          ],
          tools: [tool],
          tool_choice: { type: "function", function: { name: "submit_forensic_observation" } },
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("forensicImageReport gateway error", res.status, txt);
        return { ok: false as const, error: `AI service error (${res.status})` };
      }

      const json = await res.json();
      const call = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!call) return { ok: false as const, error: "No structured response from AI" };
      const parsed = JSON.parse(call);
      return { ok: true as const, report: parsed };
    } catch (e) {
      console.error("forensicImageReport failed", e);
      return { ok: false as const, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });

// ============ FIR generation ============
const FIRInput = z.object({
  transcript: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ).max(80),
  evidence: z
    .object({
      hash: z.string().optional(),
      cid: z.string().optional(),
      txHash: z.string().optional(),
      timestamp: z.number().optional(),
    })
    .optional(),
});

export const generateFIR = createServerFn({ method: "POST" })
  .inputValidator((input) => FIRInput.parse(input))
  .handler(async ({ data }) => {
    try {
      const apiKey = getKey();

      const systemPrompt = `You are a legal-aid drafting assistant trained in the format of an Indian First Information Report (FIR) under the Bharatiya Nagarik Suraksha Sanhita / CrPC.
Draft a neutral, structured FIR based ONLY on facts the complainant has shared.
Do not fabricate names, places, or witnesses. If a field is unknown, write "Not stated by complainant".
Do not assign criminal liability — describe the alleged incident factually.
Suggest applicable BNS / IPC sections only as preliminary references; clearly mark them as "Preliminary, subject to police verification".`;

      const transcriptText = data.transcript
        .map((m) => `${m.role === "user" ? "Complainant" : "Assistant"}: ${m.content}`)
        .join("\n");

      const evidenceLine = data.evidence
        ? `\n\nDigital evidence registered: SHA-256 ${data.evidence.hash ?? "N/A"}, IPFS CID ${data.evidence.cid ?? "N/A"}, anchored tx ${data.evidence.txHash ?? "N/A"}.`
        : "";

      const tool = {
        type: "function",
        function: {
          name: "submit_fir",
          description: "Return a structured Indian-format FIR.",
          parameters: {
            type: "object",
            properties: {
              fir_number: { type: "string", description: "Synthetic placeholder e.g. SW/2026/0001 — clearly marked draft." },
              date_of_report: { type: "string" },
              time_of_report: { type: "string" },
              police_station: { type: "string" },
              complainant: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  age: { type: "string" },
                  gender: { type: "string" },
                  address: { type: "string" },
                  contact: { type: "string" },
                },
                required: ["name", "age", "gender", "address", "contact"],
                additionalProperties: false,
              },
              accused: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  relation: { type: "string" },
                  address: { type: "string" },
                  description: { type: "string" },
                },
                required: ["name", "relation", "address", "description"],
                additionalProperties: false,
              },
              incident: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  time: { type: "string" },
                  location: { type: "string" },
                  description: { type: "string" },
                },
                required: ["date", "time", "location", "description"],
                additionalProperties: false,
              },
              witnesses: { type: "array", items: { type: "string" } },
              applicable_sections: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    code: { type: "string" },
                    section: { type: "string" },
                    description: { type: "string" },
                  },
                  required: ["code", "section", "description"],
                  additionalProperties: false,
                },
              },
              digital_evidence_summary: { type: "string" },
              statement_of_complainant: { type: "string" },
              draft_disclaimer: { type: "string" },
            },
            required: [
              "fir_number",
              "date_of_report",
              "time_of_report",
              "police_station",
              "complainant",
              "accused",
              "incident",
              "witnesses",
              "applicable_sections",
              "digital_evidence_summary",
              "statement_of_complainant",
              "draft_disclaimer",
            ],
            additionalProperties: false,
          },
        },
      };

      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Draft an FIR from this conversation:\n\n${transcriptText}${evidenceLine}`,
            },
          ],
          tools: [tool],
          tool_choice: { type: "function", function: { name: "submit_fir" } },
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("generateFIR gateway error", res.status, txt);
        return { ok: false as const, error: `AI service error (${res.status})` };
      }

      const json = await res.json();
      const call = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!call) return { ok: false as const, error: "No structured FIR returned" };
      return { ok: true as const, fir: JSON.parse(call) };
    } catch (e) {
      console.error("generateFIR failed", e);
      return { ok: false as const, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });
