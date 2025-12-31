import { useMemo } from "react";
import type { EventItem } from "@/lib/types";
import { formatDate, shortId } from "@/lib/utils";
import { copyText } from "@/components/copy";
import { getPublicEnv } from "@/lib/env";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import { Calendar, Clock, Copy, MapPin } from "lucide-react";

type Props = {
  events: EventItem[];
  busy: boolean;
  query: string;
  setQuery: (v: string) => void;
};

export function EventsCard({ events, busy, query, setQuery }: Props) {
  const env = getPublicEnv();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => {
      const title = (e.summary ?? "").toLowerCase();
      const loc = (e.location ?? "").toLowerCase();
      return title.includes(q) || loc.includes(q) || e.id.toLowerCase().includes(q);
    });
  }, [events, query]);

  const clientIdShort = env.clientId ? `${env.clientId.slice(0, 10)}…` : "—";

  return (
    <Card className="rounded-2xl shadow-sm lg:col-span-2">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle>Prochains événements</CardTitle>
            <CardDescription>
              {events.length > 0
                ? `${filtered.length} / ${events.length} affiché(s).`
                : "Aucun événement chargé."}
            </CardDescription>
          </div>

          <div className="w-full md:w-80">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher (titre, lieu, id)…"
              className="rounded-xl"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {busy && events.length === 0 ? (
          <div className="space-y-3">
            <div className="h-16 w-full animate-pulse rounded-2xl bg-muted" />
            <div className="h-16 w-full animate-pulse rounded-2xl bg-muted" />
            <div className="h-16 w-full animate-pulse rounded-2xl bg-muted" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed p-10 text-center">
            <div className="space-y-2">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Aucun résultat</p>
              <p className="text-xs text-muted-foreground">
                Charge tes événements ou ajuste la recherche.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ev) => {
              const start = ev.start?.dateTime ?? ev.start?.date;
              const end = ev.end?.dateTime ?? ev.end?.date;

              return (
                <div
                  key={ev.id}
                  className="group rounded-2xl border bg-card p-4 transition hover:bg-accent/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold">
                          {ev.summary ?? "(Sans titre)"}
                        </p>

                        {ev.location ? (
                          <Badge variant="secondary" className="max-w-full truncate gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {ev.location}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Sans lieu</Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium text-foreground/80">
                            {formatDate(start)}
                          </span>{" "}
                          →{" "}
                          <span className="font-medium text-foreground/80">
                            {formatDate(end)}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <code className="hidden rounded-lg bg-muted px-2 py-1 text-xs md:inline">
                        {shortId(ev.id)}
                      </code>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-xl opacity-70 transition group-hover:opacity-100"
                        onClick={() => copyText(ev.id)}
                        title="Copier l’ID"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Separator className="my-6" />

        <div className="grid gap-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <span>Backend :</span>
            <code className="rounded bg-muted px-1 py-0.5">{env.backendUrl ?? "—"}</code>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span>Client ID :</span>
            <code className="rounded bg-muted px-1 py-0.5">{clientIdShort}</code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
