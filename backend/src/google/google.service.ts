import {
  BadGatewayException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

type Mode = "read" | "write";

type TokenStore = {
  mode: Mode;
  access_token: string;
  refresh_token?: string;
  expiry_date?: number; // epoch ms
};

@Injectable()
export class GoogleService {
  private tokens: TokenStore | null = null;
  private refreshing: Promise<void> | null = null;
  private syncToken: string | null = null;


  private get env() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const scopeWrite = process.env.GOOGLE_SCOPE_WRITE;
    const scopeRead = process.env.GOOGLE_SCOPE_READ;

    if (!clientId || !clientSecret || !redirectUri || !scopeWrite || !scopeRead) {
      throw new Error(
        "Env manquantes: GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI + GOOGLE_SCOPE_WRITE/GOOGLE_SCOPE_READ"
      );
    }
    return { clientId, clientSecret, redirectUri, scopeWrite, scopeRead };
  }

  private ensureConnected() {
    if (!this.tokens) throw new UnauthorizedException("Pas de tokens. Connecte-toi d'abord.");
    return this.tokens;
  }

  private requireWrite() {
    const t = this.ensureConnected();
    if (t.mode !== "write") throw new ForbiddenException("Accès insuffisant: reconnecte-toi en mode ÉCRITURE.");
    return t;
  }

  private isExpiredSoon() {
    const t = this.ensureConnected();
    if (!t.expiry_date) return true;
    return Date.now() > t.expiry_date - 60_000;
  }

  private async googleFetch(url: string, init?: RequestInit) {
    const res = await fetch(url, init);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new BadGatewayException(data);
    return data as any;
  }

  async exchangeCode(code: string, mode: Mode) {
    const { clientId, clientSecret, redirectUri } = this.env;

    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const data = await this.googleFetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    this.tokens = {
      mode,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expiry_date: Date.now() + (data.expires_in ?? 3600) * 1000,
    };

    return {
      ok: true,
      mode,
      hasRefreshToken: Boolean(data.refresh_token),
      expiresIn: data.expires_in ?? 3600,
    };
  }

  async refreshIfNeeded() {
    const t = this.ensureConnected();
    if (!this.isExpiredSoon()) return;

    if (!t.refresh_token) {
      throw new Error("Token expiré et pas de refresh_token (relogin nécessaire).");
    }

    if (this.refreshing) {
      await this.refreshing;
      return;
    }

    this.refreshing = (async () => {
      const { clientId, clientSecret } = this.env;

      const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: t.refresh_token!,
        grant_type: "refresh_token",
      });

      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      const data: any = await res.json();
      if (!res.ok) throw new Error(`Refresh error: ${JSON.stringify(data)}`);

      t.access_token = data.access_token;
      t.expiry_date = Date.now() + (data.expires_in ?? 3600) * 1000;
    })();

    try {
      await this.refreshing;
    } finally {
      this.refreshing = null;
    }
  }


  async listUpcomingEvents() {
    const t = this.ensureConnected();
    await this.refreshIfNeeded();

    const timeMin = new Date().toISOString();
    const url =
      "https://www.googleapis.com/calendar/v3/calendars/primary/events" +
      `?maxResults=10&singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}`;

    return this.googleFetch(url, {
      headers: { Authorization: `Bearer ${t.access_token}` },
    });
  }

  async createEvent(event: {
    summary: string;
    description?: string;
    location?: string;
    startIso: string;
    endIso: string;
  }) {
    const t = this.requireWrite();
    await this.refreshIfNeeded();

    const payload = {
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: { dateTime: event.startIso },
      end: { dateTime: event.endIso },
    };

    return this.googleFetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  async updateEvent(
    eventId: string,
    patch: Partial<{
      summary: string;
      description: string;
      location: string;
      startIso: string;
      endIso: string;
    }>
  ) {
    const t = this.requireWrite();
    await this.refreshIfNeeded();

    const payload: any = {};
    if (patch.summary !== undefined) payload.summary = patch.summary;
    if (patch.description !== undefined) payload.description = patch.description;
    if (patch.location !== undefined) payload.location = patch.location;
    if (patch.startIso !== undefined) payload.start = { dateTime: patch.startIso };
    if (patch.endIso !== undefined) payload.end = { dateTime: patch.endIso };

    return this.googleFetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${t.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
  }

  getCurrentMode() {
    return this.tokens?.mode ?? null;
  }

  async initSync() {
    const t = this.ensureConnected();
    await this.refreshIfNeeded();

    const timeMin = new Date().toISOString();
    const url =
      "https://www.googleapis.com/calendar/v3/calendars/primary/events" +
      `?maxResults=50&singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${t.access_token}` },
    });

    const data: any = await res.json();
    if (!res.ok) throw new Error(`Init sync error: ${JSON.stringify(data)}`);

    this.syncToken = data.nextSyncToken ?? null;

    return { items: data.items ?? [], syncToken: this.syncToken };
  }

  async syncChanges() {
    const t = this.ensureConnected();
    await this.refreshIfNeeded();

    if (!this.syncToken) {
      throw new Error("Sync non initialisé. Appelle /calendar/sync/init d'abord.");
    }

    const url =
      "https://www.googleapis.com/calendar/v3/calendars/primary/events" +
      `?syncToken=${encodeURIComponent(this.syncToken)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${t.access_token}` },
    });

    // Google peut renvoyer 410 si le syncToken a expiré
    if (res.status === 410) {
      this.syncToken = null;
      throw new Error("Sync token expiré (HTTP 410). Réinitialise la sync.");
    }

    const data: any = await res.json();
    if (!res.ok) throw new Error(`Sync changes error: ${JSON.stringify(data)}`);

    this.syncToken = data.nextSyncToken ?? this.syncToken;

    return { items: data.items ?? [], syncToken: this.syncToken };
  }

  logout() {
    this.tokens = null;
    this.syncToken = null;
  }

  isConnected() {
    return !!this.tokens?.access_token;
  }

  getMode() {
    return this.tokens?.mode ?? null;
  }


}
