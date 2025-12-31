import { NestFactory } from "@nestjs/core";
import { RootModule } from "./root.module";
import * as dotenv from "dotenv";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create(RootModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.enableCors({
    origin: "http://localhost:8599",
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.listen(3000);
}
bootstrap();
