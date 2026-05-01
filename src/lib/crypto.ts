// SHA-256 hashing and simulated blockchain/IPFS utilities
export async function sha256File(file: File | Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256String(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Simulate IPFS CID v1 (bafy...) — visually authentic
export function simulateCID(hash: string): string {
  const base = "bafybeig" + hash.slice(0, 46).replace(/[^a-z0-9]/gi, "a");
  return base.toLowerCase().slice(0, 59);
}

// Simulate Polygon tx hash (0x + 64 hex)
export async function simulateTxHash(payload: string): Promise<string> {
  const h = await sha256String(payload + Date.now() + Math.random());
  return "0x" + h;
}

export function polygonscanUrl(tx: string): string {
  // Opening the internal mock explorer page instead of the real Polygonscan
  return `/explorer/${tx}`;
}

export function ipfsGatewayUrl(cid: string): string {
  // Use a faster dedicated or public IPFS URL for hackathon speed
  return `https://ipfs.io/ipfs/${cid}`;
}

export function shortHash(h: string, len = 8): string {
  if (!h) return "";
  return `${h.slice(0, len)}…${h.slice(-len)}`;
}
