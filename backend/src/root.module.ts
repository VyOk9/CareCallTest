import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { CalendarModule } from "./calendar/calendar.module";
import { GoogleModule } from "./google/google.module";

@Module({
  imports: [GoogleModule, AuthModule, CalendarModule],
})
export class RootModule {}
