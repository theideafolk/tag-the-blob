/**
 * Main App component that renders the 3D Tag game
 * It sets up the container for the 3D game and handles the game state
 */
import React, { useState, useEffect } from 'react';
import Game from './components/Game';

function App() {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
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

  return (
    <div className="w-full h-screen">
      <Game />
      
      {/* Controls info overlay */}
      <div className="absolute bottom-4 left-4 bg-black/50 text-white p-2 rounded">
        <p className="text-sm">{isMobile ? "Use joystick to move" : "WASD to move, SPACE for power-ups"}</p>
      </div>
    </div>
  );
}

export default App;