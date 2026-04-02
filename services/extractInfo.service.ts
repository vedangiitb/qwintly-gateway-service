import { envs } from "../constants/projectInfo.constants";

export const extractProjectInfo = (hostHeader?: string): ProjectInfo => {
  const parsed = parseHost(hostHeader);
  if (!parsed) return null;

  const { subdomain } = parsed;

  // dev: uuid-devprojects
  const devMatch = subdomain.match(/^([a-z0-9-]+)-devprojects$/);
  if (devMatch) {
    const projectId = devMatch[1];

    if (!isValidProjectId(projectId)) return null;

    return {
      projectId,
      env: envs.DEV as Env,
    };
  }

  // prod: uuid-projects
  const prodMatch = subdomain.match(/^([a-z0-9-]+)-projects$/);
  if (prodMatch) {
    const projectId = prodMatch[1];

    if (!isValidProjectId(projectId)) return null;

    return {
      projectId,
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
