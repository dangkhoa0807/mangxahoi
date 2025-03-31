export const redisConfig = {
  host: process.env.REDIS_HOST_NAME,
  port: parseInt(process.env.REDIS_PORT ?? "6379"),
  password: process.env.REDIS_PASSWORD ?? "",
};
