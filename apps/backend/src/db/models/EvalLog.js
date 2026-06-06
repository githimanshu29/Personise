import mongoose from "mongoose";

const EvalLogSchema = new mongoose.Schema(
  {
    eval_id: { type: String, required: true, unique: true },
    session_id: { type: String, index: true },
    message_index: { type: Number },
    question: { type: String, required: true },
    response: { type: String, required: true },
    retrieved_chunks: [
      {
        chunk_id: String,
        score: Number,
        content_excerpt: String,
      },
    ],
    scores: {
      groundedness: { type: Number, min: 0, max: 1 },
      faithfulness: { type: Number, min: 0, max: 1 },
      answer_relevance: { type: Number, min: 0, max: 1 },
      retrieval_precision: { type: Number, min: 0, max: 1 },
      hallucination_detected: { type: Boolean },
      citation_accuracy: { type: Number, min: 0, max: 1 },
    },
    judge_reasoning: { type: String },
    model_used: { type: String },
    latency_ms: { type: Number },
    eval_type: { type: String, enum: ["auto", "golden", "manual"] },
  },
  { timestamps: true },
);

export const EvalLog = mongoose.model("EvalLog", EvalLogSchema);
