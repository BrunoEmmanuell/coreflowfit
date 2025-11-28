const TOKEN_KEY = "coreflowfit_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (err) {
    console.warn("getToken: localStorage inacessível", err);
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token === null) {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch (err) {
    console.warn("setToken: localStorage inacessível", err);
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.warn("clearToken: localStorage inacessível", err);
  }
}

export default {
  getToken,
  setToken,
  clearToken,
};
