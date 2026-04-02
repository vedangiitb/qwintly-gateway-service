import { envs } from "../constants/projectInfo.constants";
import { SitesRepository } from "../repository/sites.repository";

const repoCache = new Map<Env, SitesRepository>();

const getSitesRepo = (env: Env) => {
  const cached = repoCache.get(env);
  if (cached) return cached;
  const repo = new SitesRepository(env);
  repoCache.set(env, repo);
  return repo;
};
const cache = new Map<string, { value: string; expiresAt: number }>();
const CACHE_TTL_MS = Number(
  process.env.URL_LOOKUP_CACHE_TTL_MS ?? 3 * 60 * 60 * 1000,
);

export const urlLookupService = async (
  projectId: string,
  env: Env = envs.PROD as Env,
) => {
  const key = `${projectId}:${env}`;

  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.value);
  }
  if (cached) cache.delete(key);

  return getSitesRepo(env).fetchSite(projectId).then((url) => {
    cache.set(key, {
      value: url,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return url;
  });
};
