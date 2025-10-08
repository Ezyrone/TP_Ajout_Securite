export const TOKEN_KEY = 'dashboard_jwt';
export const USER_KEY = 'dashboard_user';

export function loadSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  const storedUser = localStorage.getItem(USER_KEY);

  if (!token || !storedUser) {
    return { token: null, user: null };
  }

  try {
    const user = JSON.parse(storedUser);
    return { token, user };
  } catch (error) {
    console.warn('Session invalide, purge des informations locales.');
    clearSession();
    return { token: null, user: null };
  }
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function redirectToLogin() {
  window.location.replace('login.html');
}

export function redirectToDashboard() {
  window.location.replace('dashboard.html');
}

export function ensureAuthenticated() {
  const session = loadSession();
  if (!session.token || !session.user) {
    redirectToLogin();
    return null;
  }
  return session;
}
