import type { Mode, EventItem } from "./types";
import { getPublicEnv } from "./env";

export async function exchangeCode(code: string, mode: Mode): Promise<{ ok: true; hasRefreshToken: boolean }> {
  const env = getPublicEnv();
  if (!env.backendUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL manquant");

  const res = await fetch(`${env.backendUrl}/auth/google/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, mode }),
  });

  const txt = await res.text();
  if (!res.ok) throw new Error(`Exchange failed (${res.status}): ${txt}`);
  return JSON.parse(txt);
}

export async function fetchEvents(): Promise<EventItem[]> {
  const env = getPublicEnv();
  if (!env.backendUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL manquant");

  const res = await fetch(`${env.backendUrl}/calendar/events`);
  const txt = await res.text();
  if (!res.ok) throw new Error(`Events failed (${res.status}): ${txt}`);
  const data = JSON.parse(txt);
  return data.items ?? [];
}
