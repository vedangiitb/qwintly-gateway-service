export const isAllowedTarget = (
  target: string,
  env: { ALLOWED_TARGET_HOST_SUFFIX?: string }
): boolean => {
  try {
    const url = new URL(target);
    if (url.protocol !== "https:") return false;
    const suffix = env.ALLOWED_TARGET_HOST_SUFFIX || ".run.app";
    return url.hostname.endsWith(suffix);
  } catch {
    return false;
  }
};
