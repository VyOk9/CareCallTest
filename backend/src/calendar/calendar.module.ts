import { Module } from "@nestjs/common";
import { CalendarController } from "./calendar.controller";
import { CalendarService } from "./calendar.service";
import { GoogleModule } from "../google/google.module";

@Module({
  imports: [GoogleModule],          // ✅ pour GoogleService
  controllers: [CalendarController],
  providers: [CalendarService],     // ✅ indispensable
})
export class CalendarModule {}
