import { Injectable } from "@nestjs/common";
import { GoogleService, SessionStore } from "../google/google.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";

@Injectable()
export class CalendarService {
  constructor(private readonly google: GoogleService) {}

  list(store: SessionStore) {
    return this.google.listUpcomingEvents(store);
  }

  create(store: SessionStore, body: CreateEventDto) {
    return this.google.createEvent(store, body);
  }

  update(store: SessionStore, id: string, body: UpdateEventDto) {
    return this.google.updateEvent(store, id, body);
  }

  initSync(store: SessionStore) {
    return this.google.initSync(store);
  }

  syncChanges(store: SessionStore) {
    return this.google.syncChanges(store);
  }

  status(store: SessionStore) {
    return this.google.getStatus(store);
  }

  logout(store: SessionStore) {
    return this.google.logout(store);
  }
}
