import { ROUTER_CLASSIFICATION_PROMPT } from "../../llm/promptTemplates.js";
import { modelOrchestrator } from "../../llm/modelOrchestrator.js";
import { withTimeout } from "../../utils/bounded.js";

const ADVERSARIAL_PATTERNS = [
  /ignore (previous|above|all) instructions/i,
  /you are now/i,
  /pretend (you are|to be)/i,
  /act as (a|an|your|my)/i,
  /\[system\]/i,
  /forget (everything|your|the) (previous|above|instructions)/i,
  /(jailbreak|dan mode|developer mode)/i,
  /new persona/i,
  /override your/i,
];

const BOOKING_PATTERNS = [
  /book|schedule|meeting|call|slot|calendar|availability|available|when can|interview/i,
];

const GREETING_PATTERNS = [
  /^(hi|hello|hey|what's up|sup|good morning|howdy)[\s!?.]*$/i,
];

export async function routerAgent(state) {
  const message = (state.user_message || "").toLowerCase().trim();

  if (ADVERSARIAL_PATTERNS.some((p) => p.test(message))) {
    return {
      ...state,
      intent: "adversarial",
      intent_confidence: 1,
      safety_verdict: "injection",
    };
  }

  if (GREETING_PATTERNS.some((p) => p.test(message))) {
    return { ...state, intent: "greeting", intent_confidence: 1 };
  }

  if (BOOKING_PATTERNS.some((p) => p.test(message))) {
    return { ...state, intent: "booking", intent_confidence: 0.9 };
  }

  try {
    const prompt = ROUTER_CLASSIFICATION_PROMPT(
      state.user_message || "",
      state.conversation_history.slice(-3),
    );
    const result = await withTimeout(
      modelOrchestrator.invoke(prompt, "", { max_tokens: 100, temperature: 0 }),
      2000,
      "router classification",
    );
    const parsed = JSON.parse(result.content || "{}");
    return {
      ...state,
      intent: parsed.intent || "qa",
      intent_confidence: parsed.confidence || 0.5,
      sub_intent: parsed.sub_intent || null,
    };
  } catch (err) {
    return {
      ...state,
      intent: "qa",
      intent_confidence: 0.5,
      node_errors: { ...state.node_errors, router: err.message },
    };
  }
}
