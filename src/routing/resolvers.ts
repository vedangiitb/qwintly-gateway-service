import { IConfig } from "../config";
import { ISiteLookupService } from "../services/lookup";
import { IRequestProxy } from "../services/proxy";
import { ParsedHost, ProjectInfo } from "../types";
import { ITargetValidator } from "../utils/validator";

export interface IRouteResolver {
  canResolve(
    request: Request,
    parsedHost: ParsedHost | null,
    projectInfo: ProjectInfo | null,
  ): Promise<boolean>;

  resolve(
    request: Request,
    parsedHost: ParsedHost | null,
    projectInfo: ProjectInfo | null,
  ): Promise<Response>;
}

export class StaticRouteResolver implements IRouteResolver {
  private readonly proxy: IRequestProxy;

  private readonly staticHostMap: Record<string, string> = {
    "dev.qwintly.com": "qwintly-459117541379.us-central1.run.app",
    "docs.qwintly.com": "qwintly-docs-620406862138.asia-south1.run.app",
  };

  constructor(proxy: IRequestProxy) {
    this.proxy = proxy;
  }

  async canResolve(
    request: Request,
    parsedHost: ParsedHost | null,
  ): Promise<boolean> {
    if (!parsedHost) return false;
    return parsedHost.host in this.staticHostMap;
  }

  async resolve(
    request: Request,
    parsedHost: ParsedHost | null,
  ): Promise<Response> {
    if (!parsedHost) {
      return new Response("Invalid host", { status: 400 });
    }
    const targetHost = this.staticHostMap[parsedHost.host];
    if (!targetHost) {
      return new Response("Host not found", { status: 404 });
    }
    return this.proxy.proxy(request, targetHost);
  }
}

export class PreviewRouteResolver implements IRouteResolver {
  private readonly config: IConfig;
  private readonly proxy: IRequestProxy;

  constructor(config: IConfig, proxy: IRequestProxy) {
    this.config = config;
    this.proxy = proxy;
  }

  async canResolve(
    request: Request,
    parsedHost: ParsedHost | null,
    projectInfo: ProjectInfo | null,
  ): Promise<boolean> {
    return projectInfo?.kind === "preview";
  }

  async resolve(
    request: Request,
    parsedHost: ParsedHost | null,
    projectInfo: ProjectInfo | null,
  ): Promise<Response> {
    if (projectInfo?.kind !== "preview") {
      return new Response("Invalid request", { status: 400 });
    }

    const target =
      projectInfo.env === "dev"
        ? this.config.rendererUrlDev
        : this.config.rendererUrlProd;

    if (!target) {
      console.error("Missing renderer URL for env:", projectInfo.env);
      return new Response("Misconfigured renderer", { status: 500 });
    }

    return this.proxy.proxy(request, target, {
      "x-gen-session-id": projectInfo.genId,
    });
  }
}

export class ProjectRouteResolver implements IRouteResolver {
  private readonly lookupService: ISiteLookupService;
  private readonly validator: ITargetValidator;
  private readonly proxy: IRequestProxy;

  constructor(
    lookupService: ISiteLookupService,
    validator: ITargetValidator,
    proxy: IRequestProxy,
  ) {
    this.lookupService = lookupService;
    this.validator = validator;
    this.proxy = proxy;
  }

  async canResolve(
    request: Request,
    parsedHost: ParsedHost | null,
    projectInfo: ProjectInfo | null,
  ): Promise<boolean> {
    return projectInfo?.kind === "project";
  }

  async resolve(
    request: Request,
    parsedHost: ParsedHost | null,
    projectInfo: ProjectInfo | null,
  ): Promise<Response> {
    if (projectInfo?.kind !== "project") {
      return new Response("Invalid request", { status: 400 });
    }

    const target = await this.lookupService.lookup(
      projectInfo.projectId,
      projectInfo.env,
    );

    if (!target) {
      return new Response("Not found", { status: 404 });
    }

    if (!this.validator.isValid(target)) {
      return new Response("Forbidden", { status: 403 });
    }

    return this.proxy.proxy(request, target);
  }
}
