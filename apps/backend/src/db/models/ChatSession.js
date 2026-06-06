import mongoose from "mongoose";

const ChatSessionSchema = new mongoose.Schema(
  {
    session_id: { type: String, required: true, unique: true, index: true },
    channel: { type: String, enum: ["chat", "voice"], default: "chat" },
    messages: [
      {
        role: { type: String, enum: ["user", "assistant", "system"] },
        content: { type: String },
        citations: [
          {
            chunk_id: String,
            source_type: String,
            source_id: String,
            confidence: Number,
            excerpt: String,
          },
        ],
        confidence_score: { type: Number, min: 0, max: 1 },
        model_used: { type: String },
        latency_ms: { type: Number },
        was_reflected: { type: Boolean, default: false },
        eval_score: { type: Number },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    booking_state: {
      status: {
        type: String,
        enum: ["none", "collecting", "confirming", "booked", "failed"],
      },
      collected_availability: { type: String },
      proposed_slots: [{ type: String }],
      confirmed_slot: { type: String },
      booking_url: { type: String },
      cal_booking_id: { type: String },
    },
    agent_trace: [
      {
        node_name: { type: String },
        entry_time: { type: Date },
        exit_time: { type: Date },
        retry_count: { type: Number },
        outcome: {
          type: String,
          enum: ["success", "fallback", "error", "skipped"],
        },
      },
    ],
    meta: {
      ip_hash: { type: String },
      user_agent_hash: { type: String },
      started_at: { type: Date, default: Date.now },
      last_active: { type: Date, default: Date.now },
      total_messages: { type: Number, default: 0 },
      flagged_for_adversarial: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

export const ChatSession = mongoose.model("ChatSession", ChatSessionSchema);
