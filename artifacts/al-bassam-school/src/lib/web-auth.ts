const CRED_KEY = "al-bassam:web-admin";
const SESSION_KEY = "al-bassam:web-session";
const SEED_FLAG_KEY = "al-bassam:web-seeded";

const PBKDF2_ITERATIONS = 100000;

function randomHex(bytes: number): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function deriveHash(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  return Array.from(new Uint8Array(bits))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

type Credentials = {
  username: string;
  hash: string;
};

function readCredentials(): Credentials | null {
  try {
    const raw = window.localStorage.getItem(CRED_KEY);
    return raw ? (JSON.parse(raw) as Credentials) : null;
  } catch {
    return null;
  }
}

/**
 * Ensure default admin credentials exist so the login screen is always
 * ready. On the very first run the account is schooladmin / 0123456789.
 * Returns true if credentials already existed, false if just seeded.
 */
export async function ensureCredentials(): Promise<boolean> {
  if (readCredentials()) return true;
  const salt = randomHex(16);
  const hash = await deriveHash("0123456789", salt);
  window.localStorage.setItem(
    CRED_KEY,
    JSON.stringify({ username: "schooladmin", hash: `${salt}:${hash}` }),
  );
  return false;
}

export async function verifyLogin(
  username: string,
  password: string,
): Promise<boolean> {
  const credentials = readCredentials();
  if (!credentials) return false;
  if (credentials.username !== username.trim()) return false;
  const [salt, expected] = credentials.hash.split(":");
  if (!salt || !expected) return false;
  const hash = await deriveHash(password, salt);
  // constant-time-ish comparison
  if (hash.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) {
    diff |= hash.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export function isAuthenticated(): boolean {
  return Boolean(window.localStorage.getItem(SESSION_KEY));
}

export function createSession(): void {
  window.localStorage.setItem(SESSION_KEY, randomHex(24));
}

export function logout(): void {
  window.localStorage.removeItem(SESSION_KEY);
}

export async function changeCredentials(
  currentPassword: string,
  newUsername: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  const credentials = readCredentials();
  if (!credentials) return { ok: false, error: "No admin account configured" };
  if (!(await verifyLogin(credentials.username, currentPassword))) {
    return { ok: false, error: "Current password is incorrect" };
  }
  const username = newUsername.trim();
  if (!username) return { ok: false, error: "New username is required" };
  if (newPassword.length < 10) {
    return { ok: false, error: "New password must be at least 10 characters" };
  }
  const salt = randomHex(16);
  const hash = await deriveHash(newPassword, salt);
  window.localStorage.setItem(
    CRED_KEY,
    JSON.stringify({ username, hash: `${salt}:${hash}` }),
  );
  return { ok: true };
}

export function isSeeded(): boolean {
  return window.localStorage.getItem(SEED_FLAG_KEY) === "true";
}

export function markSeeded(): void {
  window.localStorage.setItem(SEED_FLAG_KEY, "true");
}
