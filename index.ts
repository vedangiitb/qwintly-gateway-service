import express from "express";
import httpProxy from "http-proxy";
import { createRequestLogger } from "./middleware/requestLogger";
import { createShutdownHandler } from "./middleware/shutdown";
import { extractProjectInfo } from "./services/extractInfo.service";
import { urlLookupService } from "./services/urlLookup.service";
import "./utils/env";
import { logJson } from "./utils/logger";
import { isAllowedTarget } from "./utils/validateTarget.helper";

const app = express();
const proxy = httpProxy.createProxyServer({});
const PROXY_TIMEOUT_MS = 10_000;

app.set("trust proxy", true);

const requestLogger = createRequestLogger(logJson);
const shutdownHandler = createShutdownHandler(
  logJson,
  requestLogger.getInflight,
);

app.use(requestLogger.middleware);
app.use(shutdownHandler.middleware);

app.use(async (req, res) => {
  const projectInfo = extractProjectInfo(req.headers);
  if (!projectInfo) {
    return res.status(400).send("Invalid host");
  }

  if (projectInfo.kind === "preview") {
    const target =
      projectInfo.env === "dev"
        ? process.env.RENDERER_URL_DEV
        : process.env.RENDERER_URL_PROD;

    if (!target) {
      logJson("error", "missing_renderer_url", { env: projectInfo.env });
      return res.status(500).send("Misconfigured renderer");
    }

    proxy.web(req, res, {
      target,
      changeOrigin: true,
      proxyTimeout: PROXY_TIMEOUT_MS,
      timeout: PROXY_TIMEOUT_MS,
      headers: {
        "x-gen-session-id": projectInfo.genId,
      },
    });

    return;
  }

  const target = await urlLookupService(projectInfo.projectId, projectInfo.env);

  if (!target) return res.status(404).send("Not found");
  if (!isAllowedTarget(target)) return res.status(403).send("Forbidden");

  proxy.web(req, res, {
    target,
    changeOrigin: true,
    proxyTimeout: PROXY_TIMEOUT_MS,
    timeout: PROXY_TIMEOUT_MS,
  });
});

proxy.on("error", (err, req, res) => {
  const response = res as express.Response;
  logJson("error", "proxy_error", {
    message: err.message,
    code: (err as { code?: string }).code,
  });
  if (response.headersSent) {
    return response.end();
  }
  response.status(502).send("Bad gateway");
});

const server = app.listen(8080);
server.requestTimeout = PROXY_TIMEOUT_MS;
server.headersTimeout = PROXY_TIMEOUT_MS + 5_000;

shutdownHandler.initSignalHandlers(server);
