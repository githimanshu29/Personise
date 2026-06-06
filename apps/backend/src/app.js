import express from "express";
import cors from "cors";
import helmet from "helmet";
import chatRoutes from "./routes/chat.routes.js";
import healthRoutes from "./routes/health.routes.js";
import voiceRoutes from "./routes/voice.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import ingestRoutes from "./routes/ingest.routes.js";
import evalRoutes from "./routes/eval.routes.js";
import { requestId } from "./middleware/requestId.js";
import { globalErrorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(requestId);

app.use("/api/chat", chatRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/ingest", ingestRoutes);
app.use("/api/eval", evalRoutes);
app.use("/api/health", healthRoutes);

app.use(globalErrorHandler);

export default app;
