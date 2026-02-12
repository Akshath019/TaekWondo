const API_BASE = "http://localhost:3001/api";

export async function createRoom(password: string) {
  const res = await fetch(`${API_BASE}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error("Failed to create room");
  return res.json();
}

export async function joinRoom(code: string, password: string) {
  const res = await fetch(`${API_BASE}/rooms/${code}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error("Failed to join");
  return res.json();
}

export async function getRoomState(code: string) {
  const res = await fetch(`http://localhost:3001/api/rooms/${code}`);
  if (!res.ok) throw new Error("Failed to fetch room state");
  return res.json();
}

// Later we'll add more: get room state, send signal, etc.
