import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ExchangeCodeDto } from "./dto/exchange-code.dto";

@Controller("auth/google")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("exchange")
  async exchange(@Body() body: ExchangeCodeDto) {
    return this.auth.exchange(body.code, body.mode);
  }
}
