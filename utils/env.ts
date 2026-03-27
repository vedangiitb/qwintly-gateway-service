import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const cwd = process.cwd();
const envLocalPath = path.join(cwd, ".env.local");
const envPath = path.join(cwd, ".env");

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
