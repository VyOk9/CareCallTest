import type { Mode } from "./types";
import { getPublicEnv, scopeFor } from "./env";

export function buildGoogleAuthUrl(mode: Mode) {
  const env = getPublicEnv();
  const scope = scopeFor(mode);

  if (!env.clientId || !env.redirectUri || !scope) return "";

  const params = new URLSearchParams({
    client_id: env.clientId,
    redirect_uri: env.redirectUri, // fidèle doc : racine
    response_type: "code",
    scope,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: JSON.stringify({ mode }),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function parseOAuthReturn(locationHref: string): {
  code?: string;
  oauthError?: string;
  modeFromState: Mode;
  url: URL;
} {
  const url = new URL(locationHref);
  const code = url.searchParams.get("code") ?? undefined;
  const oauthError = url.searchParams.get("error") ?? undefined;
  const state = url.searchParams.get("state");

  let modeFromState: Mode = "read";
  try {
    if (state) {
      const parsed = JSON.parse(state);
      modeFromState = parsed?.mode === "write" ? "write" : "read";
    }
  } catch {
    modeFromState = "read";
  }

  return { code, oauthError, modeFromState, url };
}

/** ✅ AJOUTE CET EXPORT (c’est celui que ton hook attend) */
export function cleanupOAuthParams(url: URL) {
  ["code", "scope", "authuser", "prompt", "hd", "state"].forEach((k) => url.searchParams.delete(k));
  window.history.replaceState({}, "", url.toString());
}
