require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes (we'll add more as we build them)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/cities', require('./routes/cityRoutes'));
app.use('/api/boards', require('./routes/boardRoutes'));
app.use('/api/timeslots', require('./routes/timeslotRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use('/api/impressions', require('./routes/impressionRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Test route
app.get('/', (req, res) => {
  res.send('TrueReach API is running');
});

// Connect to MongoDB then start server
const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not set. Copy backend/.env.example to backend/.env and configure it.');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Copy backend/.env.example to backend/.env and configure it.');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});
