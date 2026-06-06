import express from "express";
import { EvalLog } from "../db/models/EvalLog.js";

const router = express.Router();

router.get("/report", async (req, res) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const logs = await EvalLog.find({ createdAt: { $gte: since } });
  const total = logs.length;
  const avg = (arr) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const groundedness = avg(logs.map((l) => l.scores?.groundedness || 0));
  const faithfulness = avg(logs.map((l) => l.scores?.faithfulness || 0));
  const hallucination = logs.filter(
    (l) => l.scores?.hallucination_detected,
  ).length;

  res.json({
    period: "last_24h",
    total_responses: total,
    avg_groundedness: groundedness,
    avg_faithfulness: faithfulness,
    hallucination_rate: total ? hallucination / total : 0,
    avg_latency_ms: 0,
    booking_success_rate: 0,
  });
});

export default router;
