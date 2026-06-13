import { IHostParser } from "../services/hostParser";
import { IRouteResolver } from "./resolvers";

export class GatewayOrchestrator {
  private readonly hostParser: IHostParser;
  private readonly resolvers: IRouteResolver[];

  constructor(hostParser: IHostParser, resolvers: IRouteResolver[]) {
    this.hostParser = hostParser;
    this.resolvers = resolvers;
  }

  async handle(request: Request): Promise<Response> {
    const incomingUrl = new URL(request.url);
    const parsedHost = this.hostParser.parse(incomingUrl.hostname);
    const projectInfo = this.hostParser.extractProjectInfo(incomingUrl.hostname);

    for (const resolver of this.resolvers) {
      const canResolve = await resolver.canResolve(
        request,
        parsedHost,
        projectInfo
      );
      if (canResolve) {
        return resolver.resolve(request, parsedHost, projectInfo);
      }
    }

    if (!projectInfo) {
      return new Response("Invalid host", { status: 400 });
    }

    return new Response("Not found", { status: 404 });
  }
}
