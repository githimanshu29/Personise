import { ChatGroq } from "@langchain/groq";

let client = null;

function getClient() {
  if (!client) {
    client = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.FALLBACK_MODEL || "llama-3.1-70b-versatile",
    });
  }
  return client;
}

export async function invokeGroq(systemPrompt, userMessage, options = {}) {
  const model = getClient();
  const response = await model.invoke(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    options,
  );
  return { content: response.content };
}
