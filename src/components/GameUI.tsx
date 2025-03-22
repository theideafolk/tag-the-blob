/**
 * GameUI component that displays game information and controls
 * Shows round timer, player counts, and game status
 */
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { checkConnection, getTopPlayers } from '../services/supabase';
import { Database } from '../types/supabase';
import { emitPlayerJoin } from '../services/socket';

type Player = Database['public']['Tables']['players']['Row'];

const GameUI: React.FC = () => {
  const isGameActive = useGameStore(state => state.isGameActive);
  const roundStartTime = useGameStore(state => state.roundStartTime);
  const roundDuration = useGameStore(state => state.roundDuration);
  const roundNumber = useGameStore(state => state.roundNumber);
  const players = useGameStore(state => state.players);
  const localPlayerId = useGameStore(state => state.localPlayerId);
  const startGame = useGameStore(state => state.startGame);
  const addPlayer = useGameStore(state => state.addPlayer);
  const setDbConnected = useGameStore(state => state.setDbConnected);
  const isDbConnected = useGameStore(state => state.isDbConnected);
  
  const [timeRemaining, setTimeRemaining] = useState(roundDuration);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [username, setUsername] = useState('');
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Check database connection on load
  useEffect(() => {
    const connect = async () => {
      setIsConnecting(true);
      try {
        const connected = await checkConnection();
        setDbConnected(connected);
        
        if (connected) {
          // Load top players for leaderboard
          const players = await getTopPlayers();
          setTopPlayers(players || []);
        } else {
          // If not connected, clear any previous players data
          setTopPlayers([]);
        }
      } catch (err) {
        console.error('Error connecting to database:', err);
        setDbConnected(false);
        setTopPlayers([]);
      } finally {
        setIsConnecting(false);
      }
    };
    
    connect();
  }, [setDbConnected]);
  
  // Format time as MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Count of "it" vs untagged players
  const itCount = Object.values(players).filter(p => p.isIt && p.isAlive).length;
  const untaggedCount = Object.values(players).filter(p => !p.isIt && p.isAlive).length;
  
  // Update timer
  useEffect(() => {
    if (!isGameActive || !roundStartTime) return;
    
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - roundStartTime;
      const remaining = Math.max(0, roundDuration - elapsed);
      setTimeRemaining(remaining);
      
      // End the round if time runs out
      if (remaining <= 0 && isGameActive) {
        useGameStore.getState().endRound();
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [isGameActive, roundStartTime, roundDuration]);
  
  // Show username dialog if no local player
  useEffect(() => {
    if (!localPlayerId) {
      setShowUsernameDialog(true);
    }
  }, [localPlayerId]);
  
  // Handle username submission
  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use the entered username or generate a default
    const playerName = username.trim() || `Player ${Date.now() % 1000}`;
    
    // Add player with custom name
    const playerId = await addPlayer('human', playerName);
    
    // Notify other players about this player via socket
    emitPlayerJoin({
      name: playerName,
      type: 'human',
      position: players[playerId]?.position,
      rotation: players[playerId]?.rotation,
      color: players[playerId]?.color
    });
    
    // Close dialog
    setShowUsernameDialog(false);
    setUsername('');
  };
  
  // Join game as a human player
  const handleJoinGame = () => {
    if (!localPlayerId) {
      setShowUsernameDialog(true);
    } else if (!isGameActive) {
      startGame();
    }
  };
  
  // Show leaderboard
  const handleShowLeaderboard = async () => {
    // Refresh top players when opening leaderboard
    if (!showLeaderboard && isDbConnected) {
      try {
        const players = await getTopPlayers();
        setTopPlayers(players || []);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setTopPlayers([]);
      }
    }
    
    setShowLeaderboard(!showLeaderboard);
  };
  
  // Get local player status
  const localPlayer = localPlayerId ? players[localPlayerId] : null;
  const localPlayerStatus = localPlayer 
    ? localPlayer.isIt 
      ? "You're IT! Tag other blobs!" 
      : "Run from the IT blobs!"
    : "Join the game to play!";
  
  // Get player's power-up status
  const getPowerUpText = () => {
    if (!localPlayer || !localPlayer.powerUp) return '';
    
    const isActive = localPlayer.powerUpEndTime && localPlayer.powerUpEndTime > Date.now();
    const timeLeft = localPlayer.powerUpEndTime ? Math.max(0, Math.floor((localPlayer.powerUpEndTime - Date.now()) / 1000)) : 0;
    
    return isActive 
      ? `${localPlayer.powerUp.toUpperCase()} active (${timeLeft}s)` 
      : `Press SPACE to use ${localPlayer.powerUp.toUpperCase()}`;
  };
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Connection status */}
      {isConnecting && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-3 py-1 rounded text-sm">
          Connecting to database...
        </div>
      )}
      
      {/* Game status bar */}
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-black/50 text-white p-2 rounded flex items-center space-x-4">
        <div className="text-center">
          <div className="text-xs">ROUND</div>
          <div className="font-bold">{roundNumber}</div>
        </div>
        <div className="text-center">
          <div className="text-xs">TIME</div>
          <div className="font-bold">{formatTime(timeRemaining)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs">IT</div>
          <div className="font-bold text-red-400">{itCount}</div>
        </div>
        <div className="text-center">
          <div className="text-xs">SAFE</div>
          <div className="font-bold text-green-400">{untaggedCount}</div>
        </div>
      </div>
      
      {/* Player status */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-black/50 text-white p-2 rounded text-center">
        <div className="font-bold">{localPlayerStatus}</div>
        {getPowerUpText() && (
          <div className="text-sm mt-1">{getPowerUpText()}</div>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="absolute top-4 right-4 flex space-x-2 pointer-events-auto">
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleJoinGame}
        >
          {!localPlayerId ? 'Join Game' : !isGameActive ? 'Start Game' : 'Playing'}
        </button>
        <button 
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          onClick={handleShowLeaderboard}
        >
          Leaderboard
        </button>
      </div>
      
      {/* Username Dialog */}
      {showUsernameDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 pointer-events-auto">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">Join Tag the Blob</h2>
            <form onSubmit={handleUsernameSubmit}>
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Choose a Blob Name:
                </label>
                <input
                  type="text"
                  id="username"
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your blob name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
                {isDbConnected && (
                  <p className="text-gray-400 text-xs mt-1">
                    Your username and game stats will be saved in our leaderboard.
                  </p>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Start Blobbing!
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Leaderboard */}
      {showLeaderboard && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white p-4 rounded pointer-events-auto">
          <h2 className="text-xl font-bold mb-2">Leaderboard</h2>
          
          {/* Game Data Tab */}
          <div className="mb-4">
            <h3 className="text-lg font-bold mb-2">Current Game</h3>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left p-1">Name</th>
                    <th className="text-center p-1">Role</th>
                    <th className="text-right p-1">Survival</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(players)
                    .sort((a, b) => {
                      // Sort by survival time (untagged first, then by longest survival)
                      if (a.isIt && !b.isIt) return 1;
                      if (!a.isIt && b.isIt) return -1;
                      
                      const aTime = a.taggedTime ? a.taggedTime - (roundStartTime || 0) : Infinity;
                      const bTime = b.taggedTime ? b.taggedTime - (roundStartTime || 0) : Infinity;
                      
                      return bTime - aTime;
                    })
                    .map(player => (
                      <tr key={player.id} className="border-b border-gray-700">
                        <td className="p-1">
                          {player.name}
                          {player.id === localPlayerId && ' (You)'}
                        </td>
                        <td className="text-center p-1">
                          <span className={player.isIt ? 'text-red-400' : 'text-green-400'}>
                            {player.isIt ? 'IT' : 'SAFE'}
                          </span>
                        </td>
                        <td className="text-right p-1">
                          {player.taggedTime 
                            ? formatTime(player.taggedTime - (roundStartTime || 0)) 
                            : 'Still running!'
                          }
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Global Leaderboard Tab */}
          {isDbConnected && (
            <div>
              <h3 className="text-lg font-bold mb-2">All-Time Best Blobbers</h3>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left p-1">Username</th>
                      <th className="text-center p-1">Games</th>
                      <th className="text-center p-1">Times IT</th>
                      <th className="text-right p-1">Survival Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPlayers.map(player => (
                      <tr key={player.id} className="border-b border-gray-700">
                        <td className="p-1">{player.username}</td>
                        <td className="text-center p-1">{player.games_played}</td>
                        <td className="text-center p-1">{player.times_it}</td>
                        <td className="text-right p-1">{formatTime(player.total_survival_time)}</td>
                      </tr>
                    ))}
                    {topPlayers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-2 text-center text-gray-400">
                          No players yet. Be the first to join!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <button 
            className="mt-4 bg-gray-600 hover:bg-gray-700 w-full py-2 rounded"
            onClick={() => setShowLeaderboard(false)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default GameUI;