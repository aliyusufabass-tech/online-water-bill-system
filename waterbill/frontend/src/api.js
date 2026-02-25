const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const ACCESS_KEY = 'waterbill_access_token';
const REFRESH_KEY = 'waterbill_refresh_token';

function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY) || '';
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY) || '';
}

export function setTokens(tokens) {
  if (!tokens) return;
  if (tokens.access) localStorage.setItem(ACCESS_KEY, tokens.access);
  if (tokens.refresh) localStorage.setItem(REFRESH_KEY, tokens.refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  const controller = new AbortController();
  const timeoutMs = 20000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.tokens) {
    clearTokens();
    return false;
  }

  setTokens(data.tokens);
  return true;
}

async function request(path, options = {}, allowRefresh = true) {
  const access = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (access) headers.Authorization = `Bearer ${access}`;

  const timeoutMs = options.timeoutMs ?? 20000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    const isAbort = error instanceof DOMException && error.name === 'AbortError';
    throw new Error(
      isAbort
        ? 'Request timed out. Please try again.'
        : 'Unable to reach the server. Check your API URL, CORS settings, and internet connection.'
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401 && allowRefresh && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request(path, options, false);
    }
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (typeof data.error === 'string') {
      throw new Error(data.error);
    }
    if (typeof data.detail === 'string') {
      throw new Error(data.detail);
    }
    if (typeof data.message === 'string') {
      throw new Error(data.message);
    }
    if (data && typeof data === 'object') {
      const entries = Object.entries(data);
      const first = entries.find(([, v]) => Array.isArray(v) || typeof v === 'string');
      if (first) {
        const [field, value] = first;
        const message = Array.isArray(value) ? value[0] : value;
        throw new Error(`${field}: ${message}`);
      }
    }
    throw new Error(response.statusText || 'Request failed');
  }
  return data;
}

export async function api(path, options = {}) {
  return request(path, options);
}

export async function apiDownload(path, options = {}) {
  const access = getAccessToken();
  const timeoutMs = options.timeoutMs ?? 20000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: access ? { Authorization: `Bearer ${access}` } : {},
      signal: controller.signal,
    });
  } catch (error) {
    const isAbort = error instanceof DOMException && error.name === 'AbortError';
    throw new Error(isAbort ? 'Download timed out. Please try again.' : 'Unable to reach the server.');
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let message = 'Download failed';
    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      // Ignore JSON parse errors.
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const filenameMatch = disposition.match(/filename="(.+?)"/);
  const filename = filenameMatch ? filenameMatch[1] : 'receipt.txt';

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
