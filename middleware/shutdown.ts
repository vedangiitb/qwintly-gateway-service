import type { RequestHandler } from "express";
import type { Server } from "http";
import type { LogLevel } from "../utils/logger";

type LogFn = (
  level: LogLevel,
  msg: string,
  extra?: Record<string, unknown>,
) => void;

export const createShutdownHandler = (
  log: LogFn,
  getInflight: () => number,
  forceTimeoutMs = 10_000,
) => {
  let isShuttingDown = false;

  const middleware: RequestHandler = (_req, res, next) => {
    if (isShuttingDown) {
      res.set("Connection", "close");
      return res.status(503).send("Server is shutting down");
    }
    next();
  };

  const shutdown = (server: Server, signal: "SIGTERM" | "SIGINT") => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    log("warn", "shutdown_start", { signal, inflightRequests: getInflight() });
    server.close(() => {
      log("warn", "shutdown_complete", { inflightRequests: getInflight() });
      process.exit(0);
    });
    setTimeout(() => {
      log("error", "shutdown_force", { inflightRequests: getInflight() });
      process.exit(1);
    }, forceTimeoutMs).unref();
  };

  const initSignalHandlers = (server: Server) => {
    process.on("SIGTERM", () => shutdown(server, "SIGTERM"));
    process.on("SIGINT", () => shutdown(server, "SIGINT"));
  };

  return { middleware, initSignalHandlers };
};
