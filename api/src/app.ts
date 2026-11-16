import express from "express";
import { HttpError, isHttpError } from "@/http";
import { authRouter } from "@/routes/auth";
import { studioRouter } from "@/routes/studio";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/auth", authRouter);
  app.use(studioRouter);

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (isHttpError(error)) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : "Something went wrong";
    const status = /not found/i.test(message) ? 404 : 400;
    console.error("[api]", message);
    res.status(status).json({ error: message });
  });

  return app;
}

void HttpError;
