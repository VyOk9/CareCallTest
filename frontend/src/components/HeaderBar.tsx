import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Loader2, Shield, ShieldCheck, XCircle } from "lucide-react";
import { isConnected, statusVariant } from "@/lib/utils";

export function HeaderBar({ status }: { status: string }) {
  const v = statusVariant(status);
  const icon =
    v === "destructive" ? (
      <XCircle className="h-4 w-4" />
    ) : v === "default" ? (
      <CheckCircle2 className="h-4 w-4" />
    ) : v === "secondary" ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      <Shield className="h-4 w-4" />
    );

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Google Calendar</h1>
            <p className="text-sm text-muted-foreground">OAuth (lecture/écriture) + listing des prochains événements.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={v} className="gap-2">
          {icon}
          {status}
        </Badge>
        {isConnected(status) ? (
          <Badge variant="outline" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Session active
          </Badge>
        ) : (
          <Badge variant="outline">Non connecté</Badge>
        )}
      </div>
    </div>
  );
}
