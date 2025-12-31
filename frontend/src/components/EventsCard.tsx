import { useMemo, useState } from "react";
import type { EventItem, Mode } from "@/lib/types";
import { formatDate, shortId } from "@/lib/utils";
import { copyText } from "@/components/copy";
import { getPublicEnv } from "@/lib/env";
import { createEvent, updateEvent, syncInit } from "@/lib/api";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import { Calendar, Clock, Copy, MapPin, Plus, Pencil } from "lucide-react";

type Props = {
  events: EventItem[];
  busy: boolean;
  query: string;
  setQuery: (v: string) => void;
  mode: Mode; // ✅ on reçoit le mode pour autoriser write
  onRefresh: () => void; // ✅ pour recharger après create/update (syncInit)
};

export function EventsCard({ events, busy, query, setQuery, mode, onRefresh }: Props) {
  const env = getPublicEnv();
  const canWrite = mode === "write";

  // Create form state (simple)
  const [creating, setCreating] = useState(false);
  const [cTitle, setCTitle] = useState("Nouveau RDV");
  const [cLocation, setCLocation] = useState("Paris");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");

  // Rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

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

  function toIso(local: string) {
    // datetime-local => ISO (UTC)
    return new Date(local).toISOString();
  }

  async function handleCreate() {
    if (!canWrite) {
      toast.error("Mode lecture", { description: "Reconnecte-toi en mode ÉCRITURE pour créer." });
      return;
    }
    if (!cStart || !cEnd) {
      toast.error("Dates manquantes", { description: "Renseigne une date de début et de fin." });
      return;
    }

    try {
      setCreating(true);
      await createEvent({
        summary: cTitle,
        location: cLocation,
        startIso: toIso(cStart),
        endIso: toIso(cEnd),
      });

      toast.success("Événement créé");
      onRefresh();
      setCStart("");
      setCEnd("");
    } catch (e: any) {
      toast.error("Création impossible", { description: e?.message ?? String(e) });
    } finally {
      setCreating(false);
    }
  }

  async function handleRename(id: string) {
    if (!canWrite) {
      toast.error("Mode lecture", { description: "Reconnecte-toi en mode ÉCRITURE pour modifier." });
      return;
    }
    if (!newTitle.trim()) {
      toast.error("Titre vide", { description: "Entre un nouveau titre." });
      return;
    }

    try {
      await updateEvent(id, { summary: newTitle.trim() });
      toast.success("Événement modifié");
      setEditingId(null);
      setNewTitle("");
      onRefresh();
    } catch (e: any) {
      toast.error("Modification impossible", { description: e?.message ?? String(e) });
    }
  }

  return (
    <Card className="rounded-2xl shadow-sm lg:col-span-2">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle>Prochains événements</CardTitle>
            <CardDescription>
              {events.length > 0 ? `${filtered.length} / ${events.length} affiché(s).` : "Aucun événement chargé."}
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

        {/* ✅ Zone create (uniquement en write) */}
        {canWrite ? (
          <div className="rounded-2xl border bg-card p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">Créer un événement</div>
              <Badge variant="secondary">Écriture</Badge>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <Input value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="Titre" className="rounded-xl" />
              <Input value={cLocation} onChange={(e) => setCLocation(e.target.value)} placeholder="Lieu" className="rounded-xl" />
              <Input type="datetime-local" value={cStart} onChange={(e) => setCStart(e.target.value)} className="rounded-xl" />
              <Input type="datetime-local" value={cEnd} onChange={(e) => setCEnd(e.target.value)} className="rounded-xl" />
            </div>

            <div className="mt-3">
              <Button onClick={handleCreate} disabled={creating || busy} className="rounded-xl gap-2">
                <Plus className="h-4 w-4" />
                {creating ? "Création…" : "Créer"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground">
            Pour <b>créer / modifier</b>, reconnecte-toi en mode <b>Écriture</b>.
          </div>
        )}
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
              <p className="text-xs text-muted-foreground">Charge tes événements ou ajuste la recherche.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ev) => {
              const start = ev.start?.dateTime ?? ev.start?.date;
              const end = ev.end?.dateTime ?? ev.end?.date;
              const isEditing = editingId === ev.id;

              return (
                <div key={ev.id} className="group rounded-2xl border bg-card p-4 transition hover:bg-accent/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold">{ev.summary ?? "(Sans titre)"}</p>

                        {ev.location ? (
                          <Badge variant="secondary" className="max-w-full truncate gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {ev.location}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Sans lieu</Badge>
                        )}

                        {canWrite && (
                          <Badge variant="outline" className="gap-1">
                            <Pencil className="h-3.5 w-3.5" />
                            Modifiable
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium text-foreground/80">{formatDate(start)}</span> →{" "}
                          <span className="font-medium text-foreground/80">{formatDate(end)}</span>
                        </span>
                      </div>

                      {/* ✅ inline rename */}
                      {isEditing && (
                        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
                          <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Nouveau titre…"
                            className="rounded-xl"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleRename(ev.id)}
                              className="rounded-xl"
                              disabled={!canWrite}
                            >
                              Enregistrer
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingId(null);
                                setNewTitle("");
                              }}
                              className="rounded-xl"
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <code className="hidden rounded-lg bg-muted px-2 py-1 text-xs md:inline">{shortId(ev.id)}</code>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-xl opacity-70 transition group-hover:opacity-100"
                        onClick={() => copyText(ev.id)}
                        title="Copier l’ID"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>

                      {canWrite && !isEditing && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-xl opacity-70 transition group-hover:opacity-100"
                          onClick={() => {
                            setEditingId(ev.id);
                            setNewTitle(ev.summary ?? "");
                          }}
                          title="Renommer"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
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
