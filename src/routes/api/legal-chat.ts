// Streaming SSE chat for the AI Legal Assistant.
// POST { messages: [{role, content}] } -> text/event-stream of OpenAI-style chunks.
import { createFileRoute } from "@tanstack/react-router";

const GATEWAY_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

const SYSTEM_PROMPT = `You are SilentWitness Legal Aid, an empathetic AI assistant helping survivors of domestic violence in India document an incident for a future First Information Report (FIR).

Goals:
1. Be calm, validating, and non-judgmental. Acknowledge the survivor's feelings briefly before asking the next question.
2. Ask ONE structured question at a time. Cover, in order:
   - Date of the incident
   - Approximate time
   - Location (city, area, address if comfortable)
   - What happened — a factual description in the survivor's own words
   - Any witnesses (names or relations) — optional
   - Any visible injuries, marks, or property damage
   - Whether they have already contacted police, hospital, or NGO
3. Keep each reply short (max 3 short sentences).
4. NEVER ask anything that pressures the survivor or assigns blame.
5. NEVER provide legal verdicts. You may mention that an FIR can be filed at any police station ("Zero FIR") and that this draft is preliminary.
6. When you believe enough information has been collected, say exactly: "I have enough information to draft your FIR. You can now generate the FIR document." and stop asking new questions.

Tone: warm, professional, trauma-informed. Use simple language.`;

export const Route = createFileRoute("/api/legal-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) {
            return new Response(JSON.stringify({ error: "GEMINI_API_KEY missing" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const body = (await request.json()) as {
            messages?: { role: "user" | "assistant"; content: string }[];
          };
          const messages = Array.isArray(body.messages) ? body.messages.slice(-30) : [];

          const upstream = await fetch(GATEWAY_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gemini-2.5-flash",
              stream: true,
              messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
            }),
          });

          if (!upstream.ok) {
            if (upstream.status === 429) {
              return new Response(
                JSON.stringify({ error: "Rate limit reached. Please wait a moment." }),
                { status: 429, headers: { "Content-Type": "application/json" } }
              );
            }
            if (upstream.status === 402) {
              return new Response(
                JSON.stringify({ error: "AI credits exhausted." }),
                { status: 402, headers: { "Content-Type": "application/json" } }
              );
            }
            const t = await upstream.text();
            console.error("legal-chat upstream error", upstream.status, t);
            return new Response(JSON.stringify({ error: "AI gateway error" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(upstream.body, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
            },
          });
        } catch (e) {
          console.error("legal-chat error", e);
          return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
