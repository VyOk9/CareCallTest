import { Module } from "@nestjs/common";
import { AuthGoogleController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { GoogleModule } from "../google/google.module";

@Module({
  imports: [GoogleModule], // pour injecter GoogleService
  controllers: [AuthGoogleController],
  providers: [AuthService],
})
export class AuthModule {}
