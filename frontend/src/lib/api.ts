import type { Mode, EventItem } from "./types";
import { getPublicEnv } from "./env";

function backendFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, {
    ...init,
    credentials: "include", // ✅ envoie/reçoit le cookie de session
  });
}

/* ================== OAUTH ================== */
export async function exchangeCode(code: string, mode: Mode): Promise<{ ok: true; hasRefreshToken: boolean }> {
  const env = getPublicEnv();
  if (!env.backendUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL manquant");

  const res = await backendFetch(`${env.backendUrl}/auth/google/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, mode }),
  });

  const txt = await res.text();
  if (!res.ok) throw new Error(`Exchange failed (${res.status}): ${txt}`);
  return JSON.parse(txt);
}

/* ================== EVENTS ================== */
export async function fetchEvents(): Promise<EventItem[]> {
  const env = getPublicEnv();
  if (!env.backendUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL manquant");

  const res = await backendFetch(`${env.backendUrl}/calendar/events`);
  const txt = await res.text();
  if (!res.ok) throw new Error(`Events failed (${res.status}): ${txt}`);
  const data = JSON.parse(txt);
  return data.items ?? [];
}

/* ================== REALTIME (SYNC) ================== */
export async function syncInit(): Promise<{ items: EventItem[] }> {
  const env = getPublicEnv();
  if (!env.backendUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL manquant");

  const res = await backendFetch(`${env.backendUrl}/calendar/sync/init`);
  const txt = await res.text();
  if (!res.ok) throw new Error(`sync/init failed (${res.status}): ${txt}`);
  const data = JSON.parse(txt);
  return { items: data.items ?? [] };
}

export async function syncChanges(): Promise<{ items: EventItem[] }> {
  const env = getPublicEnv();
  if (!env.backendUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL manquant");

  const res = await backendFetch(`${env.backendUrl}/calendar/sync/changes`);
  const txt = await res.text();
  if (!res.ok) throw new Error(`sync/changes failed (${res.status}): ${txt}`);
  const data = JSON.parse(txt);
  return { items: data.items ?? [] };
}

export async function logout() {
  const env = getPublicEnv();
  if (!env.backendUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL manquant");
  await backendFetch(`${env.backendUrl}/calendar/logout`, { method: "POST" });
}

export async function getBackendStatus(): Promise<{ connected: boolean; mode: "read" | "write" | null }> {
  const env = getPublicEnv();
  if (!env.backendUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL manquant");

  const res = await backendFetch(`${env.backendUrl}/calendar/status`);
  const txt = await res.text();
  if (!res.ok) throw new Error(`status failed (${res.status}): ${txt}`);
  return JSON.parse(txt);
}

export async function createEvent(body: {
  summary: string;
  description?: string;
  location?: string;
  startIso: string;
  endIso: string;
}): Promise<EventItem> {
  const env = getPublicEnv();
  if (!env.backendUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL manquant");

  const res = await backendFetch(`${env.backendUrl}/calendar/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const txt = await res.text();
  if (!res.ok) throw new Error(`Create failed (${res.status}): ${txt}`);
  return JSON.parse(txt);
}

export async function updateEvent(
  id: string,
  body: { summary?: string; description?: string; location?: string; startIso?: string; endIso?: string }
): Promise<EventItem> {
  const env = getPublicEnv();
  if (!env.backendUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL manquant");

  const res = await backendFetch(`${env.backendUrl}/calendar/events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const txt = await res.text();
  if (!res.ok) throw new Error(`Update failed (${res.status}): ${txt}`);
  return JSON.parse(txt);
}
