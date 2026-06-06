import Redis from "ioredis";

export let redisClient = null;
export let redisBacked = false;

export async function connectRedis() {
  if (redisClient) return;
  const url = process.env.REDIS_URL;
  if (!url) {
    redisClient = new InMemoryRedis();
    redisBacked = false;
    return redisClient;
  }
  redisClient = new Redis(url);
  redisBacked = true;
  return redisClient;
}

class InMemoryRedis {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    const record = this.store.get(key);
    if (!record) return null;
    if (record.expiresAt && record.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return record.value;
  }

  async set(key, value, mode, duration) {
    const expiresAt = mode === "PX" ? Date.now() + Number(duration) : null;
    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  async setex(key, seconds, value) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + Number(seconds) * 1000,
    });
    return "OK";
  }
}
