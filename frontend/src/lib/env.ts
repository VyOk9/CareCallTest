import type { Mode } from "./types";

export type PublicEnv = {
  clientId?: string;
  redirectUri?: string;
  backendUrl?: string;
  scopeWrite?: string;
  scopeRead?: string;
};

export function getPublicEnv(): PublicEnv {
  // NEXT_PUBLIC_* est disponible côté client, mais on évite de throw au chargement du module
  return {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
    scopeWrite: process.env.NEXT_PUBLIC_GOOGLE_SCOPE_WRITE,
    scopeRead: process.env.NEXT_PUBLIC_GOOGLE_SCOPE_READ,
  };
}

export function scopeFor(mode: Mode): string | undefined {
  const env = getPublicEnv();
  return mode === "write" ? env.scopeWrite : env.scopeRead;
}

export function assertEnv(env: PublicEnv): asserts env is Required<PublicEnv> {
  const missing = Object.entries(env)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length) {
    throw new Error(`Variables NEXT_PUBLIC_* manquantes: ${missing.join(", ")}`);
  }
}
