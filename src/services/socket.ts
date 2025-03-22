/**
 * Socket service for real-time multiplayer communication
 * Initializes and manages socket.io connection
 */
import { io, Socket } from 'socket.io-client';
import { useGameStore, Player, PowerUpType } from '../store/gameStore';
import * as THREE from 'three';

// Initialize socket connection
let socket: Socket | null = null;

// Connect to the socket server
export const initializeSocket = (): Socket => {
  if (socket) return socket;
  
  // Connect to current domain or localhost for development
  const serverUrl = import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin;
  socket = io(serverUrl);
  
  // Set up event listeners
  setupSocketListeners(socket);
  
  return socket;
};

// Set up all socket event listeners
const setupSocketListeners = (socket: Socket) => {
  // Player joined event
  socket.on('player-joined', (player) => {
    const gameStore = useGameStore.getState();
    
    // Add the player to the game
    if (!gameStore.players[player.id]) {
      const newPlayer: Player = {
        id: player.id,
        position: new THREE.Vector3(
          player.position?.x || (Math.random() - 0.5) * 20,
          player.position?.y || 1,
          player.position?.z || (Math.random() - 0.5) * 20
        ),
        rotation: player.rotation || 0,
        color: player.color || '#4ECDC4',
        isIt: player.isIt || false,
        name: player.name,
        type: 'human',
        isAlive: true,
        taggedTime: null,
        powerUp: null,
        powerUpEndTime: null,
        scale: 1,
        supbaseId: player.supbaseId
      };
      
      gameStore.addNetworkPlayer(newPlayer);
    }
  });
  
  // Player movement event
  socket.on('player-moved', (data) => {
    const gameStore = useGameStore.getState();
    const player = gameStore.players[data.id];
    
    if (player) {
      const position = new THREE.Vector3(data.position.x, data.position.y, data.position.z);
      gameStore.updatePlayerPosition(data.id, position, data.rotation);
    }
  });
  
  // Player tagged event
  socket.on('player-became-it', (data) => {
    const gameStore = useGameStore.getState();
    gameStore.tagPlayer(data.taggedId, data.taggerId);
  });
  
  // Player activated power-up event
  socket.on('player-activated-power-up', (data) => {
    const gameStore = useGameStore.getState();
    if (gameStore.players[data.id]) {
      gameStore.activatePowerUp(data.id);
    }
  });
  
  // Power-up collected event
  socket.on('power-up-was-collected', (data) => {
    const gameStore = useGameStore.getState();
    gameStore.collectPowerUp(data.playerId, data.powerUpId);
  });
  
  // Player left event
  socket.on('player-left', (playerId) => {
    const gameStore = useGameStore.getState();
    gameStore.removePlayer(playerId);
  });
  
  // Round started event
  socket.on('round-started', (data) => {
    const gameStore = useGameStore.getState();
    gameStore.syncRoundStart(data);
  });
  
  // Round ended event
  socket.on('round-ended', () => {
    const gameStore = useGameStore.getState();
    gameStore.endRound();
  });
};

// Emit player join event
export const emitPlayerJoin = (player: Partial<Player>) => {
  if (!socket) return;
  socket.emit('player-join', player);
};

// Emit player movement
export const emitPlayerMove = (playerId: string, position: THREE.Vector3, rotation: number) => {
  if (!socket) return;
  socket.emit('player-move', { position, rotation });
};

// Emit player tagged
export const emitPlayerTagged = (taggedId: string, taggerId: string) => {
  if (!socket) return;
  socket.emit('player-tagged', { taggedId, taggerId });
};

// Emit power-up activation
export const emitPowerUpActivated = (type: PowerUpType) => {
  if (!socket) return;
  socket.emit('power-up-activated', { type });
};

// Emit power-up collection
export const emitPowerUpCollected = (powerUpId: string) => {
  if (!socket) return;
  socket.emit('power-up-collected', { powerUpId });
};

// Emit round start
export const emitRoundStart = (data: any) => {
  if (!socket) return;
  socket.emit('round-start', data);
};

// Emit round end
export const emitRoundEnd = (data: any) => {
  if (!socket) return;
  socket.emit('round-end', data);
};

// Get socket id
export const getSocketId = (): string | null => {
  return socket?.id || null;
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};