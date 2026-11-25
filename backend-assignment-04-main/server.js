require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const initializeChatSocket = require('./sockets/chatSocket');
require('./events/appEvents'); // Register event listeners

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static client files
app.use(express.static(path.join(__dirname, 'public')));

// Connect database (MongoDB or local persistent JSON store fallback)
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime(), timestamp: new Date() });
});

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[server error]', err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Initialize real-time chat via Socket.IO
initializeChatSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  // Matches assignment Fig 3 console format:
  // [server] listening on http://localhost:5000
  console.log(`[server] listening on http://localhost:${PORT}`);
});

module.exports = { app, server, io };
