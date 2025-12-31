import { NestFactory } from "@nestjs/core";
import { AppModule } from "./root.module";
import session from "express-session";
import cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Important: autoriser les cookies cross-origin
  app.enableCors({
    origin: ["http://localhost:8599"],
    credentials: true,
  });

  app.use(cookieParser());

  app.use(
    session({
      name: "carecall.sid",
      secret: process.env.SESSION_SECRET ?? "dev_secret_change_me",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax", // OK en localhost
        secure: false,   // true en https prod
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  await app.listen(3000);
}
bootstrap();
