const STORAGE_KEY = "al-bassam:subject-catalog";

export const DEFAULT_SUBJECTS = [
  "Mathematics",
  "Arabic",
  "English",
  "Science",
  "Social Studies",
  "Islamic Studies",
  "Computer Science",
  "Physical Education",
  "Art",
  "Music",
];

let memoryCatalog: string[] | null = null;

function readStorage(): string[] {
  if (typeof window === "undefined") return [...DEFAULT_SUBJECTS];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_SUBJECTS];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...DEFAULT_SUBJECTS];
  } catch {
    return [...DEFAULT_SUBJECTS];
  }
}

function writeStorage(catalog: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
  } catch {
    // ignore quota / availability errors
  }
}

export function getSubjectCatalog(): string[] {
  if (memoryCatalog) return [...memoryCatalog];
  memoryCatalog = readStorage();
  return [...memoryCatalog];
}

export function addSubjectToCatalog(subject: string): string[] {
  const trimmed = subject.trim();
  if (!trimmed) return getSubjectCatalog();
  const catalog = getSubjectCatalog();
  if (catalog.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
    return catalog;
  }
  memoryCatalog = [...catalog, trimmed];
  writeStorage(memoryCatalog);
  return [...memoryCatalog];
}
