import { useMemo, useState } from "react";
import type { EventItem } from "@/lib/types";
import { fetchEvents } from "@/lib/api";
import { toast } from "sonner";

export function useEvents(setStatus: (s: string | ((prev: string) => string)) => void, setError: (e: string | null) => void) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => {
      const title = (e.summary ?? "").toLowerCase();
      const loc = (e.location ?? "").toLowerCase();
      return title.includes(q) || loc.includes(q) || e.id.toLowerCase().includes(q);
    });
  }, [events, query]);

  async function loadEvents() {
    try {
      setBusy(true);
      setError(null);

      const items = await fetchEvents();
      setEvents(items);
      setStatus((s: any) => (typeof s === "string" && s.startsWith("Connecté") ? s : "Événements chargés"));

      toast.success("Événements chargés", {
        description: `${items.length} événement(s) récupéré(s).`,
      });
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setStatus("Erreur événements");
      setError(msg);
      toast.error("Chargement impossible", { description: msg });
    } finally {
      setBusy(false);
    }
  }

  return { events, filtered, busy, query, setQuery, loadEvents };
}
