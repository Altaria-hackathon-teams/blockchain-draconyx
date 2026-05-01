// Local Role-Based Access Control simulation (Survivor / NGO / Verifier).
// Demo-only: stored in localStorage, no real auth. The point is to demonstrate
// the access model on the certificate page.

export type Role = "survivor" | "ngo" | "verifier";

export const ROLE_LABELS: Record<Role, string> = {
  survivor: "Survivor (Owner)",
  ngo: "Legal Aid NGO",
  verifier: "Court Verifier",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  survivor: "Full access — view, share, revoke, export.",
  ngo: "Granted access — view content & FIR draft.",
  verifier: "Hash-only — verify authenticity, no content.",
};

const ROLE_KEY = "silentwitness:role";
const GRANT_KEY = "silentwitness:grants"; // { [evidenceId]: ["ngo", "verifier"] }

export function getRole(): Role {
  if (typeof window === "undefined") return "survivor";
  return (localStorage.getItem(ROLE_KEY) as Role) || "survivor";
}

export function setRole(r: Role) {
  localStorage.setItem(ROLE_KEY, r);
}

type Grants = Record<string, Role[]>;

function readGrants(): Grants {
  try {
    return JSON.parse(localStorage.getItem(GRANT_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeGrants(g: Grants) {
  localStorage.setItem(GRANT_KEY, JSON.stringify(g));
}

export function getGrants(evidenceId: string): Role[] {
  return readGrants()[evidenceId] || [];
}

export function grantAccess(evidenceId: string, role: Role) {
  const g = readGrants();
  const cur = new Set(g[evidenceId] || []);
  cur.add(role);
  g[evidenceId] = Array.from(cur);
  writeGrants(g);
}

export function revokeAccess(evidenceId: string, role: Role) {
  const g = readGrants();
  g[evidenceId] = (g[evidenceId] || []).filter((r) => r !== role);
  writeGrants(g);
}

// Effective permissions on a given evidence record for the active role.
export function canViewContent(role: Role, evidenceId: string): boolean {
  if (role === "survivor") return true;
  if (role === "verifier") return false;
  // ngo
  return getGrants(evidenceId).includes("ngo");
}

export function canVerify(): boolean {
  return true; // every role can verify hash
}

export function canManageAccess(role: Role): boolean {
  return role === "survivor";
}
