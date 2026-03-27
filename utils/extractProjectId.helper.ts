export const extractProjectId = (
  hostHeader: string | undefined,
): string | null => {
  if (!hostHeader) return null;
  const host = hostHeader.split(":")[0].trim().toLowerCase();
  if (!host || host.includes("..")) return null;
  const labels = host.split(".");
  if (labels.length < 3) return null;
  const projectId = labels[0];
  if (!/^[a-z0-9-]+$/.test(projectId)) return null;
  return projectId;
};
