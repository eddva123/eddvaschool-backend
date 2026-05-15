import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import pool from './config/db.js';
import chatSocket from './sockets/chatSocket.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.CLIENT_URL || 'http://localhost:5173',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

chatSocket(io);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

server.listen(PORT, async () => {
  try {
    await pool.query('SELECT 1');
    console.log('PostgreSQL connected');
  } catch (err) {
    console.error('PostgreSQL connection error:', err.message);
    console.error('Run: npm run db:init — and check DATABASE_URL in .env');
  }
  console.log(`School Platform server running on port ${PORT}`);
  console.log(`API docs: http://localhost:${PORT}/api/docs`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err.message);
  server.close(() => process.exit(1));
});
