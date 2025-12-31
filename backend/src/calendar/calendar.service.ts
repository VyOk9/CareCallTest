import { Injectable } from "@nestjs/common";
import { GoogleService } from "../google/google.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";

@Injectable()
export class CalendarService {
  constructor(private readonly google: GoogleService) {}

  list() {
    return this.google.listUpcomingEvents();
  }

  create(body: CreateEventDto) {
    return this.google.createEvent(body);
  }

  update(id: string, body: UpdateEventDto) {
    return this.google.updateEvent(id, body);
  }
}
