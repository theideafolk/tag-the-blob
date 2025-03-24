/**
 * Game component that sets up the Three.js scene, camera, and renderer
 * It also handles the game loop and rendering
 */
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stats, Environment } from '@react-three/drei';
import * as THREE from 'three';
import Blob from './Blob';
import Arena from './Arena';
import Controls from './Controls';
import MobileControls from './MobileControls';
import { PowerUp } from './PowerUp';
import GameUI from './GameUI';
import { useGameStore, startPowerUpSpawner, startBotMovement } from '../store/gameStore';
import { io } from 'socket.io-client';

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
    const socket = io();
    
    // Clean up on unmount
    return () => {
      socket.disconnect();
    };
  }, []);
  
  // Initialize game systems
  useEffect(() => {
    // Start power-up spawner
    const cleanup = startPowerUpSpawner();
    
    // Start bot movement
    startBotMovement();
    
    // Ensure minimum number of players only once when component mounts
    if (localPlayerId) {
      useGameStore.getState().ensureMinimumPlayers();
    }

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [localPlayerId]);
  
  // Add debug logging for power-ups
  useEffect(() => {
    console.log('Current power-ups:', powerUps);
  }, [powerUps]);
  
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
    <div className="w-full h-screen">
      <Canvas shadows>
        {/* Lighting setup */}
        <ambientLight intensity={0.8} /> {/* Increase ambient light */}
        <directionalLight
          position={[10, 10, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight
          position={[-10, 10, -5]}
          intensity={1}
          castShadow={false}
        />
        <hemisphereLight
          color="#ffffff"
          groundColor="#444444"
          intensity={0.7}
        />

        {/* Scene setup */}
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          position={[0, 15, 15]}
          fov={60}
        />
        <OrbitControls
          ref={orbitControlsRef}
          target={[0, 0, 0]}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.5}
          minDistance={10}
          maxDistance={20}
        />

        {/* Game elements */}
        <Arena />
        {Object.values(players).map((player) => (
          <Blob
            key={player.id}
            player={player}
            isLocalPlayer={player.id === localPlayerId}
          />
        ))}
        {Object.values(powerUps).map((powerUp) => (
          <PowerUp
            key={powerUp.id}
            id={powerUp.id}
            position={powerUp.position}
            type={powerUp.type}
          />
        ))}
      </Canvas>

      {/* Controls */}
      {isMobile ? (
        <MobileControls />
      ) : (
        <Controls />
      )}
      
      {/* Game UI overlay */}
      <GameUI />
    </div>
  );
};

export default Game;