import mongoose from "mongoose";

const PersonaChunkSchema = new mongoose.Schema(
  {
    chunk_id: { type: String, required: true, unique: true, index: true },
    content: { type: String, required: true },
    content_hash: { type: String, required: true },
    embedding: { type: [Number], required: true },
    metadata: {
      source_type: { type: String, required: true },
      source_id: { type: String, required: true },
      section: { type: String },
      repo_name: { type: String },
      repo_url: { type: String },
      file_path: { type: String },
      commit_sha: { type: String },
      chunk_index: { type: Number, required: true },
      total_chunks: { type: Number, required: true },
      tags: [{ type: String }],
      language: { type: String, default: "en" },
      confidence_weight: { type: Number, default: 1.0 },
      ingested_at: { type: Date, default: Date.now },
      last_verified: { type: Date },
    },
  },
  { timestamps: true },
);

export const PersonaChunk = mongoose.model("PersonaChunk", PersonaChunkSchema);
