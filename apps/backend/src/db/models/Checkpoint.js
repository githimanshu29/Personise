import mongoose from "mongoose";

const CheckpointSchema = new mongoose.Schema(
  {
    session_id: { type: String, required: true, index: true },
    checkpoint_id: { type: String, required: true, unique: true },
    state: { type: mongoose.Schema.Types.Mixed, required: true },
    node_name: { type: String },
    thread_ts: { type: String },
    is_final: { type: Boolean, default: false },
  },
  { timestamps: true, expireAfterSeconds: 3600 },
);

export const Checkpoint = mongoose.model("Checkpoint", CheckpointSchema);
