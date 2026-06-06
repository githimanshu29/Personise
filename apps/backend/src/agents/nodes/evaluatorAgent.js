import { EVALUATOR_PROMPT } from "../../llm/promptTemplates.js";
import { modelOrchestrator } from "../../llm/modelOrchestrator.js";
import { withTimeout } from "../../utils/bounded.js";
import { EvalLog } from "../../db/models/EvalLog.js";
import { v4 as uuidv4 } from "uuid";

export async function evaluatorAgent(state) {
  const maxRef = parseInt(process.env.MAX_REFLECTION_RETRIES || "2");
  if (state.reflection_count >= maxRef) {
    return { ...state, needs_reflection: false };
  }

  try {
    const prompt = EVALUATOR_PROMPT({
      question: state.user_message || "",
      response: state.draft_response || "",
      evidence: (state.verified_chunks || [])
        .map((c) => c.content)
        .join("\n---\n"),
    });

    const result = await withTimeout(
      modelOrchestrator.invoke(prompt, "", { max_tokens: 200, temperature: 0 }),
      3000,
      "evaluator",
    );

    const parsed = JSON.parse(result.content || "{}");
    const evalDoc = {
      eval_id: uuidv4(),
      session_id: state.session_id,
      message_index: state.conversation_history.length,
      question: state.user_message || "",
      response: state.draft_response || "",
      scores: {
        groundedness: parsed.groundedness || 0,
        faithfulness: parsed.faithfulness || 0,
        answer_relevance: parsed.answer_relevance || 0,
        hallucination_detected: parsed.hallucination_detected || false,
      },
      model_used: state.model_used,
      eval_type: "auto",
    };
    EvalLog.create(evalDoc).catch(() => {});
    return {
      ...state,
      eval_result: parsed,
      needs_reflection: parsed.needs_reflection === true,
    };
  } catch (err) {
    return { ...state, needs_reflection: false };
  }
}
