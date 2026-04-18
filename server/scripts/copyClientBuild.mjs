import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDistPath = path.resolve(__dirname, "../../client/dist");
const targetPublicPath = path.resolve(__dirname, "../public");

if (!fs.existsSync(sourceDistPath)) {
  throw new Error(`Client build not found at ${sourceDistPath}. Run client build first.`);
}

fs.rmSync(targetPublicPath, { recursive: true, force: true });
fs.mkdirSync(targetPublicPath, { recursive: true });
fs.cpSync(sourceDistPath, targetPublicPath, { recursive: true });

console.log(`Copied client build from ${sourceDistPath} to ${targetPublicPath}`);
