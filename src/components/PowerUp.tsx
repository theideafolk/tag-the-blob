/**
 * PowerUp component that renders power-up items in the game
 * Displays different visual effects based on power-up type
 */
import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useGameStore, PowerUpType } from '../store/gameStore';

interface PowerUpProps {
  id: string;
  position: THREE.Vector3;
  type: PowerUpType;
}

export const PowerUp: React.FC<PowerUpProps> = ({ id, position, type }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { collectPowerUp, players } = useGameStore();

  // Load the appropriate GLB model based on power-up type
  const modelPath = type ? `/assets/models/${type}.glb` : '';
  console.log('Loading power-up model:', { type, modelPath, position }); // Debug log
  const { scene } = useGLTF(modelPath);

  // Use useFrame for continuous collision checking
  useFrame(() => {
    if (!meshRef.current) return;

    // Check collision with all non-"it" players
    Object.values(players).forEach(player => {
      if (!player.isIt && player.isAlive && !player.powerUp) { // Only check if player has no active power-up
        const distance = player.position.distanceTo(position);
        if (distance < 3.75) { // Increased collision radius by 25% from 3.0
          console.log(`Power-up collection! Player ${player.id} collected ${type} power-up`);
          collectPowerUp(player.id, id);
        }
      }
    });

    // Hover effect
    meshRef.current.position.y = position.y + Math.sin(Date.now() * 0.002) * 0.2;
    // Rotation
    meshRef.current.rotation.y += 0.02;
  });

  if (!type) return null;

  console.log('Rendering power-up:', { id, type, position }); // Debug log

  // Get color based on power-up type
  const color = type === 'speed' ? '#ff0000' : 
                type === 'invisibility' ? '#00ff00' : 
                '#0000ff'; // flight

  return (
    <mesh
      ref={meshRef}
      position={[position.x, position.y, position.z]}
      scale={[1, 1, 1]}
    >
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial 
        color={color}
        metalness={0.5}
        roughness={0.2}
        emissive={color}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
};

// Preload all power-up models
useGLTF.preload('/assets/models/speed.glb');
useGLTF.preload('/assets/models/invisibility.glb');
useGLTF.preload('/assets/models/flight.glb');