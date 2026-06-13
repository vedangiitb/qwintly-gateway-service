export type EnvType = "prod" | "dev";

export type ProjectInfo =
  | {
      kind: "project";
      projectId: string;
      env: EnvType;
    }
  | {
      kind: "preview";
      genId: string;
      env: EnvType;
    };

export interface ParsedHost {
  host: string;
  subdomain: string;
}
