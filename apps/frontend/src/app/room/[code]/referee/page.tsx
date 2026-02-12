"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getRoomState } from "@/lib/api";

export default function RefereeView() {
  const { code } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch room state
  useEffect(() => {
    const fetchData = async () => {
      try {
        const roomData = await getRoomState(code as string);
        setData(roomData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Poll every 4 seconds (temporary until WebSocket)
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [code]);

  const sendSignal = (side: "red" | "blue", value: number) => {
    console.log(`Referee signal: ${side} + ${value} pts`);

    // Vibration feedback
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50]); // short pattern
    }

    // Later: send via WebSocket
    // For now: just optimistic UI update
    setData((prev: any) => {
      if (!prev?.match) return prev;
      return {
        ...prev,
        match: {
          ...prev.match,
          [side]: {
            ...prev.match[side],
            score: prev.match[side].score + value,
          },
        },
      };
    });
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="h-screen flex items-center justify-center text-red-400">
        {error}
      </div>
    );
  if (!data?.match)
    return (
      <div className="h-screen flex items-center justify-center text-white">
        No match data
      </div>
    );

  const { match } = data;
  const timeStr = `${Math.floor(match.roundTimeLeft / 60)}:${(match.roundTimeLeft % 60).toString().padStart(2, "0")}`;

  return (
    <div className="relative h-screen overflow-hidden select-none">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-md text-white px-6 py-3 flex justify-between items-center text-xl md:text-2xl font-bold">
        <div>Round {match.phase === "ready" ? "–" : match.currentRound}</div>
        <div>{timeStr}</div>
      </div>

      {/* BLUE SIDE */}
      <div
        className="absolute inset-y-0 left-0 w-1/2 bg-blue-900 flex flex-col items-center justify-center cursor-pointer active:bg-blue-950 transition-colors duration-100"
        onClick={() => sendSignal("blue", 1)} // tap = 1 pt body
      >
        <h1 className="text-7xl md:text-9xl lg:text-[12rem] font-black text-white tracking-tight">
          BLUE
        </h1>
        <div className="text-8xl md:text-[10rem] lg:text-[14rem] font-extrabold text-white mt-4 md:mt-8">
          {match.blue.score}
        </div>
      </div>

      {/* RED SIDE */}
      <div
        className="absolute inset-y-0 right-0 w-1/2 bg-red-900 flex flex-col items-center justify-center cursor-pointer active:bg-red-950 transition-colors duration-100"
        onClick={() => sendSignal("red", 1)} // tap = 1 pt body
      >
        <h1 className="text-7xl md:text-9xl lg:text-[12rem] font-black text-white tracking-tight">
          RED
        </h1>
        <div className="text-8xl md:text-[10rem] lg:text-[14rem] font-extrabold text-white mt-4 md:mt-8">
          {match.red.score}
        </div>
      </div>

      {/* Small note for testing */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/60 text-sm">
        Tap left = BLUE +1 • Tap right = RED +1 • (real points via WebSocket
        soon)
      </div>
    </div>
  );
}
