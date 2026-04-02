import { DBRepository } from "./repository.js";

export class SitesRepository extends DBRepository {
  constructor(env: Env) {
    super(env);
  }

  /*
   * Table: project_sites
   * Use: Fetch Cloudrun Site based on project id (READ)
   */
  async fetchSite(id: string): Promise<string> {
    const supabase = this.client;
    const { data, error } = await supabase
      .from("project_sites")
      .select("cloudrun_url")
      .eq("conv_id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("No data found");
    return data.cloudrun_url;
  }
}
