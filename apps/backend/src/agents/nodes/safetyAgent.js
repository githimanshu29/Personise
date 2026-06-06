import {
  SAFETY_SYSTEM_PROMPT,
  SAFETY_REFUSAL_MESSAGE,
} from "../../llm/promptTemplates.js";
import { modelOrchestrator } from "../../llm/modelOrchestrator.js";
import { withTimeout } from "../../utils/bounded.js";

export async function safetyAgent(state) {
  if (state.intent === "adversarial") {
    return {
      ...state,
      safety_verdict: "injection",
      safety_reason: "heuristic",
      final_response: SAFETY_REFUSAL_MESSAGE,
    };
  }

  try {
    const result = await withTimeout(
      modelOrchestrator.invoke(
        SAFETY_SYSTEM_PROMPT(state.user_message || ""),
        "",
        { max_tokens: 150, temperature: 0 },
      ),
      3000,
      "safety check",
    );
    const parsed = JSON.parse(result.content || "{}");
    if (parsed.verdict && parsed.verdict !== "safe") {
      return {
        ...state,
        safety_verdict: parsed.verdict,
        safety_reason: parsed.reason || "",
        final_response: SAFETY_REFUSAL_MESSAGE,
      };
    }
    return { ...state, safety_verdict: "safe" };
  } catch (err) {
    return {
      ...state,
      safety_verdict: "error",
      safety_reason: "safety check failed",
      final_response:
        "I'm having trouble processing that right now. Could you rephrase?",
    };
  }
}
