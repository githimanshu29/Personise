import { EventEmitter } from "events";
import { invokeGemini } from "./geminiClient.js";
import { invokeGroq } from "./groqClient.js";
import { redisClient } from "../db/redis.js";

class ModelOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.currentModel = process.env.PRIMARY_MODEL || "gemini-1.5-flash-latest";
  }

  async invoke(systemPrompt, userMessage, options = {}, attempt = 0) {
    const model = await this.selectModel();
    try {
      if (model.startsWith("gemini")) {
        this.currentModel = model;
        return await invokeGemini(systemPrompt, userMessage, options);
      }
      this.currentModel = model;
      return await invokeGroq(systemPrompt, userMessage, options);
    } catch (err) {
      await this.handleModelError(err, model);
      const fallback = model.startsWith("gemini")
        ? process.env.FALLBACK_MODEL || "llama-3.1-70b-versatile"
        : process.env.PRIMARY_MODEL || "gemini-1.5-flash-latest";
      this.currentModel = fallback;
      if (attempt >= 1) throw err;
      this.emit("model_switched", {
        from: model,
        to: fallback,
        reason: err.message,
      });
      return this.invoke(systemPrompt, userMessage, options, attempt + 1);
    }
  }

  async handleModelError(err, model) {
    if (err.status === 429 || String(err.message || "").includes("quota")) {
      const provider = model.startsWith("gemini") ? "gemini" : "groq";
      const cooldownSeconds = 60;
      await redisClient.set(
        `model_cooldown:${provider}`,
        Date.now() + cooldownSeconds * 1000,
        "PX",
        cooldownSeconds * 1000,
      );
    }
  }

  async selectModel() {
    const geminiCooldown = await redisClient.get("model_cooldown:gemini");
    const groqCooldown = await redisClient.get("model_cooldown:groq");
    if (!geminiCooldown)
      return process.env.PRIMARY_MODEL || "gemini-1.5-flash-latest";
    if (!groqCooldown)
      return process.env.FALLBACK_MODEL || "llama-3.1-70b-versatile";
    throw new Error("ALL_MODELS_EXHAUSTED");
  }
}

export const modelOrchestrator = new ModelOrchestrator();
