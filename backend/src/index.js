const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

// Load the secret settings from .env file
dotenv.config();

const pool = require('./db/connection');

// Create the server
const app = express();
const server = http.createServer(app);

// Create Socket.io server
const io = new Server(server, {
  cors: { origin: '*' }
});

// Make io available to routes
app.set('io', io);

// Allow frontend to talk to backend
app.use(cors());

// Tell the server to understand JSON data
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const requestRoutes = require('./routes/requests');
app.use('/requests', requestRoutes);

const exportRoutes = require('./routes/export');
app.use('/export', exportRoutes);

const notificationRoutes = require('./routes/notifications');
app.use('/notifications', notificationRoutes);

const referenceRoutes = require('./routes/references');
app.use('/references', referenceRoutes);

const analyticsRoutes = require('./routes/analytics');
app.use('/analytics', analyticsRoutes);

const messageRoutes = require('./routes/messages');
app.use('/messages', messageRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server (use server.listen instead of app.listen)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});