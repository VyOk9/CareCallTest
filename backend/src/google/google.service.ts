import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

export type Mode = "read" | "write";

export type TokenStore = {
  mode: Mode;
  access_token: string;
  refresh_token?: string;
  expiry_date?: number; // epoch ms
};

export type SessionStore = {
  tokens?: TokenStore;
  syncToken?: string | null;
};

@Injectable()
export class GoogleService {
  private refreshing: Promise<void> | null = null;

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

  private ensureConnected(store: SessionStore) {
    if (!store.tokens) throw new UnauthorizedException("Pas de tokens. Connecte-toi d'abord.");
    return store.tokens;
  }

  private requireWrite(store: SessionStore) {
    const t = this.ensureConnected(store);
    if (t.mode !== "write") {
      throw new ForbiddenException("Accès insuffisant: reconnecte-toi en mode ÉCRITURE.");
    }
    return t;
  }

  private isExpiredSoon(t: TokenStore) {
    if (!t.expiry_date) return true;
    return Date.now() > t.expiry_date - 60_000;
  }

  private async googleFetch(url: string, init?: RequestInit) {
    const res = await fetch(url, init);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new BadGatewayException({ url, status: res.status, google: data });
    }
    return data as any;
  }

  /* ================== OAUTH ================== */

  async exchangeCode(store: SessionStore, code: string, mode: Mode) {
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

    store.tokens = {
      mode,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expiry_date: Date.now() + (data.expires_in ?? 3600) * 1000,
    };

    // reset sync à la reconnexion
    store.syncToken = null;

    return {
      ok: true as const,
      mode,
      hasRefreshToken: Boolean(data.refresh_token),
      expiresIn: data.expires_in ?? 3600,
    };
  }

  async refreshIfNeeded(store: SessionStore) {
    const t = this.ensureConnected(store);
    if (!this.isExpiredSoon(t)) return;

    if (!t.refresh_token) {
      throw new UnauthorizedException("Session expirée: reconnecte-toi (refresh_token manquant).");
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

      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new UnauthorizedException({
          message: "Refresh token invalide/expiré: reconnecte-toi.",
          google: data,
          status: res.status,
        });
      }

      t.access_token = data.access_token;
      t.expiry_date = Date.now() + (data.expires_in ?? 3600) * 1000;
    })();

    try {
      await this.refreshing;
    } finally {
      this.refreshing = null;
    }
  }

  /* ================== STATUS ================== */

  getStatus(store: SessionStore) {
    return { connected: Boolean(store.tokens?.access_token), mode: store.tokens?.mode ?? null };
  }

  logout(store: SessionStore) {
    store.tokens = undefined;
    store.syncToken = null;
    return { ok: true };
  }

  /* ================== EVENTS ================== */

  async listUpcomingEvents(store: SessionStore) {
    const t = this.ensureConnected(store);
    await this.refreshIfNeeded(store);

    const timeMin = new Date().toISOString();
    const url =
      "https://www.googleapis.com/calendar/v3/calendars/primary/events" +
      `?maxResults=10&singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}`;

    return this.googleFetch(url, {
      headers: { Authorization: `Bearer ${t.access_token}` },
    });
  }

  async createEvent(
    store: SessionStore,
    event: { summary: string; description?: string; location?: string; startIso: string; endIso: string }
  ) {
    const t = this.requireWrite(store);
    await this.refreshIfNeeded(store);

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
    store: SessionStore,
    eventId: string,
    patch: Partial<{ summary: string; description: string; location: string; startIso: string; endIso: string }>
  ) {
    const t = this.requireWrite(store);
    await this.refreshIfNeeded(store);

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

  /* ================== SYNC ================== */

  async initSync(store: SessionStore) {
    const t = this.ensureConnected(store);
    await this.refreshIfNeeded(store);

    let pageToken: string | undefined = undefined;
    const allItems: any[] = [];
    let nextSyncToken: string | null = null;

    do {
      const url =
        "https://www.googleapis.com/calendar/v3/calendars/primary/events" +
        `?singleEvents=true&showDeleted=true&maxResults=250` +
        (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "");

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${t.access_token}` },
      });

      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new BadGatewayException({ where: "initSync", status: res.status, google: data });
      }

      allItems.push(...(data.items ?? []));
      pageToken = data.nextPageToken;
      if (data.nextSyncToken) nextSyncToken = data.nextSyncToken;
    } while (pageToken);

    if (!nextSyncToken) {
      throw new BadGatewayException({
        where: "initSync",
        message: "Google n'a pas renvoyé nextSyncToken",
      });
    }

    store.syncToken = nextSyncToken;
    return { items: allItems, syncToken: store.syncToken };
  }

  async syncChanges(store: SessionStore) {
    const t = this.ensureConnected(store);
    await this.refreshIfNeeded(store);

    if (!store.syncToken) {
      throw new BadRequestException("Sync non initialisé. Appelle /calendar/sync/init d'abord.");
    }

    const url =
      "https://www.googleapis.com/calendar/v3/calendars/primary/events" +
      `?syncToken=${encodeURIComponent(store.syncToken)}&showDeleted=true`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${t.access_token}` },
    });

    if (res.status === 401) {
      store.tokens = undefined;
      store.syncToken = null;
      throw new UnauthorizedException("Google Unauthorized (401): reconnecte-toi.");
    }

    if (res.status === 410) {
      store.syncToken = null;
      throw new BadRequestException("syncToken expiré/invalide: relance /calendar/sync/init.");
    }

    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new BadGatewayException({ where: "syncChanges", status: res.status, google: data });
    }

    store.syncToken = data.nextSyncToken ?? store.syncToken;
    return { items: data.items ?? [], syncToken: store.syncToken };
  }
}
