import { useEffect, useRef, useState } from "react";
import type { EventItem } from "@/lib/types";
import { syncChanges, syncInit } from "@/lib/api";

function mergeEvents(base: EventItem[], incoming: EventItem[]) {
  const map = new Map<string, any>();
  for (const e of base) map.set(e.id, e);

  for (const e of incoming as any[]) {
    if (e?.status === "cancelled") map.delete(e.id);
    else map.set(e.id, { ...(map.get(e.id) ?? {}), ...e });
  }
  return Array.from(map.values()) as EventItem[];
}

export function useRealtimeEvents(enabled: boolean, intervalMs = 10_000) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [busy, setBusy] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);

  // INIT + démarre polling
  useEffect(() => {
    if (!enabled) return;

    let alive = true;

    async function start() {
      try {
        setBusy(true);
        const { items } = await syncInit();
        if (!alive) return;
        setEvents(items);
      } finally {
        if (alive) setBusy(false);
      }

      // ⏱️ démarre polling APRES init
      if (timer.current) clearInterval(timer.current);
      timer.current = setInterval(async () => {
        try {
          const { items } = await syncChanges();
          if (items.length) setEvents((prev) => mergeEvents(prev, items));
        } catch {}
      }, intervalMs);
    }

    start();

    return () => {
      alive = false;
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
  }, [enabled, intervalMs]);

  return { events, busy };
}
