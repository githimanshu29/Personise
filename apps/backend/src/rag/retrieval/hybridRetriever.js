import { PersonaChunk } from "../../db/models/PersonaChunk.js";
import { embedText } from "../ingestion/embedder.js";

class HybridRetriever {
  async retrieve(query, options = {}) {
    const { topK = 5, filter = {}, minScore = 0.65 } = options;
    const queryEmbedding = await embedText(query);
    const vectorResults = await this.vectorSearch(queryEmbedding, {
      topK,
      filter,
      minScore,
    });
    const textResults = await this.textSearch(query, { limit: topK, filter });
    const merged = new Map();
    for (const result of [...vectorResults, ...textResults]) {
      const id = result.chunk_id || String(result._id);
      const existing = merged.get(id);
      if (!existing || (result.score || 0) > (existing.score || 0)) {
        merged.set(id, result);
      }
    }
    return [...merged.values()]
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, topK);
  }

  async vectorSearch(embedding, options) {
    try {
      const res = await PersonaChunk.aggregate([
        {
          $vectorSearch: {
            index: "persona_chunks_vector_index",
            path: "embedding",
            queryVector: embedding,
            numCandidates: options.topK * 10,
            limit: options.topK,
            filter: options.filter,
          },
        },
        {
          $project: {
            content: 1,
            metadata: 1,
            chunk_id: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ]);
      return res.filter((r) => r.score >= (options.minScore || 0));
    } catch (err) {
      return [];
    }
  }

  async textSearch(query, options) {
    try {
      const results = await PersonaChunk.find(
        { $text: { $search: query }, ...options.filter },
        { score: { $meta: "textScore" }, content: 1, metadata: 1, chunk_id: 1 },
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(options.limit)
        .lean();
      if (results.length > 0) return results;
    } catch (err) {
      return this.lexicalFallbackSearch(query, options);
    }
    return this.lexicalFallbackSearch(query, options);
  }

  async lexicalFallbackSearch(query, options) {
    const terms = tokenize(query).slice(0, 8);
    if (terms.length === 0) return [];

    const regexes = terms.map((term) => new RegExp(escapeRegex(term), "i"));
    const candidates = await PersonaChunk.find({
      ...options.filter,
      $or: regexes.map((regex) => ({ content: regex })),
    })
      .select({ content: 1, metadata: 1, chunk_id: 1 })
      .limit(Math.max(options.limit * 4, 20))
      .lean();

    return candidates
      .map((candidate) => ({
        ...candidate,
        score: lexicalScore(candidate.content || "", terms),
      }))
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit);
  }
}

export const hybridRetriever = new HybridRetriever();

const STOPWORDS = new Set([
  "about",
  "because",
  "does",
  "for",
  "from",
  "good",
  "himanshu",
  "role",
  "that",
  "the",
  "this",
  "what",
  "why",
  "with",
]);

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((term) => term.length >= 3 && !STOPWORDS.has(term));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lexicalScore(content, terms) {
  const lower = content.toLowerCase();
  const matches = terms.filter((term) => lower.includes(term)).length;
  return matches / Math.max(terms.length, 1);
}
