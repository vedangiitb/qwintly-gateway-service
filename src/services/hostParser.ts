import { ParsedHost, ProjectInfo } from "../types";

export interface IHostParser {
  parse(host: string | undefined): ParsedHost | null;
  extractProjectInfo(host: string | undefined): ProjectInfo | null;
}

export class DefaultHostParser implements IHostParser {
  parse(hostHeader?: string): ParsedHost | null {
    if (!hostHeader) return null;

    const host = hostHeader.split(":")[0].trim().toLowerCase();

    // basic sanity
    if (!host || host.includes("..") || host.length > 253) return null;

    const labels = host.split(".");
    if (labels.length < 2) return null;

    return {
      host,
      subdomain: labels[0],
    };
  }

  extractProjectInfo(host: string | undefined): ProjectInfo | null {
    const parsed = this.parse(host);
    if (!parsed) return null;

    const { subdomain } = parsed;

    // dev project: uuid-devprojects
    const devMatch = /^([a-z0-9-]+)-devprojects$/.exec(subdomain);
    if (devMatch) {
      const projectId = devMatch[1];
      if (!this.isValidProjectId(projectId)) return null;
      return {
        kind: "project",
        projectId,
        env: "dev",
      };
    }

    // prod project: uuid-projects
    const prodMatch = /^([a-z0-9-]+)-projects$/.exec(subdomain);
    if (prodMatch) {
      const projectId = prodMatch[1];
      if (!this.isValidProjectId(projectId)) return null;
      return {
        kind: "project",
        projectId,
        env: "prod",
      };
    }

    // dev preview: uuid-devpreviews
    const devPreviewMatch = /^([a-z0-9-]+)-devpreviews$/.exec(subdomain);
    if (devPreviewMatch) {
      const genId = devPreviewMatch[1];
      if (!this.isValidGenId(genId)) return null;
      return {
        kind: "preview",
        genId,
        env: "dev",
      };
    }

    // prod preview: uuid-previews
    const prodPreviewMatch = /^([a-z0-9-]+)-previews$/.exec(subdomain);
    if (prodPreviewMatch) {
      const genId = prodPreviewMatch[1];
      if (!this.isValidGenId(genId)) return null;
      return {
        kind: "preview",
        genId,
        env: "prod",
      };
    }

    return null;
  }

  public isValidProjectId(projectId: string): boolean {
    if (!projectId) return false;

    // allowed chars
    if (!/^[a-z0-9-]+$/.test(projectId)) return false;

    // no leading/trailing hyphens
    if (projectId.startsWith("-") || projectId.endsWith("-")) return false;

    // prevent ambiguity with reserved suffixes
    if (projectId.endsWith("projects") || projectId.endsWith("devprojects")) {
      return false;
    }

    // length limit (DNS label max = 63)
    if (projectId.length > 50) return false;

    return true;
  }

  public isValidGenId(genId: string): boolean {
    if (!genId) return false;

    // allowed chars (DNS label safe)
    if (!/^[a-z0-9-]+$/.test(genId)) return false;

    // no leading/trailing hyphens
    if (genId.startsWith("-") || genId.endsWith("-")) return false;

    // length limit (DNS label max = 63)
    if (genId.length > 63) return false;

    return true;
  }
}
