export interface IRequestProxy {
  proxy(
    request: Request,
    targetUrlStringOrHost: string,
    extraHeaders?: Record<string, string>
  ): Promise<Response>;
}

export class DefaultRequestProxy implements IRequestProxy {
  async proxy(
    request: Request,
    targetUrlStringOrHost: string,
    extraHeaders?: Record<string, string>
  ): Promise<Response> {
    const incomingUrl = new URL(request.url);
    const targetUrl = new URL(request.url);

    let finalHostHeader = "";

    // If targetUrlStringOrHost looks like a full URL (starts with http:// or https://)
    if (/^https?:\/\//i.test(targetUrlStringOrHost)) {
      const parsedTarget = new URL(targetUrlStringOrHost);
      targetUrl.protocol = parsedTarget.protocol;
      targetUrl.hostname = parsedTarget.hostname;
      targetUrl.port = parsedTarget.port;
      finalHostHeader = parsedTarget.host; // includes port if specified
    } else {
      // It is just a hostname/host (e.g., "qwintly-459117541379.us-central1.run.app")
      targetUrl.hostname = targetUrlStringOrHost;
      finalHostHeader = targetUrlStringOrHost;
    }

    const headers = new Headers(request.headers);
    headers.set("host", finalHostHeader);
    headers.set("x-forwarded-host", incomingUrl.hostname);

    if (extraHeaders) {
      for (const [key, value] of Object.entries(extraHeaders)) {
        headers.set(key, value);
      }
    }

    const newRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : request.body,
      redirect: "manual",
    });

    return fetch(newRequest);
  }
}
