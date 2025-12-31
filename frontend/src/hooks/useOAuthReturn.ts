import { useEffect } from "react";
import type { Mode } from "@/lib/types";
import { exchangeCode } from "@/lib/api";
import { cleanupOAuthParams, parseOAuthReturn } from "@/lib/googleAuth";
import { toast } from "sonner";

type Params = {
  onConnected: (mode: Mode, hasRefreshToken: boolean) => void;
  onError: (msg: string) => void;
  setStatus: (s: string) => void;
  setMode: (m: Mode) => void;
};

export function useOAuthReturn({ onConnected, onError, setStatus, setMode }: Params) {
  useEffect(() => {
    const { code, oauthError, modeFromState, url } = parseOAuthReturn(window.location.href);

    if (oauthError) {
      setStatus("Erreur OAuth");
      onError(`Erreur OAuth: ${oauthError}`);
      return;
    }
    if (!code) return;

    (async () => {
      try {
        setStatus("Échange du code…");

        const data = await exchangeCode(code, modeFromState);

        setMode(modeFromState);
        setStatus(data.hasRefreshToken ? `Connecté (${modeFromState}, refresh OK)` : `Connecté (${modeFromState})`);

        toast.success("Connexion réussie", {
          description: `Mode ${modeFromState.toUpperCase()} activé.`,
        });

        cleanupOAuthParams(url);
        onConnected(modeFromState, data.hasRefreshToken);
      } catch (e: any) {
        setStatus("Erreur échange");
        const msg = e?.message ?? String(e);
        onError(msg);
        toast.error("Connexion échouée", { description: msg });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
