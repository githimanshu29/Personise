import { REFLECTION_PROMPT } from "../../llm/promptTemplates.js";
import { modelOrchestrator } from "../../llm/modelOrchestrator.js";
import { withTimeout } from "../../utils/bounded.js";

export async function reflectionAgent(state) {
  try {
    const prompt = REFLECTION_PROMPT({
      question: state.user_message || "",
      draftResponse: state.draft_response || "",
      evidenceChunks: (state.verified_chunks || [])
        .map((c) => c.content)
        .join("\n\n"),
      reflectionCount: state.reflection_count,
    });

    const result = await withTimeout(
      modelOrchestrator.invoke(prompt, "", { max_tokens: 300, temperature: 0 }),
      4000,
      "reflection",
    );

    const parsed = JSON.parse(result.content || "{}");
    if (parsed.needs_revision === false) {
      return {
        ...state,
        reflection_count: state.reflection_count + 1,
        needs_reflection: false,
      };
    }

    return {
      ...state,
      draft_response: parsed.revised_response || state.draft_response,
      final_response: parsed.revised_response || state.final_response,
      reflection_count: state.reflection_count + 1,
      needs_reflection: false,
    };
  } catch (err) {
    return {
      ...state,
      reflection_count: state.reflection_count + 1,
      needs_reflection: false,
    };
  }
}
