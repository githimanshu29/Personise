import express from "express";
import { rateLimiter } from "../middleware/rateLimiter.js";
import { inputSanitizer } from "../middleware/inputSanitizer.js";
import { buildPersonaGraph } from "../agents/graph.js";
import { DEFAULT_STATE } from "../agents/state.js";
import { redisClient } from "../db/redis.js";
import { modelOrchestrator } from "../llm/modelOrchestrator.js";

const router = express.Router();

router.post("/stream", rateLimiter, inputSanitizer, async (req, res) => {
  const { session_id, message, history } = req.validated;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Session-Id", session_id);
  res.flushHeaders();

  const sendEvent = (data) => {
    if (res.writableEnded) return;
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let disconnected = false;
  req.on("close", () => {
    disconnected = true;
  });

  const masterTimeout = setTimeout(() => {
    if (!res.writableEnded) {
      sendEvent({
        type: "error",
        message: "Request timed out",
        code: "TIMEOUT",
      });
      sendEvent({ type: "done" });
      res.end();
    }
  }, 30000);

  let handleSwitch = null;
  try {
    const cacheKey = `response:${session_id}:${message}`;
    const cached = await redisClient.get(cacheKey);
    if (cached && !isBookingRelated(message)) {
      const parsed = JSON.parse(cached);
      sendEvent({ type: "token", content: parsed.response });
      sendEvent({ type: "citations", data: parsed.citations || [] });
      sendEvent({ type: "confidence", score: parsed.confidence || 0 });
      sendEvent({ type: "done" });
      clearTimeout(masterTimeout);
      return res.end();
    }

    handleSwitch = (payload) => {
      sendEvent({ type: "model_switched", from: payload.from, to: payload.to });
    };
    modelOrchestrator.on("model_switched", handleSwitch);

    const graph = buildPersonaGraph();
    const result = await graph.invoke({
      ...DEFAULT_STATE,
      session_id,
      request_id: req.id,
      user_message: message,
      conversation_history: (history || []).slice(-8),
      is_voice: false,
      channel: "chat",
    });

    if (!disconnected) {
      const text = result.final_response || "";
      const words = text.split(" ");
      for (let i = 0; i < words.length; i += 6) {
        const chunk =
          words.slice(i, i + 6).join(" ") + (i + 6 < words.length ? " " : "");
        sendEvent({ type: "token", content: chunk });
      }
      sendEvent({ type: "citations", data: result.citations || [] });
      sendEvent({ type: "confidence", score: result.confidence_score || 0 });
      sendEvent({ type: "model", name: result.model_used || "" });
      sendEvent({ type: "done" });
    }

    if (!isBookingRelated(message) && (result.confidence_score || 0) > 0.8) {
      await redisClient.setex(
        cacheKey,
        3600,
        JSON.stringify({
          response: result.final_response,
          citations: result.citations,
          confidence: result.confidence_score,
        }),
      );
    }
  } catch (err) {
    sendEvent({
      type: "error",
      message: "Something went wrong. Please try again.",
      code: "INTERNAL_ERROR",
    });
    sendEvent({ type: "done" });
  } finally {
    if (handleSwitch) modelOrchestrator.off("model_switched", handleSwitch);
    clearTimeout(masterTimeout);
    if (!res.writableEnded) res.end();
  }
});

export default router;

function isBookingRelated(message) {
  return /book|schedule|meeting|call|slot|calendar|availability|available|interview/i.test(
    message || "",
  );
}
