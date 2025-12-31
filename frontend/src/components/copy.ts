import { toast } from "sonner";

export async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Copié", {
      description: value.length > 60 ? "Valeur copiée dans le presse-papiers." : value,
    });
  } catch {
    toast.error("Copie impossible", {
      description: "Le navigateur bloque l’accès au presse-papiers.",
    });
  }
}
