import { Elysia, t } from "elysia";
import { redis } from "./lib/redis";
import { roomRoutes } from "./routes/room";

const app = new Elysia()

  // ── All API routes ─────────────────────────────────────
  .use(roomRoutes)

  // ── Simple HTTP routes for testing ─────────────────────
  .get("/", () => "Hello from TKD Scoring Backend!")

  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    redisConnected: !!redis,
  }))

  .get("/test-redis", async () => {
    try {
      await redis.set("test:hello", "world", { ex: 60 });
      const value = await redis.get("test:hello");
      return { success: true, message: "Redis is working!", value };
    } catch (err) {
      console.error(err);
      return { success: false, error: (err as Error).message };
    }
  })

  // ── WebSocket route ────────────────────────────────────
  .ws("/ws", {
    // Optional: add query params later (e.g. ?room=ABC123&token=xxx)
    open(ws) {
      console.log("New WebSocket connection opened");
      ws.send({ type: "welcome", message: "Connected to TKD Scoring WS" });
    },

    message(ws, message) {
      console.log("Received message:", message);

      // For now just echo back
      ws.send({
        type: "echo",
        received: message,
        timestamp: Date.now(),
      });
    },

    close(ws, code, reason) {
      console.log("WebSocket closed", { code, reason });
    },
  })

  .listen({
    port: Number(process.env.PORT) || 3001,
  });

console.log(`🚀 Backend running at http://localhost:${app.server?.port}`);
console.log(`WebSocket at ws://localhost:${app.server?.port}/ws`);
