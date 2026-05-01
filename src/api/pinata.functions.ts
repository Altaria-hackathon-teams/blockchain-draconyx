import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const UploadInput = z.object({
  dataUrl: z.string(),
  name: z.string(),
});

export const pinToIPFS = createServerFn({ method: "POST" })
  .inputValidator((input) => UploadInput.parse(input))
  .handler(async ({ data }) => {
    try {
      const apiKey = process.env.PINATA_API_KEY;
      const apiSecret = process.env.PINATA_API_SECRET;

      if (!apiKey || !apiSecret) {
        throw new Error("Pinata credentials not configured");
      }

      // Convert base64 dataUrl to buffer
      const base64Data = data.dataUrl.split(",")[1];
      if (!base64Data) {
        throw new Error("Invalid base64 dataUrl");
      }
      
      const buffer = Buffer.from(base64Data, "base64");

      const formData = new FormData();
      const blob = new Blob([buffer]);
      formData.append("file", blob, data.name);
      
      const pinataMetadata = JSON.stringify({ name: data.name });
      formData.append("pinataMetadata", pinataMetadata);

      const pinataOptions = JSON.stringify({ cidVersion: 1 });
      formData.append("pinataOptions", pinataOptions);

      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          pinata_api_key: apiKey,
          pinata_secret_api_key: apiSecret,
        },
        body: formData as any,
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("Pinata upload error", res.status, txt);
        return { ok: false as const, error: `Pinata error: ${res.status}` };
      }

      const json = await res.json();
      return { ok: true as const, cid: json.IpfsHash as string };
    } catch (e) {
      console.error("Pinata upload failed", e);
      return { ok: false as const, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });