import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export function ErrorCard({ error }: { error: string }) {
  return (
    <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <XCircle className="h-5 w-5" />
          Erreur
        </CardTitle>
        <CardDescription className="text-destructive/80">
          Détails techniques.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap break-words rounded-xl bg-background/60 p-3 text-xs leading-relaxed">
          {error}
        </pre>
      </CardContent>
    </Card>
  );
}
