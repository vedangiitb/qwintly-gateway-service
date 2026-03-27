const ALLOWED_TARGET_HOST_SUFFIX =
  process.env.ALLOWED_TARGET_HOST_SUFFIX || ".run.app";

export const isAllowedTarget = (target: string): boolean => {
  try {
    const url = new URL(target);
    if (url.protocol !== "https:") return false;
    return url.hostname.endsWith(ALLOWED_TARGET_HOST_SUFFIX);
  } catch {
    return false;
  }
};
