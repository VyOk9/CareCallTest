import { Body, Controller, Post, Req } from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { Mode, SessionStore } from "../google/google.service";

type ReqWithSession = Request & { session: SessionStore };

@Controller("auth/google")
export class AuthGoogleController {
  constructor(private readonly auth: AuthService) {}

  @Post("exchange")
  exchange(@Req() req: ReqWithSession, @Body() body: { code: string; mode: Mode }) {
    return this.auth.exchange(req.session, body.code, body.mode);
  }
}
