type Env = "prod" | "dev";

type ProjectInfo =
  | {
      kind: "project";
      projectId: string;
      env: Env;
    }
  | {
      kind: "preview";
      genId: string;
      env: Env;
    }
  | null;

type ParsedHost = {
  host: string;
  subdomain: string;
} | null;
