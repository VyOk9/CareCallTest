import { IsOptional, IsString } from "class-validator";

export class CreateEventDto {
  @IsString()
  summary!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsString()
  startIso!: string;

  @IsString()
  endIso!: string;
}
