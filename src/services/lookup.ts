import { ICache } from "./cache";
import { IConfig } from "../config";
import { EnvType } from "../types";

export interface ISiteLookupService {
  lookup(projectId: string, envName: EnvType): Promise<string | null>;
}

export class SupabaseSiteLookupService implements ISiteLookupService {
  private readonly config: IConfig;
  private readonly cache: ICache<string, string>;

  constructor(config: IConfig, cache: ICache<string, string>) {
    this.config = config;
    this.cache = cache;
  }

  async lookup(projectId: string, envName: EnvType): Promise<string | null> {
    const key = `${projectId}:${envName}`;
    const cachedValue = this.cache.get(key);
    if (cachedValue) {
      return cachedValue;
    }

    const supabaseUrl =
      envName === "prod"
        ? this.config.supabaseUrlProd
        : this.config.supabaseUrlDev;
    const supabaseSecret =
      envName === "prod"
        ? this.config.supabaseSecretKeyProd
        : this.config.supabaseSecretKeyDev;

    if (!supabaseUrl || !supabaseSecret) {
      console.error(`Missing Supabase config for ${envName}`);
      return null;
    }

    const baseUrl = supabaseUrl.endsWith("/")
      ? supabaseUrl.slice(0, -1)
      : supabaseUrl;
    const queryUrl = `${baseUrl}/rest/v1/project_sites?select=cloudrun_url&conv_id=eq.${encodeURIComponent(projectId)}`;

    try {
      const response = await fetch(queryUrl, {
        method: "GET",
        headers: {
          apikey: supabaseSecret,
          Authorization: `Bearer ${supabaseSecret}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          `Supabase fetch failed: ${response.status} ${response.statusText}`,
        );
        return null;
      }

      const data = (await response.json()) as { cloudrun_url: string }[];
      if (!data || data.length === 0) {
        return null;
      }

      const url = data[0].cloudrun_url;
      this.cache.set(key, url, this.config.urlLookupCacheTtlMs);
      return url;
    } catch (err) {
      console.error(`Error looking up site ${projectId}:`, err);
      return null;
    }
  }
}
