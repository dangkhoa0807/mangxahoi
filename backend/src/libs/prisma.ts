import { PrismaClient } from "@prisma/client";
import { pagination } from "prisma-extension-pagination";
import pino from "pino";
import { SuperJSON } from "superjson";

import {
  CacheCase,
  PrismaExtensionRedis,
  type AutoCacheConfig,
  type CacheConfig,
} from "prisma-extension-redis";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

const client = {
  host: process.env.REDIS_HOST_NAME,
  port: parseInt(process.env.REDIS_PORT ?? "6379"),
  password: process.env.REDIS_PASSWORD ?? "",
};

const logger = pino();

const auto: AutoCacheConfig = {
  excludedModels: [],
  excludedOperations: ["count"],
  models: [
    {
      model: "User",
      excludedOperations: ["count"],
      ttl: 300, // 5 minutes cache for user data
      stale: 60, // 1 minute stale time
    },
    {
      model: "Post",
      excludedOperations: ["count"],
      ttl: 180, // 3 minutes cache for posts
      stale: 30, // 30 seconds stale time
    },
    {
      model: "Profile",
      excludedOperations: ["count"],
      ttl: 300, // 5 minutes cache for profiles
      stale: 60, // 1 minute stale time
    },
    {
      model: "PrivacySettings",
      excludedOperations: ["count"],
      ttl: 600, // 10 minutes cache for privacy settings
      stale: 120, // 2 minutes stale time
    },
    {
      model: "NotificationSettings",
      excludedOperations: ["count"],
      ttl: 600, // 10 minutes cache for notification settings
      stale: 120, // 2 minutes stale time
    },
  ],
  ttl: 120, // Default 2 minutes TTL for other models
  stale: 30, // Default 30 seconds stale time
};

const config: CacheConfig = {
  ttl: 60, // Default Time-to-live for caching in seconds
  stale: 30, // Default Stale time after ttl in seconds
  auto, // Auto-caching options (configured above)
  logger, // Logger for cache events (configured above)
  transformer: {
    deserialize: (data) => {
      logger.debug({ data }, "Deserializing cache data");
      return SuperJSON.parse(data);
    },
    serialize: (data) => {
      logger.debug({ data }, "Serializing cache data");
      return SuperJSON.stringify(data);
    },
  },
  type: "JSON",
  cacheKey: {
    // Inbuilt cache key configuration
    case: CacheCase.SNAKE_CASE, // Select a cache case conversion option for generated keys from CacheCase
    delimiter: ":", // Delimiter for keys (default value: ':')
    prefix: "prisma", // Cache key prefix (default value: 'prisma')
  },
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function (): string {
  return this.toString();
};

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
const cachePrisma = prisma.$extends(PrismaExtensionRedis({ config, client }));

export default prisma.$extends(pagination());
export { cachePrisma };

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
