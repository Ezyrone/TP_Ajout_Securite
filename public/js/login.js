import { loadSession, saveSession, redirectToDashboard } from './session.js';

const loginForm = document.querySelector('#login-form');
const loginFeedback = document.querySelector('#login-feedback');

function init() {
  const { token, user } = loadSession();
  if (token && user) {
    redirectToDashboard();
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginFeedback.textContent = '';

  const username = document.querySelector('#login-username').value.trim();
  const password = document.querySelector('#login-password').value.trim();

  if (!username || !password) {
    loginFeedback.textContent = 'Merci de renseigner vos identifiants.';
    return;
  }

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      loginFeedback.textContent = data.error || 'Connexion impossible.';
      return;
    }

    saveSession(data.token, data.user);
    redirectToDashboard();
  } catch (error) {
    loginFeedback.textContent = 'Erreur réseau. Réessayez plus tard.';
  }
});

init();
