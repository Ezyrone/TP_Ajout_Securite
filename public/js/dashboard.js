import {
  ensureAuthenticated,
  clearSession,
  redirectToLogin,
  loadSession,
} from './session.js';

const session = ensureAuthenticated();
if (!session) {
  throw new Error('Authentication required');
}

let { token, user: currentUser } = session;

const notesList = document.querySelector('#notes-list');
const noteTemplate = document.querySelector('#note-template');
const createNoteForm = document.querySelector('#create-note-form');
const noteContentInput = document.querySelector('#note-content');
const noteFeedback = document.querySelector('#note-feedback');
const currentUserLabel = document.querySelector('#current-user');
const logoutBtn = document.querySelector('#logout-btn');

let notes = [];

const socket = io();

socket.on('notes_updated', (payload) => {
  notes = payload;
  renderNotes();
});

function updateCurrentUser() {
  const { token: latestToken, user } = loadSession();
  if (!latestToken || !user) {
    handleUnauthorized();
    return;
  }
  token = latestToken;
  currentUser = user;
  currentUserLabel.textContent = `Connecté en tant que ${currentUser.username}`;
}

function handleUnauthorized() {
  clearSession();
  redirectToLogin();
}

async function fetchNotes() {
  try {
    const response = await fetch('/notes');
    if (!response.ok) {
      throw new Error('Impossible de récupérer les notes');
    }
    notes = await response.json();
    renderNotes();
  } catch (error) {
    noteFeedback.textContent = 'Erreur lors du chargement des notes.';
    console.error(error);
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
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(path, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    handleUnauthorized();
  }

  return response;
}

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
    noteFeedback.style.color = '#34d399';
    noteFeedback.textContent = 'Note ajoutée !';
  } catch (error) {
    noteFeedback.textContent = 'Erreur réseau lors de l’ajout.';
  } finally {
    setTimeout(() => {
      noteFeedback.textContent = '';
      noteFeedback.style.color = '';
    }, 1800);
  }
});

notesList.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const noteId = Number(button.dataset.noteId);
  if (!noteId) return;

  if (button.classList.contains('edit-btn')) {
    await handleEdit(noteId);
  } else if (button.classList.contains('delete-btn')) {
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

logoutBtn.addEventListener('click', () => {
  clearSession();
  redirectToLogin();
});

updateCurrentUser();
fetchNotes();
