import { extractProjectInfo } from "./services/extractInfo.service";
import { urlLookupService } from "./services/urlLookup.service";
import { isAllowedTarget } from "./utils/validateTarget.helper";

export interface Env {
  RENDERER_URL_DEV: string;
  RENDERER_URL_PROD: string;
  SUPABASE_URL_PROD: string;
  SUPABASE_SECRET_KEY_PROD: string;
  SUPABASE_URL_DEV: string;
  SUPABASE_SECRET_KEY_DEV: string;
  ALLOWED_TARGET_HOST_SUFFIX?: string;
  URL_LOOKUP_CACHE_TTL_MS?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const incomingUrl = new URL(request.url);

    // 1. Check special static hostnames
    let targetHost: string | null = null;
    if (incomingUrl.hostname === "dev.qwintly.com") {
      targetHost = "qwintly-459117541379.us-central1.run.app";
    } else if (incomingUrl.hostname === "docs.qwintly.com") {
      targetHost = "qwintly-docs-620406862138.asia-south1.run.app";
    }

    if (targetHost) {
      const targetUrl = new URL(request.url);
      targetUrl.hostname = targetHost;

      const headers = new Headers(request.headers);
      headers.set("host", targetHost);
      headers.set("x-forwarded-host", incomingUrl.hostname);

      const newRequest = new Request(targetUrl.toString(), {
        method: request.method,
        headers,
        body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
        redirect: "manual",
      });

      return fetch(newRequest);
    }

    // 2. Otherwise handle *.qwintly.com multi-tenant routing
    const projectInfo = extractProjectInfo(incomingUrl.hostname);
    if (!projectInfo) {
      return new Response("Invalid host", { status: 400 });
    }

    let target: string | null = null;

    if (projectInfo.kind === "preview") {
      target = projectInfo.env === "dev"
        ? env.RENDERER_URL_DEV
        : env.RENDERER_URL_PROD;

      if (!target) {
        console.error("Missing renderer URL for env:", projectInfo.env);
        return new Response("Misconfigured renderer", { status: 500 });
      }

      const targetUrl = new URL(request.url);
      const parsedTarget = new URL(target);
      targetUrl.protocol = parsedTarget.protocol;
      targetUrl.hostname = parsedTarget.hostname;
      targetUrl.port = parsedTarget.port;

      const headers = new Headers(request.headers);
      headers.set("host", parsedTarget.host);
      headers.set("x-forwarded-host", incomingUrl.hostname);
      headers.set("x-gen-session-id", projectInfo.genId);

      const newRequest = new Request(targetUrl.toString(), {
        method: request.method,
        headers,
        body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
        redirect: "manual",
      });

      return fetch(newRequest);
    }

    // Project routing
    target = await urlLookupService(projectInfo.projectId, projectInfo.env, env);

    if (!target) {
      return new Response("Not found", { status: 404 });
    }

    if (!isAllowedTarget(target, env)) {
      return new Response("Forbidden", { status: 403 });
    }

    const targetUrl = new URL(request.url);
    const parsedTarget = new URL(target);
    targetUrl.protocol = parsedTarget.protocol;
    targetUrl.hostname = parsedTarget.hostname;
    targetUrl.port = parsedTarget.port;

    const headers = new Headers(request.headers);
    headers.set("host", parsedTarget.host);
    headers.set("x-forwarded-host", incomingUrl.hostname);

    const newRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      redirect: "manual",
    });

    return fetch(newRequest);
  }
};
