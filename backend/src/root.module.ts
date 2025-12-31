import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GoogleModule } from "./google/google.module";
import { AuthModule } from "./auth/auth.module";
import { CalendarModule } from "./calendar/calendar.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // ✅ charge .env
    GoogleModule,
    AuthModule,
    CalendarModule,
  ],
})
export class AppModule {}
