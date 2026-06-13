import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  StaticRouteResolver,
  PreviewRouteResolver,
  ProjectRouteResolver,
} from "../src/routing/resolvers";
import { IConfig } from "../src/config";
import { IRequestProxy } from "../src/services/proxy";
import { ISiteLookupService } from "../src/services/lookup";
import { ITargetValidator } from "../src/utils/validator";
import { ParsedHost, ProjectInfo } from "../src/types";

describe("Resolvers", () => {
  let mockProxy: IRequestProxy;

  beforeEach(() => {
    mockProxy = {
      proxy: vi.fn(() => Promise.resolve(new Response("proxied"))),
    };
  });

  describe("StaticRouteResolver", () => {
    it("should resolve allowed static hostnames", async () => {
      const resolver = new StaticRouteResolver(mockProxy);
      const parsedHost: ParsedHost = {
        host: "dev.qwintly.com",
        subdomain: "dev",
      };

      const request = new Request("https://dev.qwintly.com/some/path");

      const canResolve = await resolver.canResolve(request, parsedHost);
      expect(canResolve).toBe(true);

      const response = await resolver.resolve(request, parsedHost);
      expect(response.status).toBe(200);
      expect(mockProxy.proxy).toHaveBeenCalledWith(
        request,
        "qwintly-459117541379.us-central1.run.app"
      );
    });

    it("should not resolve unknown hostnames", async () => {
      const resolver = new StaticRouteResolver(mockProxy);
      const parsedHost: ParsedHost = {
        host: "other.qwintly.com",
        subdomain: "other",
      };

      const request = new Request("https://other.qwintly.com/");
      const canResolve = await resolver.canResolve(request, parsedHost);
      expect(canResolve).toBe(false);
    });
  });

  describe("PreviewRouteResolver", () => {
    let mockConfig: IConfig;

    beforeEach(() => {
      mockConfig = {
        rendererUrlDev: "https://dev-renderer.internal",
        rendererUrlProd: "https://prod-renderer.internal",
      } as any;
    });

    it("should resolve preview routes based on environment", async () => {
      const resolver = new PreviewRouteResolver(mockConfig, mockProxy);
      const projectInfo: ProjectInfo = {
        kind: "preview",
        genId: "session-123",
        env: "dev",
      };

      const request = new Request(
        "https://session-123-devpreviews.qwintly.com/abc"
      );
      const canResolve = await resolver.canResolve(request, null, projectInfo);
      expect(canResolve).toBe(true);

      await resolver.resolve(request, null, projectInfo);
      expect(mockProxy.proxy).toHaveBeenCalledWith(
        request,
        "https://dev-renderer.internal",
        { "x-gen-session-id": "session-123" }
      );
    });
  });

  describe("ProjectRouteResolver", () => {
    let mockLookup: ISiteLookupService;
    let mockValidator: ITargetValidator;

    beforeEach(() => {
      mockLookup = {
        lookup: vi.fn((projectId, env) =>
          Promise.resolve(
            projectId === "valid" ? "https://valid.run.app" : null
          )
        ),
      };
      mockValidator = {
        isValid: vi.fn((target) => target.includes("valid.run.app")),
      };
    });

    it("should resolve project domains if allowed and found", async () => {
      const resolver = new ProjectRouteResolver(
        mockLookup,
        mockValidator,
        mockProxy
      );
      const projectInfo: ProjectInfo = {
        kind: "project",
        projectId: "valid",
        env: "prod",
      };

      const request = new Request("https://valid-projects.qwintly.com/");
      const canResolve = await resolver.canResolve(request, null, projectInfo);
      expect(canResolve).toBe(true);

      const response = await resolver.resolve(request, null, projectInfo);
      expect(response.status).toBe(200);
      expect(mockLookup.lookup).toHaveBeenCalledWith("valid", "prod");
      expect(mockValidator.isValid).toHaveBeenCalledWith(
        "https://valid.run.app"
      );
      expect(mockProxy.proxy).toHaveBeenCalledWith(
        request,
        "https://valid.run.app"
      );
    });

    it("should return 403 Forbidden for disallowed targets", async () => {
      mockValidator.isValid = vi.fn(() => false);
      const resolver = new ProjectRouteResolver(
        mockLookup,
        mockValidator,
        mockProxy
      );
      const projectInfo: ProjectInfo = {
        kind: "project",
        projectId: "valid",
        env: "prod",
      };

      const request = new Request("https://valid-projects.qwintly.com/");
      const response = await resolver.resolve(request, null, projectInfo);
      expect(response.status).toBe(403);
    });

    it("should return 404 Not Found if lookup fails", async () => {
      const resolver = new ProjectRouteResolver(
        mockLookup,
        mockValidator,
        mockProxy
      );
      const projectInfo: ProjectInfo = {
        kind: "project",
        projectId: "missing",
        env: "prod",
      };

      const request = new Request("https://missing-projects.qwintly.com/");
      const response = await resolver.resolve(request, null, projectInfo);
      expect(response.status).toBe(404);
    });
  });
});
