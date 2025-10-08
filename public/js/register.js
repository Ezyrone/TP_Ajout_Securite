import { loadSession, redirectToDashboard } from './session.js';

const registerForm = document.querySelector('#register-form');
const registerFeedback = document.querySelector('#register-feedback');

function init() {
  const { token, user } = loadSession();
  if (token && user) {
    redirectToDashboard();
  }
}

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  registerFeedback.textContent = '';
  registerFeedback.style.color = '';

  const username = document.querySelector('#register-username').value.trim();
  const password = document.querySelector('#register-password').value.trim();

  if (!username || !password) {
    registerFeedback.textContent = 'Choisissez un identifiant et un mot de passe.';
    return;
  }

  try {
    const response = await fetch('/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      registerFeedback.textContent = data.error || 'Inscription impossible pour le moment.';
      return;
    }

    registerFeedback.style.color = '#34d399';
    registerFeedback.textContent = 'Compte créé ! Direction la connexion…';
    setTimeout(() => {
      window.location.replace('login.html');
    }, 1200);
    registerForm.reset();
  } catch (error) {
    registerFeedback.textContent = 'Erreur réseau. Réessayez un peu plus tard.';
  }
});

init();
