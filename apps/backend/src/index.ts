import { Elysia, t } from "elysia";
import { redis } from "./lib/redis";

const app = new Elysia()
  .get("/", () => "Hello from TKD Scoring Backend!")

  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    redisConnected: !!redis,
  }))

  // Simple test endpoint to write & read from Redis
  .get("/test-redis", async () => {
    try {
      // Write a test key
      await redis.set("test:hello", "world", { ex: 60 }); // expires in 60 seconds
      // Read it back
      const value = await redis.get("test:hello");
      return {
        success: true,
        message: "Redis is working!",
        value,
      };
    } catch (err) {
      console.error(err);
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  })

  .listen({
    port: Number(process.env.PORT) || 3001,
  });

console.log(`🚀 Backend running at http://localhost:${app.server?.port}`);
