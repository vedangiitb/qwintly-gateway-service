import { describe, it, expect } from "vitest";
import { DefaultHostParser } from "../src/services/hostParser";

describe("DefaultHostParser", () => {
  const parser = new DefaultHostParser();

  describe("parse", () => {
    it("should parse normal hostnames", () => {
      const parsed = parser.parse("sub.example.com");
      expect(parsed).toEqual({
        host: "sub.example.com",
        subdomain: "sub",
      });
    });

    it("should handle ports and lowercase hostname", () => {
      const parsed = parser.parse("SUB.example.com:8787");
      expect(parsed).toEqual({
        host: "sub.example.com",
        subdomain: "sub",
      });
    });

    it("should return null for invalid hostnames", () => {
      expect(parser.parse("")).toBeNull();
      expect(parser.parse("example")).toBeNull();
      expect(parser.parse("a..b.com")).toBeNull();
      expect(parser.parse("a".repeat(254) + ".com")).toBeNull();
    });
  });

  describe("extractProjectInfo", () => {
    it("should extract project dev environment info", () => {
      const info = parser.extractProjectInfo(
        "my-project-id-devprojects.qwintly.com"
      );
      expect(info).toEqual({
        kind: "project",
        projectId: "my-project-id",
        env: "dev",
      });
    });

    it("should extract project prod environment info", () => {
      const info = parser.extractProjectInfo(
        "my-project-id-projects.qwintly.com"
      );
      expect(info).toEqual({
        kind: "project",
        projectId: "my-project-id",
        env: "prod",
      });
    });

    it("should extract preview dev environment info", () => {
      const info = parser.extractProjectInfo(
        "gen-id-123-devpreviews.qwintly.com"
      );
      expect(info).toEqual({
        kind: "preview",
        genId: "gen-id-123",
        env: "dev",
      });
    });

    it("should extract preview prod environment info", () => {
      const info = parser.extractProjectInfo("gen-id-123-previews.qwintly.com");
      expect(info).toEqual({
        kind: "preview",
        genId: "gen-id-123",
        env: "prod",
      });
    });

    it("should return null for invalid formatted hosts", () => {
      expect(parser.extractProjectInfo("my-project-id-projects")).toBeNull();
      expect(parser.extractProjectInfo("-projects.qwintly.com")).toBeNull();
      expect(
        parser.extractProjectInfo("my-project-projects-projects.qwintly.com")
      ).toBeNull();
    });
  });
});
