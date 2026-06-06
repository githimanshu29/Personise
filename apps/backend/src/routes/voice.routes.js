import crypto from "crypto";
import express from "express";
import { buildPersonaGraph } from "../agents/graph.js";
import { DEFAULT_STATE } from "../agents/state.js";

const router = express.Router();

router.post("/vapi-llm", async (req, res) => {
  const { messages, call } = req.body || {};
  const sessionId = call?.id || crypto.randomUUID();
  const latest = messages?.[messages.length - 1]?.content || "";
  const history = (messages || [])
    .slice(-6, -1)
    .map((m) => ({ role: m.role, content: m.content }));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const graph = buildPersonaGraph();
    const result = await graph.invoke({
      ...DEFAULT_STATE,
      session_id: sessionId,
      user_message: latest,
      conversation_history: history,
      is_voice: true,
      channel: "voice",
    });

    const text = result.final_response || "";
    const words = text.split(" ");
    for (let i = 0; i < words.length; i += 6) {
      const chunk =
        words.slice(i, i + 6).join(" ") + (i + 6 < words.length ? " " : "");
      res.write(
        `data: ${JSON.stringify({ choices: [{ delta: { content: chunk }, finish_reason: null }] })}\n\n`,
      );
    }
    res.write(
      `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}\n\n`,
    );
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    res.write(
      `data: ${JSON.stringify({ choices: [{ delta: { content: "I'm experiencing a technical issue. Could you repeat that?" }, finish_reason: null }] })}\n\n`,
    );
    res.write(
      `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}\n\n`,
    );
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

router.post("/webhook", async (req, res) => {
  res.json({ received: true });
});

export default router;
