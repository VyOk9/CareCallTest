import { Controller, Get, Post, Patch, Param, Body } from "@nestjs/common";
import { GoogleService } from "../google/google.service";

@Controller("calendar")
export class CalendarController {
  constructor(private readonly google: GoogleService) {}

  @Get("events")
  async events() {
    return this.google.listUpcomingEvents();
  }

  @Post("events")
  async create(@Body() body: {
    summary: string;
    description?: string;
    location?: string;
    startIso: string;
    endIso: string;
  }) {
    return this.google.createEvent(body);
  }

  @Patch("events/:id")
  async update(
    @Param("id") id: string,
    @Body() body: {
      summary?: string;
      description?: string;
      location?: string;
      startIso?: string;
      endIso?: string;
    }
  ) {
    return this.google.updateEvent(id, body);
  }

  // ✅ Ajouts "quasi temps réel"
  @Get("sync/init")
  async initSync() {
    return this.google.initSync();
  }

  @Get("sync/changes")
  async changes() {
    return this.google.syncChanges();
  }

  @Post("logout")
  logout() {
    this.google.logout();
    return { ok: true };
  }

  @Get("status")
  status() {
    return {
      connected: this.google.isConnected(),
      mode: this.google.getMode(),
    };
  }


}
