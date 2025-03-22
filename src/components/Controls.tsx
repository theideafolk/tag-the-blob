/**
 * Controls component that handles keyboard input for player movement
 * This is a hidden component that manages the global keyboard state
 */
import React, { useEffect } from 'react';
import { useControlsStore } from './useControls';
import { useGameStore } from '../store/gameStore';

const Controls: React.FC = () => {
  const { setKey } = useControlsStore();
  const localPlayerId = useGameStore(state => state.localPlayerId);
  
  // Handle keyboard events
  useEffect(() => {
    // Only register controls if we have a local player
    if (!localPlayerId) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for game controls
      if (e.key && ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      
      if (!e.key) return;
      
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setKey('forward', true);
          break;
        case 's':
        case 'arrowdown':
          setKey('backward', true);
          break;
        case 'a':
        case 'arrowleft':
          setKey('left', true);
          break;
        case 'd':
        case 'arrowright':
          setKey('right', true);
          break;
        case ' ':
          setKey('action', true);
          break;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.key) return;
      
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setKey('forward', false);
          break;
        case 's':
        case 'arrowdown':
          setKey('backward', false);
          break;
        case 'a':
        case 'arrowleft':
          setKey('left', false);
          break;
        case 'd':
        case 'arrowright':
          setKey('right', false);
          break;
        case ' ':
          setKey('action', false);
          break;
      }
    };
    
    // Add event listeners for key presses
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Clean up event listeners on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setKey, localPlayerId]);
  
  return null; // This component doesn't render anything
};

export default Controls;