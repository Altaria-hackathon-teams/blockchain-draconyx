// Tiny offline queue helper. If navigator.onLine is false at submit time, we stash
// the pending evidence payload so the user can complete it when back online.

const KEY = "silentwitness:offline-queue";

export type OfflinePayload = {
  dataUrl: string;
  name: string;
  type: string;
  size: number;
  description: string;
  location: string;
  queuedAt: number;
};

export function isOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function enqueue(p: Omit<OfflinePayload, "queuedAt">) {
  const all = list();
  all.push({ ...p, queuedAt: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function list(): OfflinePayload[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function dequeue(): OfflinePayload | undefined {
  const all = list();
  const first = all.shift();
  localStorage.setItem(KEY, JSON.stringify(all));
  return first;
}

export function count() {
  return list().length;
}
