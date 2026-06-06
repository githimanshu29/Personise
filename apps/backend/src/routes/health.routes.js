import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
  res.json({ status: "ok" });
});

export default router;
