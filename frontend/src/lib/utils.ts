import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function isConnected(status: string) {
  return status.toLowerCase().includes("connecté");
}

export function shortId(id: string) {
  if (!id) return "—";
  if (id.length <= 12) return id;
  return `${id.slice(0, 7)}…${id.slice(-4)}`;
}

export function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const s = status.toLowerCase();
  if (s.includes("erreur")) return "destructive";
  if (s.includes("connecté")) return "default";
  if (s.includes("charg") || s.includes("échange")) return "secondary";
  return "outline";
}
