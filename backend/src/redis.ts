import "dotenv/config";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

// Upstash and other TLS providers use rediss:// — enable TLS automatically
const isTls = redisUrl.startsWith("rediss://");

export const redis = new IORedis(redisUrl, {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: false,
  keepAlive: 10000,
  tls: isTls ? {} : undefined,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  reconnectOnError(err) {
    const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"];
    if (targetErrors.some((e) => err.message.includes(e))) {
      return true; // Force reconnect
    }
    return false;
  },
});

redis.on("connect", () => console.log("✅  Redis connected"));
redis.on("error", (err) => {
  // Suppress harmless transient connection resets in log output
  if (err.message.includes("ECONNRESET")) return;
  console.error("❌  Redis error:", err.message);
});
