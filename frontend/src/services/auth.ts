
const ACCESS_KEY = 'cf_access_token';

export function getToken(): string | null {
  try { return localStorage.getItem(ACCESS_KEY); } catch (e) { return null; }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(ACCESS_KEY, token);
    else localStorage.removeItem(ACCESS_KEY);
  } catch (e) {}
}

export function clearToken() { setToken(null); }
