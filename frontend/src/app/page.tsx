"use client";

import { useState } from "react";
import type { Mode } from "@/lib/types";

import { HeaderBar } from "@/components/HeaderBar";
import { ConnectionCard } from "@/components/ConnectionCard";
import { EventsCard } from "@/components/EventsCard";
import { ErrorCard } from "@/components/ErrorCard";

import { useOAuthReturn } from "@/hooks/useOAuthReturn";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import { useBackendStatus } from "@/hooks/useBackendStatus";

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("read");
  const [status, setStatus] = useState("Déconnecté");
  const [error, setError] = useState<string | null>(null);

  // ✅ vrai état de connexion (pas basé sur une string)
  const [connected, setConnected] = useState(false);

  // ✅ Au refresh de page, on demande au backend s'il a une session/tokens
  useBackendStatus({
    setConnected,
    setMode,
    setStatus,
    setError,
  });

  const { events, busy } = useRealtimeEvents(connected, 10_000);
  const [query, setQuery] = useState("");

  // ✅ Retour OAuth (quand Google renvoie ?code=...)
  useOAuthReturn({
    setStatus,
    setMode,
    onConnected: () => {
      setConnected(true);
      setError(null);
    },
    onError: (msg) => {
      setConnected(false);
      setError(msg);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <HeaderBar status={status} isConnected={connected} />

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <aside className="space-y-6 lg:col-span-1">
            <ConnectionCard
              mode={mode}
              setMode={setMode}
              busy={busy}
              isConnected={connected}
              onLoggedOut={() => {
                setConnected(false);
                setStatus("Déconnecté");
                setError(null);
              }}
            />

            {error && <ErrorCard error={error} />}
          </aside>

          <section className="lg:col-span-2">
            <EventsCard
              events={events}
              busy={busy}
              query={query}
              setQuery={setQuery}
              mode={mode}
              onRefresh={() => {
                // Réinit sync pour refresh immédiat après create/update
                // (sinon le polling récupère au prochain tick)
                // => on force un refresh instantané:
                // tu peux juste attendre 10s sinon
              }}
            />

          </section>
        </div>
      </main>
    </div>
  );
}
