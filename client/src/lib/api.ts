const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

type FetchOptions = RequestInit & { json?: any };

export async function apiFetch(path: string, options: FetchOptions = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("lpai_token") : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.json);
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body,
  });

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { text };
  }
}
