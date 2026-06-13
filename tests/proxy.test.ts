import { describe, it, expect, vi, beforeEach } from "vitest";
import { DefaultRequestProxy } from "../src/services/proxy";

describe("DefaultRequestProxy", () => {
  let proxy: DefaultRequestProxy;

  beforeEach(() => {
    proxy = new DefaultRequestProxy();
    vi.restoreAllMocks();
  });

  it("should proxy full target URLs", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((req) => {
      const r = req as Request;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            url: r.url,
            hostHeader: r.headers.get("host"),
            forwardedHostHeader: r.headers.get("x-forwarded-host"),
          })
        )
      );
    });

    const request = new Request("https://incoming.com/some/path?query=123", {
      headers: {
        Accept: "application/json",
      },
    });

    const response = await proxy.proxy(
      request,
      "https://target-service-1.run.app:443"
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const data = (await response.json()) as any;
    expect(data.url).toBe(
      "https://target-service-1.run.app/some/path?query=123"
    );
    expect(data.hostHeader).toBe("target-service-1.run.app");
    expect(data.forwardedHostHeader).toBe("incoming.com");
  });

  it("should proxy target hostnames without protocol", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((req) => {
      const r = req as Request;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            url: r.url,
            hostHeader: r.headers.get("host"),
          })
        )
      );
    });

    const request = new Request("https://incoming.com/docs");
    const response = await proxy.proxy(request, "static-host.run.app");

    const data = (await response.json()) as any;
    expect(data.url).toBe("https://static-host.run.app/docs");
    expect(data.hostHeader).toBe("static-host.run.app");
  });

  it("should attach extra headers and retain request body/method", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((req) => {
      const r = req as Request;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            method: r.method,
            sessionHeader: r.headers.get("x-gen-session-id"),
          })
        )
      );
    });

    const request = new Request("https://incoming.com/submit", {
      method: "POST",
      body: "my-payload",
      headers: {
        "Content-Type": "text/plain",
      },
    });

    const response = await proxy.proxy(
      request,
      "https://destination.internal",
      {
        "x-gen-session-id": "session-xyz",
      }
    );

    const data = (await response.json()) as any;
    expect(data.method).toBe("POST");
    expect(data.sessionHeader).toBe("session-xyz");
  });
});
