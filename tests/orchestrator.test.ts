import { describe, it, expect, vi, beforeEach } from "vitest";
import { GatewayOrchestrator } from "../src/routing/orchestrator";
import { IHostParser } from "../src/services/hostParser";
import { IRouteResolver } from "../src/routing/resolvers";

describe("GatewayOrchestrator", () => {
  let mockHostParser: IHostParser;
  let mockResolver1: IRouteResolver;
  let mockResolver2: IRouteResolver;
  let orchestrator: GatewayOrchestrator;

  beforeEach(() => {
    mockHostParser = {
      parse: vi.fn((host) =>
        host ? { host, subdomain: host.split(".")[0] } : null
      ),
      extractProjectInfo: vi.fn(() => null),
    };

    mockResolver1 = {
      canResolve: vi.fn(() => Promise.resolve(false)),
      resolve: vi.fn(() => Promise.resolve(new Response("resolver 1"))),
    };

    mockResolver2 = {
      canResolve: vi.fn(() => Promise.resolve(true)),
      resolve: vi.fn(() => Promise.resolve(new Response("resolver 2"))),
    };

    orchestrator = new GatewayOrchestrator(mockHostParser, [
      mockResolver1,
      mockResolver2,
    ]);
  });

  it("should parse host and route to matching resolver", async () => {
    const request = new Request("https://example.com/");
    const response = await orchestrator.handle(request);

    expect(mockHostParser.parse).toHaveBeenCalledWith("example.com");
    expect(mockResolver1.canResolve).toHaveBeenCalled();
    expect(mockResolver2.canResolve).toHaveBeenCalled();
    expect(mockResolver2.resolve).toHaveBeenCalled();

    const text = await response.text();
    expect(text).toBe("resolver 2");
  });

  it("should return 400 for invalid host if no resolver handles it and no projectInfo is extracted", async () => {
    mockResolver2.canResolve = vi.fn(() => Promise.resolve(false));

    const request = new Request("https://example.com/");
    const response = await orchestrator.handle(request);
    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid host");
  });

  it("should return 404 if no resolver handles it but projectInfo is extracted", async () => {
    mockResolver2.canResolve = vi.fn(() => Promise.resolve(false));
    mockHostParser.extractProjectInfo = vi.fn(() => ({
      kind: "project",
      projectId: "proj-1",
      env: "prod",
    }));

    const request = new Request("https://proj-1-projects.qwintly.com/");
    const response = await orchestrator.handle(request);
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Not found");
  });
});
