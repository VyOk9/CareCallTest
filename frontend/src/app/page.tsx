"use client";

import { useState } from "react";
import type { Mode } from "@/lib/types";

import { HeaderBar } from "@/components/HeaderBar";
import { ConnectionCard } from "@/components/ConnectionCard";
import { EventsCard } from "@/components/EventsCard";
import { ErrorCard } from "@/components/ErrorCard";

import { useOAuthReturn } from "@/hooks/useOAuthReturn";
import { useEvents } from "@/hooks/useEvents";

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("read");
  const [status, setStatus] = useState("Déconnecté");
  const [error, setError] = useState<string | null>(null);

  const { events, busy, query, setQuery, loadEvents } = useEvents(setStatus, setError);

  useOAuthReturn({
    setStatus,
    setMode,
    onConnected: () => {
      // optionnel: auto-load events après connexion
      // loadEvents();
    },
    onError: setError,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <HeaderBar status={status} />

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <aside className="space-y-6 lg:col-span-1">
            <ConnectionCard
              mode={mode}
              setMode={setMode}
              busy={busy}
              loadEvents={loadEvents}
            />

            {error && <ErrorCard error={error} />}
          </aside>

          <section className="lg:col-span-2">
            <EventsCard
              events={events}
              busy={busy}
              query={query}
              setQuery={setQuery}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
