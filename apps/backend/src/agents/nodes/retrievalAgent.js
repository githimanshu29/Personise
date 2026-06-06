import { QUERY_GENERATION_PROMPT } from "../../llm/promptTemplates.js";
import { modelOrchestrator } from "../../llm/modelOrchestrator.js";
import { withTimeout } from "../../utils/bounded.js";
import { hybridRetriever } from "../../rag/retrieval/hybridRetriever.js";

export async function retrievalAgent(state) {
  try {
    const prompt = QUERY_GENERATION_PROMPT(
      state.user_message || "",
      state.sub_intent,
    );
    const queryResult = await withTimeout(
      modelOrchestrator.invoke(prompt, "", {
        max_tokens: 150,
        temperature: 0.1,
      }),
      3000,
      "query generation",
    );
    const parsed = JSON.parse(queryResult.content || "{}");
    const queries =
      Array.isArray(parsed.queries) && parsed.queries.length
        ? parsed.queries
        : [state.user_message];

    const filter = buildSourceFilter(state.sub_intent);
    const results = await withTimeout(
      Promise.all(
        queries.map((q) =>
          hybridRetriever.retrieve(q, { topK: 5, minScore: 0.65, filter }),
        ),
      ),
      parseInt(process.env.VECTOR_SEARCH_TIMEOUT_MS || "5000"),
      "vector search",
    );

    const merged = results.flat();

    return { ...state, search_queries: queries, retrieved_chunks: merged };
  } catch (err) {
    return {
      ...state,
      retrieved_chunks: [],
      node_errors: { ...state.node_errors, retrieval: err.message },
    };
  }
}

function buildSourceFilter(subIntent) {
  if (subIntent === "github")
    return { "metadata.source_type": "github_readme" };
  if (subIntent === "resume") return { "metadata.source_type": "resume" };
  return {};
}
