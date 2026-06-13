export interface IConfig {
  get(key: string): string | undefined;
  getRequired(key: string): string;
  readonly rendererUrlDev: string;
  readonly rendererUrlProd: string;
  readonly supabaseUrlProd: string;
  readonly supabaseSecretKeyProd: string;
  readonly supabaseUrlDev: string;
  readonly supabaseSecretKeyDev: string;
  readonly allowedTargetHostSuffix: string;
  readonly urlLookupCacheTtlMs: number;
}

export class AppConfig implements IConfig {
  private readonly env: Record<string, any>;

  constructor(env: Record<string, any>) {
    this.env = env;
  }

  get(key: string): string | undefined {
    return this.env[key];
  }

  getRequired(key: string): string {
    const value = this.env[key];
    if (value === undefined || value === null || value === "") {
      throw new Error(`Missing required configuration: ${key}`);
    }
    return value;
  }

  get rendererUrlDev(): string {
    return this.getRequired("RENDERER_URL_DEV");
  }

  get rendererUrlProd(): string {
    return this.getRequired("RENDERER_URL_PROD");
  }

  get supabaseUrlProd(): string {
    return this.getRequired("SUPABASE_URL_PROD");
  }

  get supabaseSecretKeyProd(): string {
    return this.getRequired("SUPABASE_SECRET_KEY_PROD");
  }

  get supabaseUrlDev(): string {
    return this.getRequired("SUPABASE_URL_DEV");
  }

  get supabaseSecretKeyDev(): string {
    return this.getRequired("SUPABASE_SECRET_KEY_DEV");
  }

  get allowedTargetHostSuffix(): string {
    return this.get("ALLOWED_TARGET_HOST_SUFFIX") || ".run.app";
  }

  get urlLookupCacheTtlMs(): number {
    const ttl = this.get("URL_LOOKUP_CACHE_TTL_MS");
    return ttl ? Number(ttl) : 3 * 60 * 60 * 1000; // 3 hours
  }
}
