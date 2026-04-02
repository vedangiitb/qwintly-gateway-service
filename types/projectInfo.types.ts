type ProjectInfo = {
  projectId: string;
  env: "prod" | "dev";
} | null;

type Env = "prod" | "dev";

type ParsedHost = {
  host: string;
  subdomain: string;
} | null;
