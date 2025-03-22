/**
 * Game component that sets up the Three.js scene, camera, and renderer
 * It also handles the game loop and rendering
 */
import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stats } from '@react-three/drei';
import * as THREE from 'three';
import Blob from './Blob';
import Arena from './Arena';
import Controls from './Controls';
import MobileControls from './MobileControls';
import PowerUp from './PowerUp';
import GameUI from './GameUI';
import { useGameStore, startPowerUpSpawner, startBotMovement } from '../store/gameStore';
import { initializeSocket, emitPlayerJoin } from '../services/socket';

const Game: React.FC = () => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const orbitControlsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  
  // Access game state
  const players = useGameStore(state => state.players);
  const powerUps = useGameStore(state => state.powerUps);
  const localPlayerId = useGameStore(state => state.localPlayerId);
  const addPlayer = useGameStore(state => state.addPlayer);
  
  // Initialize socket connection
  useEffect(() => {
    const socket = initializeSocket();
    
    // Clean up on unmount
    return () => {
      socket.disconnect();
    };
  }, []);
  
  // Initialize game systems
  useEffect(() => {
    // Start power-up spawner
    startPowerUpSpawner();
    
    // Start bot movement
    startBotMovement();
  }, []);
  
  // Set up fixed camera perspective and constraints
  useEffect(() => {
    if (!orbitControlsRef.current || !cameraRef.current) return;
    
    // Set initial camera position to be behind and above player
    if (localPlayerId && players[localPlayerId]) {
      const player = players[localPlayerId];
      
      // Position camera behind player at an angle
      cameraRef.current.position.set(
        player.position.x, 
        player.position.y + 8, // Above player
        player.position.z + 12  // Behind player
      );
      
      // Look at player
      orbitControlsRef.current.target.set(
        player.position.x,
        player.position.y,
        player.position.z
      );
    }
    
    // Restrict rotation to prevent upside-down view and maintain mostly top-down perspective
    orbitControlsRef.current.minPolarAngle = Math.PI / 6; // Minimum angle from top (30 degrees)
    orbitControlsRef.current.maxPolarAngle = Math.PI / 2.5; // Maximum angle from top (72 degrees)
    
    // Fix the azimuthal rotation to prevent orbiting around player
    orbitControlsRef.current.enableRotate = false;
    
    // Configure damping for smooth movement
    orbitControlsRef.current.enableDamping = true;
    orbitControlsRef.current.dampingFactor = 0.1;
  }, [localPlayerId, players]);
  
  // Update camera to follow local player
  useEffect(() => {
    if (!localPlayerId || !orbitControlsRef.current || !cameraRef.current) return;
    
    const updateCameraPosition = () => {
      const localPlayer = players[localPlayerId];
      if (!localPlayer) return;
      
      // Update orbit controls target to follow player
      orbitControlsRef.current.target.set(
        localPlayer.position.x,
        localPlayer.position.y,
        localPlayer.position.z
      );
      
      // Calculate camera position to be behind player based on player's rotation
      const distance = 12; // Distance behind player
      const height = 8;   // Height above player
      
      // Move camera position to follow player with a slight delay for smoothness
      cameraRef.current.position.x = THREE.MathUtils.lerp(
        cameraRef.current.position.x, 
        localPlayer.position.x, 
        0.05
      );
      
      cameraRef.current.position.z = THREE.MathUtils.lerp(
        cameraRef.current.position.z, 
        localPlayer.position.z + distance, 
        0.05
      );
      
      cameraRef.current.position.y = THREE.MathUtils.lerp(
        cameraRef.current.position.y, 
        localPlayer.position.y + height, 
        0.05
      );
    };
    
    // Update camera immediately and set interval for continuous updates
    updateCameraPosition();
    const interval = setInterval(updateCameraPosition, 16); // ~60fps
    
    return () => clearInterval(interval);
  }, [localPlayerId, players]);
  
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
    <>
      <Canvas
        shadows
        gl={{ 
          antialias: !isMobile, // Disable antialiasing on mobile for performance
          powerPreference: "high-performance" 
        }}
        dpr={isMobile ? [1, 1.5] : [1, 2]} // Lower resolution on mobile
      >
        {/* Performance monitor */}
        <Stats />
        
        {/* Camera setup */}
        <PerspectiveCamera 
          ref={cameraRef}
          makeDefault 
          position={[0, 10, 15]} 
          fov={isMobile ? 75 : 60} 
        />
        <OrbitControls 
          ref={orbitControlsRef}
          enableZoom={true}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.5}
          minPolarAngle={Math.PI / 6}
          minDistance={5}
          maxDistance={30}
          target={localPlayerId && players[localPlayerId] ? 
            [
              players[localPlayerId].position.x,
              players[localPlayerId].position.y,
              players[localPlayerId].position.z
            ] : [0, 0, 0]
          }
          enableDamping={true}
          dampingFactor={0.1}
          enableRotate={false}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={isMobile ? 1024 : 2048}
          shadow-mapSize-height={isMobile ? 1024 : 2048}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        
        {/* Game world */}
        <Arena />
        
        {/* Game objects */}
        {Object.values(players).map(player => (
          <Blob 
            key={player.id} 
            player={player} 
            isLocalPlayer={player.id === localPlayerId}
          />
        ))}
        
        {/* Power-ups */}
        {Object.values(powerUps).map(powerUp => (
          <PowerUp
            key={powerUp.id}
            id={powerUp.id}
            position={powerUp.position}
            type={powerUp.type}
          />
        ))}
        
        {/* Controls component to handle keyboard inputs */}
        <Controls />
      </Canvas>
      
      {/* Game UI overlay */}
      <GameUI />
      
      {/* Mobile touch controls overlay */}
      <MobileControls />
    </>
  );
};

export default Game;