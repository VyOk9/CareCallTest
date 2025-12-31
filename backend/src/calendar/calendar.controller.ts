import { Body, Controller, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { Request } from "express";
import { CalendarService } from "./calendar.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { SessionStore } from "../google/google.service";

type ReqWithSession = Request & { session: SessionStore };

@Controller("calendar")
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get("events")
  list(@Req() req: ReqWithSession) {
    return this.calendar.list(req.session);
  }

  @Post("events")
  create(@Req() req: ReqWithSession, @Body() body: CreateEventDto) {
    return this.calendar.create(req.session, body);
  }

  @Patch("events/:id")
  update(@Req() req: ReqWithSession, @Param("id") id: string, @Body() body: UpdateEventDto) {
    return this.calendar.update(req.session, id, body);
  }

  @Get("sync/init")
  initSync(@Req() req: ReqWithSession) {
    return this.calendar.initSync(req.session);
  }

  @Get("sync/changes")
  syncChanges(@Req() req: ReqWithSession) {
    return this.calendar.syncChanges(req.session);
  }

  @Get("status")
  status(@Req() req: ReqWithSession) {
    return this.calendar.status(req.session);
  }

  @Post("logout")
  logout(@Req() req: ReqWithSession) {
    return this.calendar.logout(req.session);
  }
}
