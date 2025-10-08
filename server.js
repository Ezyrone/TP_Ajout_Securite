const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const JWT_EXPIRATION = '2h';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory stores
let nextNoteId = 1;
let nextUserId = 1;
const notes = [];
const users = [];

// Utility helpers
const findNoteById = (id) => notes.find((note) => note.id === id);
const findUserById = (id) => users.find((user) => user.id === id);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Notes endpoints
app.get('/notes', (req, res) => {
  res.json(notes);
});

app.post('/notes', authenticateToken, (req, res) => {
  const { content } = req.body;

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Content is required' });
  }

  const author = findUserById(req.userId);

  const newNote = {
    id: nextNoteId++,
    content,
    authorId: req.userId,
    authorName: author ? author.username : 'Inconnu',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  notes.push(newNote);
  io.emit('notes_updated', notes);
  res.status(201).json(newNote);
});

app.put('/notes/:id', authenticateToken, (req, res) => {
  const noteId = Number(req.params.id);
  const { content } = req.body;

  if (!Number.isInteger(noteId)) {
    return res.status(400).json({ error: 'Invalid note id' });
  }

  const note = findNoteById(noteId);

  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }

  if (note.authorId !== req.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Content is required' });
  }

  note.content = content;
  note.updatedAt = new Date().toISOString();
  io.emit('notes_updated', notes);
  res.json(note);
});

app.delete('/notes/:id', authenticateToken, (req, res) => {
  const noteId = Number(req.params.id);
  if (!Number.isInteger(noteId)) {
    return res.status(400).json({ error: 'Invalid note id' });
  }

  const noteIndex = notes.findIndex((note) => note.id === noteId);

  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }

  if (notes[noteIndex].authorId !== req.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const [deletedNote] = notes.splice(noteIndex, 1);
  io.emit('notes_updated', notes);
  res.json(deletedNote);
});

// Authentication endpoints
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const existing = users.find((user) => user.username === username);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: nextUserId++,
    username,
    passwordHash,
  };

  users.push(newUser);
  res.status(201).json({ message: 'User registered successfully' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = users.find((candidate) => candidate.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
  });

  res.json({ token, user: { id: user.id, username: user.username } });
});

// Socket.io setup
io.on('connection', (socket) => {
  socket.emit('notes_updated', notes);
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
