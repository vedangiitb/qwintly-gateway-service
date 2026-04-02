import { getSupabaseAdmin } from "../lib/supabase-admin.js";

type Env = "prod" | "dev";

export class DBRepository {
  private readonly env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  protected get client() {
    return getSupabaseAdmin(this.env);
  }
}
