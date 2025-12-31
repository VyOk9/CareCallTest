import type { Mode } from "@/lib/types";
import { getPublicEnv, scopeFor } from "@/lib/env";
import { buildGoogleAuthUrl } from "@/lib/googleAuth";
import { copyText } from "@/components/copy";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { ExternalLink, Shield, ShieldCheck, LogOut, Copy } from "lucide-react";

export function ConnectionCard({
  mode,
  setMode,
  busy,
  isConnected,
  onLoggedOut,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  busy: boolean;
  isConnected: boolean;
  onLoggedOut: () => void;
}) {
  const env = getPublicEnv();
  const authUrl = buildGoogleAuthUrl(mode);
  const scope = scopeFor(mode);

  const missing =
    !env.clientId || !env.redirectUri || !env.backendUrl || !env.scopeRead || !env.scopeWrite;

  async function logout() {
    if (!env.backendUrl) return;

    try {
      await fetch(`${env.backendUrl}/calendar/logout`, { method: "POST" });
    } finally {
      // reset UI côté front
      onLoggedOut();
    }
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <span className="text-lg font-semibold">Connexion Google</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {isConnected
            ? "Connecté. Synchronisation automatique active."
            : "Choisis le mode puis lance l’authentification OAuth Google Calendar."}
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {missing && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <div className="font-semibold text-destructive">Configuration manquante</div>
            <div className="text-destructive/80">
              Vérifie <code className="rounded bg-muted px-1">.env.local</code> puis redémarre{" "}
              <code className="rounded bg-muted px-1">npm run dev</code>.
            </div>
          </div>
        )}

        {/* MODE */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Mode OAuth</div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={mode === "read" ? "default" : "outline"}
              onClick={() => setMode("read")}
              disabled={isConnected}
              className="gap-2 rounded-xl"
              title={isConnected ? "Déconnecte-toi pour changer le mode" : undefined}
            >
              <Shield className="h-4 w-4" />
              Lecture
            </Button>
            <Button
              variant={mode === "write" ? "default" : "outline"}
              onClick={() => setMode("write")}
              disabled={isConnected}
              className="gap-2 rounded-xl"
              title={isConnected ? "Déconnecte-toi pour changer le mode" : undefined}
            >
              <ShieldCheck className="h-4 w-4" />
              Écriture
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Scope utilisé :
            <code className="ml-1 rounded bg-muted px-1 py-0.5">{scope ?? "—"}</code>
          </div>
        </div>

        {/* ACTIONS */}
        {!isConnected ? (
          <Button asChild disabled={missing || !authUrl || busy} className="w-full rounded-xl">
            <a
              href={authUrl || "#"}
              onClick={(e) => (missing ? e.preventDefault() : undefined)}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Se connecter avec Google ({mode})
            </a>
          </Button>
        ) : (
          <Button
            variant="destructive"
            className="w-full rounded-xl gap-2"
            onClick={logout}
            disabled={busy}
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </Button>
        )}

        <Separator />

        {/* REDIRECT URI */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Redirect URI</div>
          <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2">
            <code className="block w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs">
              {env.redirectUri ?? "—"}
            </code>
            <Button
              size="icon"
              variant="ghost"
              className="shrink-0 rounded-lg"
              onClick={() => env.redirectUri && copyText(env.redirectUri)}
              disabled={!env.redirectUri}
              title="Copier"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
