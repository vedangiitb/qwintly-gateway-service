import { describe, it, expect } from "vitest";
import { AppConfig } from "../src/config";

describe("AppConfig", () => {
  it("should return configuration values", () => {
    const rawEnv = {
      RENDERER_URL_DEV: "https://renderer-dev.internal",
      RENDERER_URL_PROD: "https://renderer-prod.internal",
      SUPABASE_URL_PROD: "https://supabase-prod.co",
      SUPABASE_SECRET_KEY_PROD: "key-prod",
      SUPABASE_URL_DEV: "https://supabase-dev.co",
      SUPABASE_SECRET_KEY_DEV: "key-dev",
      ALLOWED_TARGET_HOST_SUFFIX: ".example.com",
      URL_LOOKUP_CACHE_TTL_MS: "5000",
    };

    const config = new AppConfig(rawEnv);

    expect(config.rendererUrlDev).toBe("https://renderer-dev.internal");
    expect(config.rendererUrlProd).toBe("https://renderer-prod.internal");
    expect(config.supabaseUrlProd).toBe("https://supabase-prod.co");
    expect(config.supabaseSecretKeyProd).toBe("key-prod");
    expect(config.supabaseUrlDev).toBe("https://supabase-dev.co");
    expect(config.supabaseSecretKeyDev).toBe("key-dev");
    expect(config.allowedTargetHostSuffix).toBe(".example.com");
    expect(config.urlLookupCacheTtlMs).toBe(5000);
  });

  it("should fallback to defaults when optional config is missing", () => {
    const rawEnv = {
      RENDERER_URL_DEV: "https://renderer-dev.internal",
      RENDERER_URL_PROD: "https://renderer-prod.internal",
      SUPABASE_URL_PROD: "https://supabase-prod.co",
      SUPABASE_SECRET_KEY_PROD: "key-prod",
      SUPABASE_URL_DEV: "https://supabase-dev.co",
      SUPABASE_SECRET_KEY_DEV: "key-dev",
    };

    const config = new AppConfig(rawEnv);
    expect(config.allowedTargetHostSuffix).toBe(".run.app");
    expect(config.urlLookupCacheTtlMs).toBe(3 * 60 * 60 * 1000);
  });

  it("should throw for missing required variables", () => {
    const rawEnv = {};
    const config = new AppConfig(rawEnv);
    expect(() => config.rendererUrlDev).toThrow();
  });
});
