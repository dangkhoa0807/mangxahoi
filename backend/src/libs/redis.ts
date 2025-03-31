import { Redis } from "ioredis";
import { redisConfig } from "@/queues/config";

const redis = new Redis({
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
});

export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
}

export async function setCache(
  key: string,
  data: any,
  ttlInSeconds: number = 300
): Promise<void> {
  await redis.set(key, JSON.stringify(data), "EX", ttlInSeconds);
}

export async function deleteCache(key: string): Promise<void> {
  await redis.del(key);
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export default redis;
