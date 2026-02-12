// packages/shared/src/types.ts

export interface RoomData {
  passwordHash: string;
  createdAt: number;
  // Later we will add:
  // config?: { ... }
  // match?: { ... }
  // referees?: any[]
  // etc.
}
