import { StateGraph, END } from "@langchain/langgraph";
import { DEFAULT_STATE } from "./state.js";
import { routerAgent } from "./nodes/routerAgent.js";
import { safetyAgent } from "./nodes/safetyAgent.js";
import { retrievalAgent } from "./nodes/retrievalAgent.js";
import { verifierAgent } from "./nodes/verifierAgent.js";
import { personaAgent } from "./nodes/personaAgent.js";
import { reflectionAgent } from "./nodes/reflectionAgent.js";
import { evaluatorAgent } from "./nodes/evaluatorAgent.js";
import { calendarAgent } from "./nodes/calendarAgent.js";
import { responseNode } from "./nodes/responseNode.js";

export function buildPersonaGraph() {
  const graph = new StateGraph({ channels: DEFAULT_STATE });

  graph.addNode("router", routerAgent);
  graph.addNode("safety", safetyAgent);
  graph.addNode("retrieval", retrievalAgent);
  graph.addNode("verifier", verifierAgent);
  graph.addNode("persona", personaAgent);
  graph.addNode("reflection", reflectionAgent);
  graph.addNode("evaluator", evaluatorAgent);
  graph.addNode("calendar", calendarAgent);
  graph.addNode("response", responseNode);

  graph.setEntryPoint("router");

  graph.addConditionalEdges(
    "router",
    (state) => {
      if (state.intent === "adversarial") return "safety";
      if (state.intent === "greeting") return "response";
      if (state.intent === "booking") return "calendar";
      if (state.safety_verdict === "injection") return "response";
      return "retrieval";
    },
    {
      safety: "safety",
      retrieval: "retrieval",
      calendar: "calendar",
      response: "response",
    },
  );

  graph.addConditionalEdges(
    "safety",
    (state) => {
      if (state.safety_verdict === "safe") return "retrieval";
      return "response";
    },
    { retrieval: "retrieval", response: "response" },
  );

  graph.addEdge("retrieval", "verifier");

  graph.addConditionalEdges(
    "verifier",
    (state) => {
      if (!state.has_sufficient_evidence) return "response";
      return "persona";
    },
    { persona: "persona", response: "response" },
  );

  graph.addEdge("persona", "evaluator");

  graph.addConditionalEdges(
    "evaluator",
    (state) => {
      const maxRef = parseInt(process.env.MAX_REFLECTION_RETRIES || "2");
      return state.needs_reflection && state.reflection_count < maxRef
        ? "reflection"
        : "response";
    },
    { reflection: "reflection", response: "response" },
  );

  graph.addConditionalEdges(
    "reflection",
    (state) => {
      const maxRef = parseInt(process.env.MAX_REFLECTION_RETRIES || "2");
      return state.reflection_count >= maxRef ? "response" : "persona";
    },
    { persona: "persona", response: "response" },
  );

  graph.addEdge("calendar", "response");
  graph.addEdge("response", END);

  return graph.compile();
}
