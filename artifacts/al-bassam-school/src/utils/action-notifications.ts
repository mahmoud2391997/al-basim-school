export type ActionNotification = {
  id: string;
  type: "action";
  title: string;
  message: string;
  badgeText: string;
  targetPath: string;
  severity: "info";
  date: string;
};

const KEY = "al-bassam-action-notifications";
const EVENT = "al-bassam-action-notification";

export function getActionNotifications(): ActionNotification[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(KEY) || "[]") as ActionNotification[]; } catch { return []; }
}

export function recordActionNotification(title: string, message: string, targetPath = "/") {
  if (typeof window === "undefined") return;
  const item: ActionNotification = { id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, type: "action", title, message, badgeText: "New", targetPath, severity: "info", date: new Date().toISOString() };
  const next = [item, ...getActionNotifications()].slice(0, 50);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: item }));
}

export function subscribeToActionNotifications(listener: (item: ActionNotification) => void) {
  const handler = (event: Event) => listener((event as CustomEvent<ActionNotification>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
