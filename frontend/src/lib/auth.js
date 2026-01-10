const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

export async function fetchMe() {
  try {
    const r = await fetch(`${API_BASE}/api/me`, { credentials: "include" });
    if (!r.ok) return null;
    const data = await r.json();
    return data || null;
  } catch {
    return null;
  }
}

