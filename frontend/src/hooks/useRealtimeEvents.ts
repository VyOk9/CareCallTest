import { useEffect, useRef, useState } from "react";
import type { EventItem } from "@/lib/types";
import { syncChanges, syncInit } from "@/lib/api";

function mergeEvents(base: EventItem[], incoming: EventItem[]) {
  const map = new Map<string, any>();
  for (const e of base) map.set(e.id, e);

  for (const e of incoming as any[]) {
    // Google renvoie parfois status:"cancelled" lors des changes
    if (e?.status === "cancelled") {
      map.delete(e.id);
    } else {
      map.set(e.id, { ...(map.get(e.id) ?? {}), ...e });
    }
  }

  return Array.from(map.values()) as EventItem[];
}

export function useRealtimeEvents(enabled: boolean, intervalMs = 10_000) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  // init
  useEffect(() => {
    if (!enabled) return;

    let alive = true;

    (async () => {
      try {
        setBusy(true);
        const { items } = await syncInit();
        if (!alive) return;
        setEvents(items);
        started.current = true;
      } finally {
        if (alive) setBusy(false);
      }
    })();

    return () => {
      alive = false;
      started.current = false;
    };
  }, [enabled]);

  // poll changes
  useEffect(() => {
    if (!enabled) return;
    if (!started.current) return;

    const id = setInterval(async () => {
      try {
        const { items } = await syncChanges();
        if (items.length) {
          setEvents((prev) => mergeEvents(prev, items));
        }
      } catch (e: any) {
        const msg = e?.message ?? String(e);

        // si syncToken expiré, on ré-init
        if (msg.includes("HTTP 410")) {
          try {
            const { items } = await syncInit();
            setEvents(items);
          } catch {
            // ignore
          }
        }
      }
    }, intervalMs);

    return () => clearInterval(id);
  }, [enabled, intervalMs]);

  return { events, busy };
}
