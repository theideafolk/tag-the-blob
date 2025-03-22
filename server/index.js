/**
 * Game server for the Tag the Blob multiplayer game
 * Handles socket.io connections and game state synchronization
 */
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory game state storage
const gameRooms = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join game room (single room for simplicity)
  socket.join('main-room');
  
  // When a player joins the game
  socket.on('player-join', (player) => {
    console.log('Player joined:', player.name);
    io.to('main-room').emit('player-joined', {
      id: socket.id,
      ...player
    });
  });
  
  // When a player updates their position
  socket.on('player-move', (data) => {
    socket.to('main-room').emit('player-moved', {
      id: socket.id,
      ...data
    });
  });
  
  // When a player becomes "it"
  socket.on('player-tagged', (data) => {
    socket.to('main-room').emit('player-became-it', {
      id: data.taggedId,
      taggerId: data.taggerId
    });
  });
  
  // When a player activates a power-up
  socket.on('power-up-activated', (data) => {
    socket.to('main-room').emit('player-activated-power-up', {
      id: socket.id,
      type: data.type
    });
  });
  
  // When a player collects a power-up
  socket.on('power-up-collected', (data) => {
    socket.to('main-room').emit('power-up-was-collected', {
      id: data.powerUpId,
      playerId: socket.id
    });
  });
  
  // When a player disconnects
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    io.to('main-room').emit('player-left', socket.id);
  });
  
  // When a game round starts
  socket.on('round-start', (data) => {
    socket.to('main-room').emit('round-started', data);
  });
  
  // When a game round ends
  socket.on('round-end', (data) => {
    socket.to('main-room').emit('round-ended', data);
  });
});

// Serve static files from the 'dist' directory
app.use(express.static(join(__dirname, '../dist')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});