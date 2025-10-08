const API_BASE = '';
const TOKEN_KEY = 'dashboard_jwt';
const USER_KEY = 'dashboard_user';

const notesList = document.querySelector('#notes-list');
const noteTemplate = document.querySelector('#note-template');
const createNoteForm = document.querySelector('#create-note-form');
const noteContentInput = document.querySelector('#note-content');
const noteFeedback = document.querySelector('#note-feedback');

const registerForm = document.querySelector('#register-form');
const registerFeedback = document.querySelector('#register-feedback');
const loginForm = document.querySelector('#login-form');
const loginFeedback = document.querySelector('#login-feedback');

const currentUserLabel = document.querySelector('#current-user');
const logoutBtn = document.querySelector('#logout-btn');

let notes = [];
let token = null;
let currentUser = null;

const socket = io();

socket.on('notes_updated', (payload) => {
  notes = payload;
  renderNotes();
});

function loadSession() {
  const savedToken = localStorage.getItem(TOKEN_KEY);
  const savedUser = localStorage.getItem(USER_KEY);

  if (savedToken && savedUser) {
    try {
      token = savedToken;
      currentUser = JSON.parse(savedUser);
    } catch (error) {
      console.warn('Unable to restore session:', error);
      clearSession();
    }
  }
}

function persistSession() {
  if (token && currentUser) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
  }
}

function clearSession() {
  token = null;
  currentUser = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function updateAuthUI() {
  if (currentUser) {
    currentUserLabel.textContent = `Connecté en tant que ${currentUser.username}`;
    logoutBtn.hidden = false;
    noteContentInput.disabled = false;
    createNoteForm.querySelector('button[type="submit"]').disabled = false;
  } else {
    currentUserLabel.textContent = 'Non connecté';
    logoutBtn.hidden = true;
    noteContentInput.value = '';
    noteContentInput.disabled = true;
    createNoteForm.querySelector('button[type="submit"]').disabled = true;
  }
}

async function fetchNotes() {
  try {
    const response = await fetch(`${API_BASE}/notes`);
    if (!response.ok) {
      throw new Error('Impossible de récupérer les notes');
    }
    notes = await response.json();
    renderNotes();
  } catch (error) {
    console.error(error);
    noteFeedback.textContent = 'Erreur lors du chargement des notes.';
  }
}

function renderNotes() {
  notesList.innerHTML = '';

  notes
    .slice()
    .reverse()
    .forEach((note) => {
      const clone = noteTemplate.content.cloneNode(true);
      const li = clone.querySelector('.note');
      li.dataset.noteId = note.id;

      const contentEl = clone.querySelector('.note-content');
      contentEl.textContent = note.content;

      const metaEl = clone.querySelector('.note-meta');
      const created = new Date(note.createdAt).toLocaleString('fr-FR');
      const updated = new Date(note.updatedAt).toLocaleString('fr-FR');
      metaEl.textContent = `Auteur: ${note.authorName || 'Inconnu'} • Créé le ${created}${
        note.updatedAt !== note.createdAt ? ` • Modifié le ${updated}` : ''
      }`;

      const editBtn = clone.querySelector('.edit-btn');
      const deleteBtn = clone.querySelector('.delete-btn');

      const isOwner = currentUser && currentUser.id === note.authorId;

      editBtn.dataset.noteId = note.id;
      deleteBtn.dataset.noteId = note.id;

      if (!isOwner) {
        editBtn.disabled = true;
        deleteBtn.disabled = true;
      }

      notesList.appendChild(clone);
    });
}

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearSession();
    updateAuthUI();
  }

  return response;
}

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  registerFeedback.textContent = '';

  const username = document.querySelector('#register-username').value.trim();
  const password = document.querySelector('#register-password').value.trim();

  if (!username || !password) {
    registerFeedback.textContent = 'Veuillez renseigner un identifiant et un mot de passe.';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      registerFeedback.textContent = data.error || "Inscription impossible.";
      return;
    }

    registerFeedback.style.color = '#047857';
    registerFeedback.textContent = 'Inscription réussie ! Vous pouvez vous connecter.';
    registerForm.reset();
  } catch (error) {
    registerFeedback.textContent = 'Erreur réseau lors de l’inscription.';
  } finally {
    setTimeout(() => {
      registerFeedback.style.color = '';
    }, 3000);
  }
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginFeedback.textContent = '';

  const username = document.querySelector('#login-username').value.trim();
  const password = document.querySelector('#login-password').value.trim();

  if (!username || !password) {
    loginFeedback.textContent = 'Veuillez renseigner vos identifiants.';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/login`, {
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

    token = data.token;
    currentUser = data.user;
    persistSession();
    updateAuthUI();
    loginForm.reset();
    loginFeedback.textContent = '';
    await fetchNotes();
  } catch (error) {
    loginFeedback.textContent = 'Erreur réseau lors de la connexion.';
  }
});

logoutBtn.addEventListener('click', () => {
  clearSession();
  updateAuthUI();
  renderNotes();
});

createNoteForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  noteFeedback.textContent = '';

  const content = noteContentInput.value.trim();
  if (!content) {
    noteFeedback.textContent = 'Le contenu de la note est obligatoire.';
    return;
  }

  try {
    const response = await apiRequest('/notes', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      noteFeedback.textContent = data.error || 'Impossible de créer la note.';
      return;
    }

    noteContentInput.value = '';
    noteFeedback.style.color = '#047857';
    noteFeedback.textContent = 'Note ajoutée !';
  } catch (error) {
    noteFeedback.textContent = 'Erreur réseau lors de l’ajout.';
  } finally {
    setTimeout(() => {
      noteFeedback.textContent = '';
      noteFeedback.style.color = '';
    }, 2000);
  }
});

notesList.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const noteId = Number(button.dataset.noteId);
  if (!noteId) return;

  if (button.classList.contains('edit-btn')) {
    await handleEdit(noteId);
  }

  if (button.classList.contains('delete-btn')) {
    await handleDelete(noteId);
  }
});

async function handleEdit(noteId) {
  const note = notes.find((n) => n.id === noteId);
  if (!note) return;

  const updatedContent = prompt('Modifier la note :', note.content);
  if (updatedContent === null) return;

  const content = updatedContent.trim();
  if (!content) {
    alert('Le contenu ne peut pas être vide.');
    return;
  }

  try {
    const response = await apiRequest(`/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      alert(data.error || 'Impossible de modifier la note.');
    }
  } catch (error) {
    alert('Erreur réseau lors de la modification.');
  }
}

async function handleDelete(noteId) {
  if (!confirm('Supprimer cette note ?')) return;

  try {
    const response = await apiRequest(`/notes/${noteId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      alert(data.error || 'Impossible de supprimer la note.');
    }
  } catch (error) {
    alert('Erreur réseau lors de la suppression.');
  }
}

function init() {
  loadSession();
  updateAuthUI();
  fetchNotes();
}

init();
