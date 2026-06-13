import { AppConfig } from "./config";
import { GatewayOrchestrator } from "./routing/orchestrator";
import { DefaultHostParser } from "./services/hostParser";
import { MemoryCache } from "./services/cache";
import { SupabaseSiteLookupService } from "./services/lookup";
import { SuffixTargetValidator } from "./utils/validator";
import { DefaultRequestProxy } from "./services/proxy";
import {
  StaticRouteResolver,
  PreviewRouteResolver,
  ProjectRouteResolver,
} from "./routing/resolvers";

export interface Env {
  RENDERER_URL_DEV: string;
  RENDERER_URL_PROD: string;
  SUPABASE_URL_PROD: string;
  SUPABASE_SECRET_KEY_PROD: string;
  SUPABASE_URL_DEV: string;
  SUPABASE_SECRET_KEY_DEV: string;
  ALLOWED_TARGET_HOST_SUFFIX?: string;
  URL_LOOKUP_CACHE_TTL_MS?: string;
}

let orchestrator: GatewayOrchestrator | null = null;

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    if (!orchestrator) {
      const config = new AppConfig(env);
      const hostParser = new DefaultHostParser();
      const cache = new MemoryCache<string>();
      const lookupService = new SupabaseSiteLookupService(config, cache);
      const validator = new SuffixTargetValidator(config);
      const proxy = new DefaultRequestProxy();

      const resolvers = [
        new StaticRouteResolver(proxy),
        new PreviewRouteResolver(config, proxy),
        new ProjectRouteResolver(lookupService, validator, proxy),
      ];

      orchestrator = new GatewayOrchestrator(hostParser, resolvers);
    }

    try {
      return await orchestrator.handle(request);
    } catch (error) {
      console.error("Gateway error:", error);
      return new Response("Internal Gateway Error", { status: 500 });
    }
  },
};
