/**
 * MobileControls component that provides touch controls for mobile devices
 * Renders virtual joystick for movement on touchscreens
 */
import React, { useState, useEffect } from 'react';
import { useControlsStore } from './useControls';
import { useGameStore } from '../store/gameStore';

const MobileControls: React.FC = () => {
  const { setKey } = useControlsStore();
  const [isMobile, setIsMobile] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [basePos, setBasePos] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);
  
  const localPlayerId = useGameStore(state => state.localPlayerId);
  const players = useGameStore(state => state.players);
  const activatePowerUp = useGameStore(state => state.activatePowerUp);
  
  const localPlayer = localPlayerId ? players[localPlayerId] : null;
  const hasPowerUp = localPlayer?.powerUp && !localPlayer?.powerUpEndTime;
  
  // Check if the device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Don't render controls on desktop
  if (!isMobile) return null;
  
  // Handle touch start for joystick
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    
    setBasePos({ x, y });
    setJoystickPos({ x: 0, y: 0 });
    setIsPressed(true);
  };
  
  // Handle touch move for joystick
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPressed) return;
    
    const touch = e.touches[0];
    
    // Calculate joystick position relative to base
    const deltaX = touch.clientX - basePos.x;
    const deltaY = touch.clientY - basePos.y;
    
    // Limit the joystick movement radius
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxRadius = 50;
    
    const limitedX = deltaX * (distance > maxRadius ? maxRadius / distance : 1);
    const limitedY = deltaY * (distance > maxRadius ? maxRadius / distance : 1);
    
    setJoystickPos({ x: limitedX, y: limitedY });
    
    // Convert joystick position to movement controls
    // Normalize the values
    const normalizedX = limitedX / maxRadius;
    const normalizedY = limitedY / maxRadius;
    
    // Set movement keys based on joystick position
    // We use a threshold to avoid drift
    const threshold = 0.3;
    
    setKey('forward', normalizedY < -threshold);
    setKey('backward', normalizedY > threshold);
    setKey('left', normalizedX < -threshold);
    setKey('right', normalizedX > threshold);
  };
  
  // Handle touch end for joystick
  const handleTouchEnd = () => {
    setIsPressed(false);
    setJoystickPos({ x: 0, y: 0 });
    
    // Reset all movement keys
    setKey('forward', false);
    setKey('backward', false);
    setKey('left', false);
    setKey('right', false);
  };
  
  // Handle power-up button touch
  const handlePowerUpTouch = () => {
    if (localPlayerId && hasPowerUp) {
      activatePowerUp(localPlayerId);
    }
  };
  
  // Determine power-up button color based on type
  const getPowerUpColor = () => {
    if (!localPlayer?.powerUp) return 'bg-gray-400';
    
    switch (localPlayer.powerUp) {
      case 'speed':
        return 'bg-yellow-400';
      case 'invisibility':
        return 'bg-blue-300';
      case 'flight':
        return 'bg-cyan-400';
      default:
        return 'bg-gray-400';
    }
  };
  
  return (
    <>
      {/* Joystick control */}
      <div className="fixed bottom-10 left-10 touch-none z-10">
        <div
          className="relative w-40 h-40 rounded-full bg-black/20 border-2 border-white/30"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="absolute w-20 h-20 rounded-full bg-white/50 border-2 border-white/70"
            style={{
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
              top: 'calc(50% - 40px)',
              left: 'calc(50% - 40px)',
              transition: isPressed ? 'none' : 'transform 0.2s ease-out'
            }}
          />
        </div>
      </div>
      
      {/* Power-up button */}
      <div className="fixed bottom-10 right-10 touch-none z-10">
        <button
          className={`w-20 h-20 rounded-full ${getPowerUpColor()} border-2 border-white/70 ${!hasPowerUp ? 'opacity-50' : ''}`}
          onTouchStart={handlePowerUpTouch}
          disabled={!hasPowerUp}
        >
          <span className="text-white font-bold">
            {localPlayer?.powerUp ? localPlayer.powerUp.substring(0, 4).toUpperCase() : 'NONE'}
          </span>
        </button>
      </div>
    </>
  );
};

export default MobileControls;