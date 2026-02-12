import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";
import { redis } from "../lib/redis";
import type { RoomData } from "@take-wondo/shared";

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

      // Collision check (very rare)
      let attempts = 0;
      let existingRoom: unknown = null;

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

      // Full initial room data with defaults
      const roomData: RoomData = {
        passwordHash,
        createdAt: Date.now(),

        config: {
          votingWindowMs: 800,
          majorityPercent: 0.6,
          pointValues: {
            punch: 1,
            body: 1,
            bodyTurning: 2,
            head: 3,
            headTurning: 4,
          },
          rounds: 3,
          roundDuration: 120,
          breakDuration: 60,
          goldenPoint: false,
          maxPointGap: 0,
        },

        match: {
          phase: "ready" as const,
          currentRound: 1,
          roundTimeLeft: 120,
          breakTimeLeft: 60,
          isPaused: true,
          red: { name: "Red", score: 0 },
          blue: { name: "Blue", score: 0 },
        },

        referees: [],
      };

      // Save to Redis with 48h expiry
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
  // ── GET ROOM STATE ─────────────────────────────────────
  .get(
    "/:code",
    async ({ params, set }) => {
      const { code } = params;
      const roomKey = `room:${code.toUpperCase()}`;
      const room = await redis.get<RoomData>(roomKey);

      if (!room) {
        set.status = 404;
        return { success: false, error: "Room not found or expired" };
      }

      // Return everything except passwordHash
      const { passwordHash, ...safeRoom } = room;
      return safeRoom;
    },
    {
      params: t.Object({
        code: t.String(),
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
      const room = await redis.get<RoomData>(roomKey);

      if (!room) {
        set.status = 404;
        return { success: false, error: "Room not found or expired" };
      }

      // Verify password
      const isValid = await bcrypt.compare(password, room.passwordHash);

      if (!isValid) {
        set.status = 401;
        return { success: false, error: "Incorrect password" };
      }

      // Return useful data for frontend
      return {
        success: true,
        message: "Joined successfully",
        roomCode: code.toUpperCase(),
        config: room.config,
        match: room.match,
        referees: room.referees,
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
  
  
