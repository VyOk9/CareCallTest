import { Module } from "@nestjs/common";
import { CalendarController } from "./calendar.controller";
import { CalendarService } from "./calendar.service";
import { GoogleModule } from "../google/google.module";

@Module({
  imports: [GoogleModule],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}
