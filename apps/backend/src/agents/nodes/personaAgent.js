import { PERSONA_SYSTEM_PROMPT } from "../../llm/promptTemplates.js";
import { modelOrchestrator } from "../../llm/modelOrchestrator.js";
import { withBoundedRetry } from "../../utils/bounded.js";

function formatContextBlock(chunks) {
  return (chunks || [])
    .map((c) => `Chunk ${c.chunk_id || ""}\n${c.content || ""}`)
    .join("\n\n");
}

function formatConversationHistory(history) {
  return (history || []).map((m) => `${m.role}: ${m.content}`).join("\n");
}

export async function personaAgent(state) {
  const maxRetries = parseInt(process.env.MAX_LLM_RETRIES || "3");
  const contextBlock = formatContextBlock(state.verified_chunks);
  const conversationCtx = formatConversationHistory(
    state.conversation_history.slice(-4),
  );
  const systemPrompt = PERSONA_SYSTEM_PROMPT({
    isVoice: state.is_voice,
    contextBlock,
    conversationHistory: conversationCtx,
  });
  const userTurn = `Question: ${state.user_message}`;

  try {
    const response = await withBoundedRetry(
      () =>
        modelOrchestrator.invoke(systemPrompt, userTurn, {
          temperature: 0.3,
          max_tokens: state.is_voice ? 200 : 600,
        }),
      maxRetries,
      "persona",
    );

    const answer = response.content || "";
    const citations = (state.verified_chunks || []).map((c) => ({
      chunk_id: c.chunk_id,
      source_type: c.metadata?.source_type,
      source_id: c.metadata?.source_id,
      confidence: c.score || 0.8,
      excerpt: (c.content || "").slice(0, 120),
    }));
    const confidence = Math.min(1, 0.6 + citations.length * 0.1);
    return {
      ...state,
      draft_response: answer,
      final_response: answer,
      citations,
      confidence_score: confidence,
      model_used: modelOrchestrator.currentModel,
    };
  } catch (err) {
    return {
      ...state,
      error: err.message,
      error_type: "llm",
      final_response:
        "I'm having trouble responding right now. Please try again.",
    };
  }
}
