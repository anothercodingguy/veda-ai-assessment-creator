import http from "http";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { ZodError } from "zod";
import { config } from "./config.js";
import { connectDatabase } from "./db.js";
import { assignmentsRouter } from "./routes/assignments.js";
import { initWebSocket, startEventBridge } from "./websocket.js";

async function main() {
  await connectDatabase();

  const app = express();
  app.use(cors({ origin: config.clientUrl, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/assignments", assignmentsRouter);

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);
    if (error instanceof ZodError) {
      return res.status(400).json({ error: "Validation failed", issues: error.flatten() });
    }
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Unknown server error" });
  });

  const server = http.createServer(app);
  initWebSocket(server);
  await startEventBridge();

  server.listen(config.port, () => {
    console.log(`[api] listening on http://localhost:${config.port}`);
  });
}

main().catch((error) => {
  console.error("[api] fatal startup error", error);
  process.exit(1);
});
