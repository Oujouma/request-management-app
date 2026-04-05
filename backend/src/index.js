const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

if (!process.env.RAILWAY_ENVIRONMENT) {
  dotenv.config();
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://oj:@localhost:5432/request_management';
}

const pool = require('./db/connection');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' }
});

app.set('io', io);

app.use(cors());
app.use(express.json());

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

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});