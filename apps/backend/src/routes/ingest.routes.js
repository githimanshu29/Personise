import express from "express";
import { runIngestion } from "../rag/ingestion/pipeline.js";
import { authGuard } from "../middleware/authGuard.js";

const router = express.Router();

router.post("/trigger", authGuard, async (req, res) => {
  const resumePath = process.env.RESUME_PATH;
  const githubUsername = process.env.GITHUB_USERNAME;
  const githubToken = process.env.GITHUB_TOKEN;

  const total = await runIngestion({ resumePath, githubUsername, githubToken });
  res.json({ job_id: "ingest_direct", status: "completed", chunks: total });
});

export default router;
