import { envs } from "../constants/projectInfo.constants";

const cache = new Map<string, { value: string; expiresAt: number }>();

export const urlLookupService = async (
  projectId: string,
  envName: Env = envs.PROD as Env,
  env: {
    SUPABASE_URL_PROD?: string;
    SUPABASE_SECRET_KEY_PROD?: string;
    SUPABASE_URL_DEV?: string;
    SUPABASE_SECRET_KEY_DEV?: string;
    URL_LOOKUP_CACHE_TTL_MS?: string;
  },
): Promise<string | null> => {
  const key = `${projectId}:${envName}`;

  const cacheTtl = Number(
    env.URL_LOOKUP_CACHE_TTL_MS ?? 3 * 60 * 60 * 1000,
  );

  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }
  if (cached) cache.delete(key);

  const suffix = envName === "prod" ? "PROD" : "DEV";
  const supabaseUrl = env[`SUPABASE_URL_${suffix}`];
  const supabaseSecret = env[`SUPABASE_SECRET_KEY_${suffix}`];

  if (!supabaseUrl || !supabaseSecret) {
    console.error(`Missing Supabase config for ${envName}`);
    return null;
  }

  const baseUrl = supabaseUrl.endsWith("/") ? supabaseUrl.slice(0, -1) : supabaseUrl;
  const queryUrl = `${baseUrl}/rest/v1/project_sites?select=cloudrun_url&conv_id=eq.${encodeURIComponent(projectId)}`;

  try {
    const response = await fetch(queryUrl, {
      method: "GET",
      headers: {
        "apikey": supabaseSecret,
        "Authorization": `Bearer ${supabaseSecret}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Supabase fetch failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as { cloudrun_url: string }[];
    if (!data || data.length === 0) {
      return null;
    }

    const url = data[0].cloudrun_url;
    cache.set(key, {
      value: url,
      expiresAt: Date.now() + cacheTtl,
    });
    return url;
  } catch (err) {
    console.error(`Error looking up site ${projectId}:`, err);
    return null;
  }
};
