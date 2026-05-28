const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8006/api";
const ASSET_BASE = API_BASE.replace(/\/api\/?$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const payload = await response.json();
      detail = payload.detail || detail;
    } catch {
      // Keep the HTTP status text if the server does not return JSON.
    }
    throw new Error(Array.isArray(detail) ? JSON.stringify(detail) : detail);
  }

  return response.json();
}

export function sendChat(payload) {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function streamChat(payload, onEvent) {
  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    let detail = response.statusText;
    try {
      const payload = await response.json();
      detail = payload.detail || detail;
    } catch {
      // Keep the HTTP status text if the server does not return JSON.
    }
    throw new Error(Array.isArray(detail) ? JSON.stringify(detail) : detail);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      onEvent(JSON.parse(line));
    }
  }

  if (buffer.trim()) {
    onEvent(JSON.parse(buffer));
  }
}

export function assetUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return `${ASSET_BASE}${path}`;
}

export function getState(threadId, userId) {
  const params = new URLSearchParams({ thread_id: threadId, user_id: userId });
  return request(`/state?${params.toString()}`);
}

export function approveReview(payload) {
  return request("/review/approve", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function rejectReview(payload) {
  return request("/review/reject", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function buildGraph(payload) {
  return request("/graph/build", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
