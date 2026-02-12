import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";
import { redis } from "../lib/redis";
import type { RoomData } from "@take-wondo/shared"; // ← type-only import

export const roomRoutes = new Elysia({ prefix: "/api/rooms" })

  // ── CREATE ROOM ────────────────────────────────────────
  .post(
    "/",
    async ({ body, set }) => {
      const { password } = body;

      if (!password || password.length < 4) {
        set.status = 400;
        return {
          success: false,
          error: "Password must be at least 4 characters",
        };
      }

      // Generate unique 6-char room code
      let roomCode = nanoid(6).toUpperCase();

      // Collision check (rare, but safe)
      let attempts = 0;
      let existingRoom = null;

      while (attempts < 5) {
        existingRoom = await redis.get(`room:${roomCode}`);
        if (!existingRoom) break;
        roomCode = nanoid(6).toUpperCase();
        attempts++;
      }

      if (existingRoom) {
        set.status = 500;
        return {
          success: false,
          error: "Failed to generate unique code, try again",
        };
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Initial room data
      const roomData = {
        passwordHash,
        createdAt: Date.now(),
        // Later: config, match, referees, signals, etc.
      };

      // Save with 48h expiry
      await redis.set(`room:${roomCode}`, roomData, { ex: 172800 });

      console.log(`Room created: ${roomCode}`);

      return {
        success: true,
        roomCode,
        message: "Room created successfully",
      };
    },
    {
      body: t.Object({
        password: t.String(),
      }),
    },
  )

  // ── JOIN ROOM ──────────────────────────────────────────
  .post(
    "/:code/join",
    async ({ params, body, set }) => {
      const { code } = params;
      const { password } = body;

      if (!password) {
        set.status = 400;
        return { success: false, error: "Password is required" };
      }

      const roomKey = `room:${code.toUpperCase()}`;
      const room = await redis.get<RoomData>(roomKey); // ← generic type

      if (!room) {
        set.status = 404;
        return { success: false, error: "Room not found or expired" };
      }

      // TypeScript now knows room has passwordHash
      const isValid = await bcrypt.compare(password, room.passwordHash);

      if (!isValid) {
        set.status = 401;
        return { success: false, error: "Incorrect password" };
      }

      return {
        success: true,
        message: "Joined successfully",
        roomCode: code.toUpperCase(),
      };
    },
    {
      params: t.Object({
        code: t.String(),
      }),
      body: t.Object({
        password: t.String(),
      }),
    },
  );
