import { IsOptional, IsString } from "class-validator";

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  startIso?: string;

  @IsOptional()
  @IsString()
  endIso?: string;
}
