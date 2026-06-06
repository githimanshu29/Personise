import fs from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";
import { chunkPlainText } from "./chunker.js";
import { embedTexts } from "./embedder.js";
import { PersonaChunk } from "../../db/models/PersonaChunk.js";

export async function ingestResume(resumePath) {
  const resolved = await resolvePath(resumePath);
  const buffer = await fs.readFile(resolved);
  const parsed = await pdfParse(buffer);
  const text = parsed.text || "";

  const chunks = chunkPlainText(text, {
    source_type: "resume",
    source_id: "resume",
    section: "resume",
    tags: ["resume"],
  });

  const embeddings = await embedTexts(chunks.map((c) => c.content));

  const docs = chunks.map((chunk, idx) => ({
    ...chunk,
    embedding: embeddings[idx],
    metadata: {
      ...chunk.metadata,
      ingested_at: new Date(),
    },
  }));

  try {
    await PersonaChunk.insertMany(docs, { ordered: false });
  } catch (err) {
    if (!String(err.message || "").includes("E11000")) throw err;
  }
  return docs.length;
}

async function resolvePath(inputPath) {
  if (!inputPath) throw new Error("RESUME_PATH is required");
  const normalized = inputPath.replace(/^(\.\.[/\\])+/, "");
  const candidates = [
    path.resolve(process.cwd(), inputPath),
    path.resolve(process.cwd(), normalized),
    path.resolve(process.cwd(), "apps", "backend", inputPath),
    path.resolve(process.cwd(), "..", inputPath),
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error(`Resume file not found for RESUME_PATH=${inputPath}`);
}
