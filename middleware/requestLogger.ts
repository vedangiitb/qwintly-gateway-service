import type { RequestHandler } from "express";
import type { LogLevel } from "../utils/logger";

type LogFn = (
  level: LogLevel,
  msg: string,
  extra?: Record<string, unknown>,
) => void;

export const createRequestLogger = (log: LogFn) => {
  let inflight = 0;

  const middleware: RequestHandler = (req, res, next) => {
    const start = Date.now();
    inflight += 1;
    let finished = false;

    const done = (event: "finish" | "close") => {
      if (finished) return;
      finished = true;
      inflight -= 1;
      log(event === "finish" ? "info" : "warn", "request", {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        duration_ms: Date.now() - start,
        ip: req.ip,
      });
    };

    res.on("finish", () => done("finish"));
    res.on("close", () => done("close"));
    next();
  };

  return {
    middleware,
    getInflight: () => inflight,
  };
};
