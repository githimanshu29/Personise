import fs from "fs/promises";
import path from "path";
import { connectMongo, disconnectMongo } from "../apps/backend/src/db/mongo.js";
import { runIngestion } from "../apps/backend/src/rag/ingestion/pipeline.js";

await loadBackendEnv();

console.log("Connecting to MongoDB...");
await connectMongo();
console.log("MongoDB connected. Starting ingestion...");

try {
  const total = await runIngestion({
    resumePath: process.env.RESUME_PATH,
    githubUsername: process.env.GITHUB_USERNAME,
    githubToken: process.env.GITHUB_TOKEN,
  });

  console.log(`Ingested chunks: ${total}`);
} finally {
  await disconnectMongo();
}

async function loadBackendEnv() {
  const envPath = path.resolve(process.cwd(), "apps", "backend", ".env");
  const raw = await fs.readFile(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}
