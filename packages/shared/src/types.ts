export interface RoomData {
  passwordHash: string;
  createdAt: number;

  config: {
    votingWindowMs: number; // default 800
    majorityPercent: number; // default 0.6 (60%)
    pointValues: Record<string, number>; // e.g. { punch: 1, body: 1, head: 3, ... }
    rounds: number; // default 3
    roundDuration: number; // default 120 seconds
    breakDuration: number; // default 60 seconds
    goldenPoint: boolean; // default false
    maxPointGap: number; // default 0 (disabled)
  };

  match: {
    phase: "ready" | "round" | "break" | "golden" | "ended";
    currentRound: number;
    roundTimeLeft: number;
    breakTimeLeft: number;
    isPaused: boolean;
    red: { name: string; score: number };
    blue: { name: string; score: number };
  };

  referees: Array<{
    id: string;
    name: string;
    enabled: boolean;
    lastSignal?: number;
  }>;

  // We'll add signals later
}
