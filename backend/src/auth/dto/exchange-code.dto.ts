import { IsIn, IsString } from "class-validator";

export type Mode = "read" | "write";

export class ExchangeCodeDto {
  @IsString()
  code!: string;

  @IsIn(["read", "write"])
  mode!: Mode;
}
