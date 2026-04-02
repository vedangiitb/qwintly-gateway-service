import { createClient, SupabaseClient } from "@supabase/supabase-js";

type Env = "prod" | "dev";

const clientCache = new Map<Env, SupabaseClient>();

const getEnvVar = (env: Env, key: "url" | "secret"): string => {
  const envKey =
    key === "url"
      ? env === "prod"
        ? "SUPABASE_URL_PROD"
        : "SUPABASE_URL_DEV"
      : env === "prod"
        ? "SUPABASE_SECRET_KEY_PROD"
        : "SUPABASE_SECRET_KEY_DEV";

  const value = process.env[envKey];
  if (!value) {
    throw new Error(
      `Missing env var ${envKey} for Supabase ${env} connection`,
    );
  }
  return value;
};

export const getSupabaseAdmin = (env: Env): SupabaseClient => {
  const cached = clientCache.get(env);
  if (cached) return cached;

  const url = getEnvVar(env, "url");
  const secret = getEnvVar(env, "secret");

  const client = createClient(url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  clientCache.set(env, client);
  return client;
};
