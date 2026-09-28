export const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const API_BASE_URL = `${API_ORIGIN}/api`;

const AUTH_KEY = "fanhubplus_auth";
const VISITOR_KEY = "fanhubplus_visitor";

function getToken() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw)?.token : null;
  } catch {
    return null;
  }
}

export function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export function assetUrl(path) {
  if (!path) return "";
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  if (path.startsWith("/uploads")) return `${API_ORIGIN}${path}`;
  return path;
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 503 && data.maintenance) {
      window.dispatchEvent(new CustomEvent("fanhub:maintenance", { detail: data.msg }));
    }
    if (response.status === 401 && getToken()) {
      window.dispatchEvent(new Event("fanhub:unauthorized"));
    }
    const error = new Error(data.msg || data.message || "Something went wrong");
    error.status = response.status;
    throw error;
  }

  return data;
}

async function request(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return handleResponse(response);
}

async function requestForm(endpoint, method, formData) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  return handleResponse(response);
}

export function toQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") search.set(key, value);
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

export const api = {
  get: (endpoint) => request(endpoint, { method: "GET" }),
  post: (endpoint, body) => request(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  delete: (endpoint, body) =>
    request(endpoint, {
      method: "DELETE",
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),

  postForm: (endpoint, formData) => requestForm(endpoint, "POST", formData),
  putForm: (endpoint, formData) => requestForm(endpoint, "PUT", formData),
};

export default api;
