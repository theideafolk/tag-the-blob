/**
 * Game store for managing the state of the Tag the Blob game
 * Handles game state, players, tagging mechanics, power-ups, and round management
 * Integrates with Supabase for player data persistence
 */
import { create } from 'zustand';
import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';
import { createOrGetPlayer, createGameSession, endGameSession, recordPlayerRound } from '../services/supabase';
import { 
  emitPlayerMove, 
  emitPlayerTagged, 
  emitPowerUpActivated, 
  emitPowerUpCollected,
  emitRoundStart,
  emitRoundEnd,
  getSocketId
} from '../services/socket';

// Player types
export type PlayerType = 'human' | 'bot';
export type PowerUpType = 'speed' | 'invisibility' | 'flight' | null;

// Player interface
export interface Player {
  id: string;
  position: THREE.Vector3;
  rotation: number;
  color: string;
  isIt: boolean;
  name: string;
  type: PlayerType;
  isAlive: boolean;
  taggedTime: number | null;
  powerUp: PowerUpType;
  powerUpEndTime: number | null;
  scale: number;
  supbaseId?: string; // ID in Supabase (only for human players)
}

// Power-up interface
export interface PowerUp {
  id: string;
  type: PowerUpType;
  position: THREE.Vector3;
  createdAt: number;
}

// Game session interface
export interface GameSession {
  id: string;
  startTime: number;
  endTime: number | null;
}

// Game state interface
interface GameState {
  // Game status
  isGameActive: boolean;
  roundStartTime: number | null;
  roundEndTime: number | null;
  roundDuration: number; // in milliseconds
  roundNumber: number;
  
  // Players
  players: Record<string, Player>;
  localPlayerId: string | null;
  
  // Power-ups
  powerUps: Record<string, PowerUp>;
  
  // Stats
  survivalTimes: Record<string, number>;
  
  // Supabase integration
  gameSession: GameSession | null;
  isDbConnected: boolean;
  setDbConnected: (isConnected: boolean) => void;
  
  // Network player management
  addNetworkPlayer: (player: Player) => void;
  syncRoundStart: (data: any) => void;
  
  // Methods
  startGame: () => void;
  endRound: () => void;
  addPlayer: (type: PlayerType, name?: string) => Promise<string>;
  removePlayer: (id: string) => void;
  updatePlayerPosition: (id: string, position: THREE.Vector3, rotation: number) => void;
  tagPlayer: (taggedId: string, taggerId: string) => void;
  addPowerUp: (type: PowerUpType, position: THREE.Vector3) => string;
  collectPowerUp: (playerId: string, powerUpId: string) => void;
  activatePowerUp: (playerId: string) => void;
  moveBots: () => void;
}

