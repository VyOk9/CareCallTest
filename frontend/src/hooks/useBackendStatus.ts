import { useEffect } from "react";
import type { Mode } from "@/lib/types";
import { getBackendStatus } from "@/lib/api";

export function useBackendStatus(params: {
  setConnected: (v: boolean) => void;
  setMode: (m: Mode) => void;
  setStatus: (s: string) => void;
  setError: (e: string | null) => void;
}) {
  const { setConnected, setMode, setStatus, setError } = params;

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await getBackendStatus();
        if (!alive) return;

        if (data.connected) {
          setConnected(true);
          const m: Mode = data.mode === "write" ? "write" : "read";
          setMode(m);
          setStatus(`Connecté (${m})`);
        } else {
          setConnected(false);
          setStatus("Déconnecté");
        }
      } catch (e: any) {
        if (!alive) return;
        setConnected(false);
        setStatus("Déconnecté");
        setError(e?.message ?? String(e));
      }
    })();

    return () => {
      alive = false;
    };
  }, [setConnected, setMode, setStatus, setError]);
}
