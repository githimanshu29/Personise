import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

let embedder = null;

function getEmbedder() {
  if (!embedder) {
    embedder = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.EMBED_MODEL || "text-embedding-004",
    });
  }
  return embedder;
}

export async function embedText(text) {
  const model = getEmbedder();
  const vector = await model.embedQuery(text);
  return vector;
}

export async function embedTexts(texts) {
  const model = getEmbedder();
  const vectors = await model.embedDocuments(texts);
  return vectors;
}
