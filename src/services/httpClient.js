const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api/v1";
const API_BASE_URL = configuredBaseUrl.replace(/\/+$/, "");
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";
const tokenKey = "aiofront_token";

export function shouldUseMockApi() {
  return USE_MOCK_API;
}

export async function httpClient(path, options = {}) {
  return request(path, options, false);
}

async function request(path, options, retried) {
  const token = readToken();
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(!isFormData && options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (response.status === 401 && !retried && canRefresh(path)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request(path, options, true);
  }

  const payload = await parseResponse(response);
  if (!response.ok) throw apiError(response, payload);
  if (response.status === 204) return null;
  return payload?.data ?? payload;
}

async function refreshAccessToken() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: "{}"
    });
    const payload = await parseResponse(response);
    if (!response.ok || !payload?.data?.accessToken) {
      announceSessionExpired();
      return false;
    }
    replaceToken(payload.data.accessToken);
    if (payload.data.user) replaceUser(payload.data.user);
    return true;
  } catch {
    announceSessionExpired();
    return false;
  }
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    return text ? { message: text } : null;
  }
  return response.json();
}

function apiError(response, payload) {
  const details = payload?.error;
  const error = new Error(details?.message || payload?.message || `Request failed with ${response.status}`);
  error.code = details?.code || `HTTP_${response.status}`;
  error.details = details?.details || {};
  error.requestId = details?.requestId || payload?.requestId;
  error.status = response.status;
  return error;
}

function canRefresh(path) {
  return !path.startsWith("/auth/login")
    && !path.startsWith("/auth/register")
    && !path.startsWith("/auth/refresh")
    && !path.startsWith("/auth/verify-email")
    && !path.startsWith("/auth/forgot-password")
    && !path.startsWith("/auth/reset-password");
}

function readToken() {
  const legacyToken = window.localStorage.getItem(tokenKey);
  if (legacyToken) {
    window.localStorage.removeItem(tokenKey);
    window.sessionStorage.setItem(tokenKey, legacyToken);
  }
  return window.sessionStorage.getItem(tokenKey);
}

function replaceToken(token) {
  window.localStorage.removeItem(tokenKey);
  window.sessionStorage.setItem(tokenKey, token);
}

function replaceUser(user) {
  const key = "aiofront_user";
  const storage = window.localStorage.getItem(key) ? window.localStorage : window.sessionStorage;
  storage.setItem(key, JSON.stringify(user));
}

function announceSessionExpired() {
  window.localStorage.removeItem("aiofront_user");
  window.localStorage.removeItem(tokenKey);
  window.sessionStorage.removeItem("aiofront_user");
  window.sessionStorage.removeItem(tokenKey);
  window.dispatchEvent(new CustomEvent("aio:session-expired"));
}
