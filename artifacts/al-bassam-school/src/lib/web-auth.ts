const CRED_KEY = "al-bassam:web-admin";
const STUDENT_CRED_KEY = "al-bassam:web-student-accounts";
const SESSION_KEY = "al-bassam:web-session";
const SESSION_USER_KEY = "al-bassam:web-session-user";
const SEED_FLAG_KEY = "al-bassam:web-seeded";

export const SHARED_STUDENT_USERNAME = "student";
export const SHARED_STUDENT_PASSWORD = "0123456789";

const PBKDF2_ITERATIONS = 100000;
export type WebRole = "library-admin" | "student";
export type WebUser = { username: string; role: WebRole; fullName?: string; studentNumber?: string; active?: boolean };
type StoredCredential = WebUser & { hash: string };

function randomHex(bytes: number): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Array.from(buffer).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function deriveHash(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: encoder.encode(salt), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" }, keyMaterial, 256);
  return Array.from(new Uint8Array(bits)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
function readAdmin(): StoredCredential | null { try { const raw = window.localStorage.getItem(CRED_KEY); return raw ? JSON.parse(raw) as StoredCredential : null; } catch { return null; } }
function readStudents(): StoredCredential[] { try { return JSON.parse(window.localStorage.getItem(STUDENT_CRED_KEY) || "[]") as StoredCredential[]; } catch { return []; } }
async function matches(password: string, credential: StoredCredential) { const [salt, expected] = credential.hash.split(":"); if (!salt || !expected) return false; const hash = await deriveHash(password, salt); if (hash.length !== expected.length) return false; let diff = 0; for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ expected.charCodeAt(i); return diff === 0; }

export async function ensureCredentials(): Promise<boolean> {
  let configured = true;
  if (!readAdmin()) {
    const salt = randomHex(16); const hash = await deriveHash("0123456789", salt);
    window.localStorage.setItem(CRED_KEY, JSON.stringify({ username: "schooladmin", role: "library-admin", hash: `${salt}:${hash}`, active: true }));
    configured = false;
  }
  const studentSalt = randomHex(16); const studentHash = await deriveHash(SHARED_STUDENT_PASSWORD, studentSalt);
  window.localStorage.setItem(STUDENT_CRED_KEY, JSON.stringify([{ username: SHARED_STUDENT_USERNAME, role: "student", active: true, hash: `${studentSalt}:${studentHash}` }]));
  return configured;
}
export async function verifyLogin(username: string, password: string): Promise<boolean> { return Boolean(await authenticate(username, password)); }
export async function authenticate(username: string, password: string): Promise<WebUser | null> {
  const normalized = username.trim().toLowerCase();
  const credential = [readAdmin(), ...readStudents()].find((item) => item?.username.toLowerCase() === normalized && item.active !== false);
  return credential && await matches(password, credential) ? { username: credential.username, role: credential.role, fullName: credential.fullName, studentNumber: credential.studentNumber, active: credential.active } : null;
}
export function getSharedStudentCredentials(): WebUser & { password: string } {
  return { username: SHARED_STUDENT_USERNAME, password: SHARED_STUDENT_PASSWORD, role: "student" };
}
export function isAuthenticated(): boolean { return Boolean(window.localStorage.getItem(SESSION_KEY)); }
export function getSessionUser(): WebUser | null { try { const raw = window.localStorage.getItem(SESSION_USER_KEY); return raw ? JSON.parse(raw) as WebUser : null; } catch { return null; } }
export function createSession(user: WebUser = { username: "schooladmin", role: "library-admin" }): void { window.localStorage.setItem(SESSION_KEY, randomHex(24)); window.localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user)); }
export function logout(): void { window.localStorage.removeItem(SESSION_KEY); window.localStorage.removeItem(SESSION_USER_KEY); }
export async function changeCredentials(currentPassword: string, newUsername: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const credentials = readAdmin(); if (!credentials) return { ok: false, error: "No admin account configured" }; if (!(await matches(currentPassword, credentials))) return { ok: false, error: "Current password is incorrect" };
  const username = newUsername.trim(); if (!username) return { ok: false, error: "New username is required" }; if (newPassword.length < 10) return { ok: false, error: "New password must be at least 10 characters" };
  const salt = randomHex(16); const hash = await deriveHash(newPassword, salt); window.localStorage.setItem(CRED_KEY, JSON.stringify({ ...credentials, username, hash: `${salt}:${hash}` })); return { ok: true };
}
export function isSeeded(): boolean { return window.localStorage.getItem(SEED_FLAG_KEY) === "true"; }
export function markSeeded(): void { window.localStorage.setItem(SEED_FLAG_KEY, "true"); }

