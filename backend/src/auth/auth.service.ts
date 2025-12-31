import { Injectable } from "@nestjs/common";
import { GoogleService, Mode, SessionStore } from "../google/google.service";

@Injectable()
export class AuthService {
  constructor(private readonly google: GoogleService) {}

  exchange(store: SessionStore, code: string, mode: Mode) {
    return this.google.exchangeCode(store, code, mode);
  }
}
