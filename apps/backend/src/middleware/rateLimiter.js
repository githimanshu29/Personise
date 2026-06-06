import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redisBacked, redisClient } from "../db/redis.js";

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000");
const max = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "30");

export const rateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisBacked
    ? new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
      })
    : undefined,
});
