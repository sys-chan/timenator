import Redis from "ioredis";
import "dotenv/config";

export const redis = new Redis(process.env.REDIS_URL);

redis.on("error", (e) => console.error(e))