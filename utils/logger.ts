export type LogLevel = "info" | "warn" | "error";

export const logJson = (
  level: LogLevel,
  msg: string,
  extra: Record<string, unknown> = {},
) => {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      level,
      msg,
      ...extra,
    }),
  );
};
