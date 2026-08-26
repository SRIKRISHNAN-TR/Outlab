import "dotenv/config";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

export const redis = new IORedis(redisUrl, {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: false,
});

redis.on("connect", () => console.log("✅  Redis connected"));
redis.on("error", (err) => console.error("❌  Redis error:", err.message));
