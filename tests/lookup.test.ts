import { describe, it, expect, vi, beforeEach } from "vitest";
import { SupabaseSiteLookupService } from "../src/services/lookup";
import { IConfig } from "../src/config";
import { ICache } from "../src/services/cache";

describe("SupabaseSiteLookupService", () => {
  let mockConfig: IConfig;
  let mockCache: ICache<string, string>;
  let lookupService: SupabaseSiteLookupService;

  beforeEach(() => {
    mockConfig = {
      supabaseUrlProd: "https://supabase-prod.co/",
      supabaseSecretKeyProd: "secret-prod",
      supabaseUrlDev: "https://supabase-dev.co/",
      supabaseSecretKeyDev: "secret-dev",
      urlLookupCacheTtlMs: 10000,
    } as any;

    const store = new Map<string, string>();
    mockCache = {
      get: vi.fn((key) => store.get(key)),
      set: vi.fn((key, val) => {
        store.set(key, val);
      }),
      delete: vi.fn((key) => {
        store.delete(key);
      }),
      clear: vi.fn(() => store.clear()),
    };

    lookupService = new SupabaseSiteLookupService(mockConfig, mockCache);
    vi.restoreAllMocks();
  });

  it("should return cached value if present", async () => {
    mockCache.set("project-1:prod", "https://cached.run.app", 10000);

    const result = await lookupService.lookup("project-1", "prod");
    expect(result).toBe("https://cached.run.app");
    expect(mockCache.get).toHaveBeenCalledWith("project-1:prod");
  });

  it("should fetch from Supabase and cache result on miss", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { cloudrun_url: "https://newly-fetched.run.app" },
          ]),
      } as any)
    );

    const result = await lookupService.lookup("project-2", "prod");
    expect(result).toBe("https://newly-fetched.run.app");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(mockCache.set).toHaveBeenCalledWith(
      "project-2:prod",
      "https://newly-fetched.run.app",
      10000
    );
  });

  it("should return null if Supabase fetch returns empty list", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      } as any)
    );

    const result = await lookupService.lookup("project-3", "prod");
    expect(result).toBeNull();
  });

  it("should return null on fetch errors", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.reject(new Error("Network Error"))
    );

    const result = await lookupService.lookup("project-4", "prod");
    expect(result).toBeNull();
  });
});
