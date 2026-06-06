import { connectMongo } from "../apps/backend/src/db/mongo.js";
import { buildPersonaGraph } from "../apps/backend/src/agents/graph.js";
import { DEFAULT_STATE } from "../apps/backend/src/agents/state.js";

await connectMongo();

const dataset = [
  { id: "GD001", question: "Where are you studying?" },
  { id: "GD002", question: "Tell me about your key projects." },
];

for (const test of dataset) {
  const result = await buildPersonaGraph().invoke({
    ...DEFAULT_STATE,
    session_id: `eval_${test.id}`,
    user_message: test.question,
  });
  console.log(test.id, result.final_response);
}
