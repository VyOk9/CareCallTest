import { Injectable } from "@nestjs/common";
import { GoogleService } from "../google/google.service";
import { Mode } from "./dto/exchange-code.dto";

@Injectable()
export class AuthService {
  constructor(private readonly google: GoogleService) {}

  exchange(code: string, mode: Mode) {
    return this.google.exchangeCode(code, mode);
  }
}
