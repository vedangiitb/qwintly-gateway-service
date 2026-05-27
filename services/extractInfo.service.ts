import { IncomingHttpHeaders } from "node:http";
import { envs } from "../constants/projectInfo.constants";

export const extractProjectInfo = (
  hostHeader: IncomingHttpHeaders,
): ProjectInfo => {
  const rawHost = hostHeader["x-forwarded-host"] ?? hostHeader["host"];
  const host = Array.isArray(rawHost) ? rawHost[0] : rawHost;
  const parsed = parseHost(host as string | undefined);
  if (!parsed) return null;

  const { subdomain } = parsed;

  // dev: uuid-devprojects
  const devMatch = /^([a-z0-9-]+)-devprojects$/.exec(subdomain);
  if (devMatch) {
    const projectId = devMatch[1];

    if (!isValidProjectId(projectId)) return null;

    return {
      kind: "project",
      projectId,
      env: envs.DEV as Env,
    };
  }

  // prod: uuid-projects
  const prodMatch = /^([a-z0-9-]+)-projects$/.exec(subdomain);
  if (prodMatch) {
    const projectId = prodMatch[1];

    if (!isValidProjectId(projectId)) return null;

    return {
      kind: "project",
      projectId,
      env: envs.PROD as Env,
    };
  }

  // dev previews: uuid-devpreviews
  const devPreviewMatch = /^([a-z0-9-]+)-devpreviews$/.exec(subdomain);
  if (devPreviewMatch) {
    const genId = devPreviewMatch[1];

    if (!isValidGenId(genId)) return null;

    return {
      kind: "preview",
      genId,
      env: envs.DEV as Env,
    };
  }

  // prod previews: uuid-previews
  const prodPreviewMatch = /^([a-z0-9-]+)-previews$/.exec(subdomain);
  if (prodPreviewMatch) {
    const genId = prodPreviewMatch[1];

    if (!isValidGenId(genId)) return null;

    return {
      kind: "preview",
      genId,
      env: envs.PROD as Env,
    };
  }

  return null;
};

export const parseHost = (hostHeader?: string): ParsedHost => {
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
};

export const isValidProjectId = (projectId: string): boolean => {
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
};

const isValidGenId = (genId: string): boolean => {
  if (!genId) return false;

  // allowed chars (DNS label safe)
  if (!/^[a-z0-9-]+$/.test(genId)) return false;

  // no leading/trailing hyphens
  if (genId.startsWith("-") || genId.endsWith("-")) return false;

  // length limit (DNS label max = 63)
  if (genId.length > 63) return false;

  return true;
};
