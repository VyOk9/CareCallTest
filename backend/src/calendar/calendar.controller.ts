import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { CalendarService } from "./calendar.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";

@Controller("calendar")
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get("events")
  async events() {
    return this.calendar.list();
  }

  @Post("events")
  async create(@Body() body: CreateEventDto) {
    return this.calendar.create(body);
  }

  @Patch("events/:id")
  async update(@Param("id") id: string, @Body() body: UpdateEventDto) {
    return this.calendar.update(id, body);
  }
}
