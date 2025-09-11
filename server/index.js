// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve images placed in server/public/images via /images route
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Example data (movie genres). You can add image paths later: "/images/action.jpg"
const genres = [
  { id: 1, name: 'Action', description: 'Fast-paced, stunt-heavy films', image: '/images/action.jpg' },
  { id: 2, name: 'Comedy', description: 'Funny films to make you laugh', image: '/images/comedy.jpg' },
  { id: 3, name: 'Drama', description: 'Emotion-driven storytelling', image: '/images/drama.jpg' },
  { id: 4, name: 'Sci-Fi', description: 'Futuristic concepts and tech', image: '/images/scifi.jpg' }
];

// API endpoint requested by the assignment
app.get('/api/genres', (req, res) => {
  res.json(genres);
});

// Simple health route
app.get('/api/ping', (req, res) => res.json({ ok: true, time: Date.now() }));

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
