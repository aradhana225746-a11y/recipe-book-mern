const BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
export async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(BASE + path, { ...options, headers: { "Content-Type": "application/json", ...options.headers } });
  } catch {
    throw new Error("Cannot reach the server. Check that your backend and MongoDB Atlas are running.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Your request could not be completed.");
  return data;
}
