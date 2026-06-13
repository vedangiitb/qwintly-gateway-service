import { describe, it, expect, vi, beforeEach } from "vitest";
import worker, { Env } from "../src/index";

describe("Worker Entrypoint index.ts", () => {
  let mockEnv: Env;
  let mockCtx: any;

  beforeEach(() => {
    mockEnv = {
      RENDERER_URL_DEV: "https://dev-renderer.internal",
      RENDERER_URL_PROD: "https://prod-renderer.internal",
      SUPABASE_URL_PROD: "https://supabase-prod.co",
      SUPABASE_SECRET_KEY_PROD: "key-prod",
      SUPABASE_URL_DEV: "https://supabase-dev.co",
      SUPABASE_SECRET_KEY_DEV: "key-dev",
      ALLOWED_TARGET_HOST_SUFFIX: ".run.app",
    };
    mockCtx = {};
    vi.restoreAllMocks();
  });

  it("should process requests successfully through orchestrator", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(new Response("proxied-response"))
    );

    const request = new Request("https://dev.qwintly.com/about");
    const response = await worker.fetch(request, mockEnv, mockCtx);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("proxied-response");
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("should return 500 status when an internal error occurs during processing", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new Error("Simulated Processing Error");
    });

    const request = new Request("https://dev.qwintly.com/");
    const response = await worker.fetch(request, mockEnv, mockCtx);

    expect(response.status).toBe(500);
    expect(await response.text()).toBe("Internal Gateway Error");
  });
});
