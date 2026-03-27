import { SitesRepository } from "../repository/sites.repository";

const sitesRepo = new SitesRepository();
const cache = new Map<string, { value: string; expiresAt: number }>();
const CACHE_TTL_MS = Number(
  process.env.URL_LOOKUP_CACHE_TTL_MS ?? 3 * 60 * 60 * 1000,
);

export const urlLookupService = async (projectId: string) => {
  const cached = cache.get(projectId);
  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.value);
  }
  if (cached) cache.delete(projectId);

  return sitesRepo.fetchSite(projectId).then((url) => {
    cache.set(projectId, { value: url, expiresAt: Date.now() + CACHE_TTL_MS });
    return url;
  });
};
