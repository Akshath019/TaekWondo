"use client";

import { useState } from "react";

export default function Home() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("http://localhost:3001/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create room");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">TKD Scoring Wi-Fi</h1>

      <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-6 text-center">Create New Room</h2>

        <form onSubmit={handleCreate}>
          <div className="mb-6">
            <label className="block mb-2">Password (min 4 characters)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              required
              minLength={4}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded font-bold disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Room"}
          </button>
        </form>

        {error && <p className="mt-4 text-red-400 text-center">{error}</p>}

        {result && (
          <div className="mt-6 p-4 bg-green-900 rounded">
            <p className="font-bold">Room Created!</p>
            <p className="mt-2">
              Code: <strong className="text-xl">{result.roomCode}</strong>
            </p>
            <p className="mt-1 text-sm text-gray-300">Password: {password}</p>

            <button
              onClick={() => {
                // Redirect to join page with code pre-filled
                window.location.href = `/join?code=${result.roomCode}`;
              }}
              className="mt-4 w-full py-3 bg-green-600 hover:bg-green-700 rounded font-bold"
            >
              Go to Join / Referee View
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