// Generate a random color for a player
const getRandomColor = (): string => {
  const colors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2', '#EF476F', '#073B4C'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Generate a random name for a bot
const getBotName = (): string => {
  const adjectives = ['Happy', 'Silly', 'Bouncy', 'Wiggly', 'Jumpy', 'Zippy', 'Fluffy'];
  const nouns = ['Blob', 'Bubble', 'Bounce', 'Ball', 'Blob', 'Bounce', 'Bop'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
};

// Create the game store
export const useGameStore = create<GameState>((set, get) => ({
  // Initial game state
  isGameActive: false,
  roundStartTime: null,
  roundEndTime: null,
  roundDuration: 3 * 60 * 1000, // 3 minutes in milliseconds
  roundNumber: 0,
  
  players: {},
  localPlayerId: null,
  
  powerUps: {},
  
  survivalTimes: {},
  
  // Supabase integration
  gameSession: null,
  isDbConnected: false,
  setDbConnected: (isConnected: boolean) => set({ isDbConnected: isConnected }),
  
  // Network player management
  addNetworkPlayer: (player: Player) => {
    set(state => ({
      players: {
        ...state.players,
        [player.id]: player
      }
    }));
  },
  
  syncRoundStart: (data) => {
    set({
      isGameActive: true,
      roundStartTime: data.startTime,
      roundNumber: data.roundNumber,
      players: data.players
    });
  },
  
  // Start a new game round
  startGame: async () => {
    const players = get().players;
    const playerCount = Object.keys(players).length;
    
    // Create a new game session in Supabase
    let gameSession = get().gameSession;
    if (!gameSession && get().isDbConnected) {
      const session = await createGameSession();
      if (session) {
        gameSession = {
          id: session.id,
          startTime: new Date(session.started_at).getTime(),
          endTime: null
        };
        set({ gameSession });
      }
    }
    
    // Add bots if fewer than 5 players
    if (playerCount < 5) {
      for (let i = 0; i < 5 - playerCount; i++) {
        get().addPlayer('bot');
      }
    }
    
    // Choose a random player to be "it"
    const playerIds = Object.keys(players);
    const itPlayerId = playerIds[Math.floor(Math.random() * playerIds.length)];
    
    // Update all players
    const updatedPlayers = { ...players };
    Object.keys(updatedPlayers).forEach(id => {
      updatedPlayers[id] = {
        ...updatedPlayers[id],
        isIt: id === itPlayerId,
        isAlive: true,
        taggedTime: id === itPlayerId ? Date.now() : null,
        powerUp: null,
        powerUpEndTime: null,
        scale: id === itPlayerId ? 1.2 : 1,
      };
    });
    
    const startTime = Date.now();
    const roundNumber = get().roundNumber + 1;
    
    // Emit round start for multiplayer sync
    emitRoundStart({
      startTime,
      roundNumber,
      players: updatedPlayers
    });
    
    set({
      isGameActive: true,
      roundStartTime: startTime,
      roundEndTime: null,
      roundNumber: roundNumber,
      players: updatedPlayers,
      powerUps: {},
      survivalTimes: {},
    });
  },
  
  // End the current round
  endRound: async () => {
    const now = Date.now();
    const players = get().players;
    const survivalTimes: Record<string, number> = {};
    const gameSession = get().gameSession;
    const roundNumber = get().roundNumber;
    const roundStartTime = get().roundStartTime || 0;
    
    // Calculate survival times for each player
    Object.keys(players).forEach(id => {
      const player = players[id];
      if (!player.isIt) {
        const endTime = player.taggedTime || now;
        const survivalTime = endTime - roundStartTime;
        survivalTimes[id] = survivalTime;
        
        // Record human player round in Supabase
        if (player.type === 'human' && player.supbaseId && gameSession && get().isDbConnected) {
          recordPlayerRound(
            player.supbaseId,
            gameSession.id,
            roundNumber,
            player.isIt,
            survivalTime
          );
        }
      }
    });
    
    // Emit round end for multiplayer sync
    emitRoundEnd({
      roundNumber,
      survivalTimes
    });
    
    set({
      isGameActive: false,
      roundEndTime: now,
      survivalTimes,
    });
    
    // Start a new round after 10 seconds
    setTimeout(() => {
      get().startGame();
    }, 10000);
  },
  
  // Add a new player to the game
  addPlayer: async (type, name) => {
    // Use socket ID for networked players, or generate a UUID for bots
    const playerId = type === 'human' ? (getSocketId() || `player-${uuidv4()}`) : `bot-${uuidv4()}`;
    const playerName = name || (type === 'bot' ? getBotName() : `Player ${Object.keys(get().players).length + 1}`);
    
    // Create a player object
    const newPlayer: Player = {
      id: playerId,
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        1,
        (Math.random() - 0.5) * 20
      ),
      rotation: 0,
      color: getRandomColor(),
      isIt: false,
      name: playerName,
      type,
      isAlive: true,
      taggedTime: null,
      powerUp: null,
      powerUpEndTime: null,
      scale: 1,
    };
    
    // If it's a human player and we're connected to the database, create or get the player
    if (type === 'human' && get().isDbConnected) {
      try {
        const dbPlayer = await createOrGetPlayer(playerName);
        if (dbPlayer) {
          newPlayer.supbaseId = dbPlayer.id;
        }
      } catch (error) {
        console.error('Error creating player in Supabase:', error);
      }
    }
    
    set(state => ({
      players: {
        ...state.players,
        [playerId]: newPlayer
      },
      localPlayerId: type === 'human' && !state.localPlayerId ? playerId : state.localPlayerId,
    }));
    
    return playerId;
  },
  
  // Remove a player from the game
  removePlayer: (id) => {
    set(state => {
      const newPlayers = { ...state.players };
      delete newPlayers[id];
      
      // Update localPlayerId if the removed player is the local player
      const newLocalPlayerId = id === state.localPlayerId ? null : state.localPlayerId;
      
      return {
        players: newPlayers,
        localPlayerId: newLocalPlayerId
      };
    });
  },
  
  // Update a player's position
  updatePlayerPosition: (id, position, rotation) => {
    set(state => {
      const player = state.players[id];
      if (!player) return state;
      
      // If this is the local player, emit position to other players
      if (id === state.localPlayerId) {
        emitPlayerMove(id, position, rotation);
      }
      
      return {
        players: {
          ...state.players,
          [id]: {
            ...player,
            position,
            rotation
          }
        }
      };
    });
  },
  
  // Tag a player
  tagPlayer: (taggedId, taggerId) => {
    set(state => {
      const taggedPlayer = state.players[taggedId];
      const taggerPlayer = state.players[taggerId];
      
      if (!taggedPlayer || !taggerPlayer || taggedPlayer.isIt || !taggerPlayer.isIt || !taggedPlayer.isAlive) {
        return state;
      }
      
      // Emit player tagged event for multiplayer
      if (taggerId === state.localPlayerId) {
        emitPlayerTagged(taggedId, taggerId);
      }
      
      // Count how many players the tagger has tagged
      let tagCount = 1; // Start with 1 for the original "it"
      Object.values(state.players).forEach(player => {
        if (player.isIt && player.taggedTime) {
          tagCount++;
        }
      });
      
      // Scale based on tag count
      const newScale = Math.min(1 + (tagCount * 0.1), 2); // Cap at 2x original size
      
      const now = Date.now();
      const newPlayers = {
        ...state.players,
        [taggedId]: {
          ...taggedPlayer,
          isIt: true,
          taggedTime: now,
          powerUp: null,
          powerUpEndTime: null,
          scale: 1.1, // New "it" player gets a small boost
        },
        [taggerId]: {
          ...taggerPlayer,
          scale: newScale,
        }
      };
      
      // Check if the round is over (all players are "it")
      const untaggedPlayers = Object.values(newPlayers).filter(p => !p.isIt && p.isAlive);
      if (untaggedPlayers.length === 0) {
        setTimeout(() => {
          get().endRound();
        }, 1000);
      }
      
      return {
        players: newPlayers,
        survivalTimes: {
          ...state.survivalTimes,
          [taggedId]: now - (state.roundStartTime || 0)
        }
      };
    });
  },
  
  // Add a new power-up to the game
  addPowerUp: (type, position) => {
    const powerUpId = `powerup-${uuidv4()}`;
    
    const newPowerUp: PowerUp = {
      id: powerUpId,
      type,
      position,
      createdAt: Date.now()
    };
    
    set(state => ({
      powerUps: {
        ...state.powerUps,
        [powerUpId]: newPowerUp
      }
    }));
    
    return powerUpId;
  },
  
  // Player collects a power-up
  collectPowerUp: (playerId, powerUpId) => {
    set(state => {
      const player = state.players[playerId];
      const powerUp = state.powerUps[powerUpId];
      
      if (!player || !powerUp || player.isIt) return state;
      
      // Emit power-up collected for multiplayer
      if (playerId === state.localPlayerId) {
        emitPowerUpCollected(powerUpId);
      }
      
      const newPowerUps = { ...state.powerUps };
      delete newPowerUps[powerUpId];
      
      return {
        players: {
          ...state.players,
          [playerId]: {
            ...player,
            powerUp: powerUp.type
          }
        },
        powerUps: newPowerUps
      };
    });
  },
  
  // Activate a player's power-up
  activatePowerUp: (playerId) => {
    set(state => {
      const player = state.players[playerId];
      
      if (!player || !player.powerUp || player.powerUpEndTime) return state;
      
      // Emit power-up activation for multiplayer
      if (playerId === state.localPlayerId) {
        emitPowerUpActivated(player.powerUp);
      }
      
      // Power-up lasts for 5 seconds
      const powerUpEndTime = Date.now() + 5000;
      
      return {
        players: {
          ...state.players,
          [playerId]: {
            ...player,
            powerUpEndTime
          }
        }
      };
    });
    
    // Automatically deactivate power-up after 5 seconds
    setTimeout(() => {
      set(state => {
        const player = state.players[playerId];
        if (!player) return state;
        
        return {
          players: {
            ...state.players,
            [playerId]: {
              ...player,
              powerUp: null,
              powerUpEndTime: null
            }
          }
        };
      });
    }, 5000);
  },
  
  // Move bots based on simple AI
  moveBots: () => {
    set(state => {
      const newPlayers = { ...state.players };
      
      // Get all human players for bots to chase or flee from
      const humans = Object.values(state.players).filter(p => 
        p.type === 'human' && p.isAlive
      );
      
      // Move each bot
      Object.keys(newPlayers).forEach(id => {
        const bot = newPlayers[id];
        if (bot.type !== 'bot' || !bot.isAlive) return;
        
        // Bot AI logic
        const botSpeed = bot.isIt ? 0.15 : 0.1; // "It" bots move faster
        
        if (bot.isIt) {
          // Chase the nearest untagged human
          const target = humans.find(h => !h.isIt);
          if (target) {
            const direction = new THREE.Vector3()
              .subVectors(target.position, bot.position)
              .normalize()
              .multiplyScalar(botSpeed);
            
            bot.position.add(direction);
            bot.rotation = Math.atan2(direction.x, direction.z);
          } else {
            // Random movement if no target
            bot.position.x += (Math.random() - 0.5) * botSpeed;
            bot.position.z += (Math.random() - 0.5) * botSpeed;
          }
        } else {
          // Flee from "it" players
          const itPlayers = Object.values(state.players).filter(p => p.isIt && p.isAlive);
          
          if (itPlayers.length > 0) {
            // Find the nearest "it" player
            let nearestIt = itPlayers[0];
            let minDist = bot.position.distanceTo(nearestIt.position);
            
            itPlayers.forEach(it => {
              const dist = bot.position.distanceTo(it.position);
              if (dist < minDist) {
                minDist = dist;
                nearestIt = it;
              }
            });
            
            // Flee in the opposite direction
            if (minDist < 10) { // Only flee if "it" is close
              const direction = new THREE.Vector3()
                .subVectors(bot.position, nearestIt.position)
                .normalize()
                .multiplyScalar(botSpeed);
              
              bot.position.add(direction);
              bot.rotation = Math.atan2(direction.x, direction.z);
            } else {
              // Random movement if no threat
              bot.position.x += (Math.random() - 0.5) * botSpeed;
              bot.position.z += (Math.random() - 0.5) * botSpeed;
            }
          } else {
            // Random movement if no threat
            bot.position.x += (Math.random() - 0.5) * botSpeed;
            bot.position.z += (Math.random() - 0.5) * botSpeed;
          }
        }
        
        // Keep bots within bounds
        const ARENA_SIZE = 40;
        bot.position.x = Math.max(-ARENA_SIZE/2, Math.min(ARENA_SIZE/2, bot.position.x));
        bot.position.z = Math.max(-ARENA_SIZE/2, Math.min(ARENA_SIZE/2, bot.position.z));
      });
      
      return { players: newPlayers };
    });
  }
}));

// Function to spawn power-ups randomly
export const startPowerUpSpawner = () => {
  const spawnPowerUp = () => {
    const gameStore = useGameStore.getState();
    if (!gameStore.isGameActive) return;
    
    // Randomly choose a power-up type
    const powerUpTypes: PowerUpType[] = ['speed', 'invisibility', 'flight'];
    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    // Random position within arena bounds
    const position = new THREE.Vector3(
      (Math.random() - 0.5) * 40,
      1,
      (Math.random() - 0.5) * 40
    );
    
    gameStore.addPowerUp(type, position);
    
    // Schedule next power-up spawn
    const nextSpawnTime = 15000 + Math.random() * 5000; // 15-20 seconds
    setTimeout(spawnPowerUp, nextSpawnTime);
  };
  
  // Start spawning
  spawnPowerUp();
};

// Start bot movement simulation
export const startBotMovement = () => {
  setInterval(() => {
    const gameStore = useGameStore.getState();
    if (gameStore.isGameActive) {
      gameStore.moveBots();
    }
  }, 100); // Update bot positions 10 times per second
};

// Function to end game session on application exit
export const cleanupGameSession = async () => {
  const gameStore = useGameStore.getState();
  if (gameStore.gameSession && gameStore.isDbConnected) {
    await endGameSession(gameStore.gameSession.id);
  }
};

// Add event listener for window unload to clean up game session
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cleanupGameSession();
  });
}