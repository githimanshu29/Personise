import { chunkMarkdown } from "./chunker.js";
import { embedTexts } from "./embedder.js";
import { PersonaChunk } from "../../db/models/PersonaChunk.js";

async function fetchJson(url, token) {
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`GitHub API error ${res.status}`);
  return res.json();
}

async function fetchText(url, token) {
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return null;
  return res.text();
}

function stripMarkdown(text) {
  return text.replace(/```[\s\S]*?```/g, "").replace(/[#>*_`]/g, "");
}

export async function ingestGitHub(username, token) {
  const repos = await fetchJson(
    `https://api.github.com/users/${username}/repos`,
    token,
  );
  let total = 0;

  for (const repo of repos) {
    const readme =
      (await fetchText(
        `https://raw.githubusercontent.com/${username}/${repo.name}/main/README.md`,
        token,
      )) ||
      (await fetchText(
        `https://raw.githubusercontent.com/${username}/${repo.name}/master/README.md`,
        token,
      ));

    if (readme) {
      const chunks = chunkMarkdown(stripMarkdown(readme), {
        source_type: "github_readme",
        source_id: repo.name,
        repo_name: repo.name,
        repo_url: repo.html_url,
        file_path: "README.md",
        tags: ["github"],
      });
      const embeddings = await embedTexts(chunks.map((c) => c.content));
      const docs = chunks.map((chunk, idx) => ({
        ...chunk,
        embedding: embeddings[idx],
        metadata: { ...chunk.metadata, ingested_at: new Date() },
      }));
      try {
        await PersonaChunk.insertMany(docs, { ordered: false });
      } catch (err) {
        if (!String(err.message || "").includes("E11000")) throw err;
      }
      total += docs.length;
    }
  }

  return total;
}
