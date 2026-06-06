import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

let client = null;

function getClient() {
  if (!client) {
    client = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.PRIMARY_MODEL || "gemini-1.5-flash-latest",
    });
  }
  return client;
}

export async function invokeGemini(systemPrompt, userMessage, options = {}) {
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
