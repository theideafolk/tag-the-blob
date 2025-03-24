/**
 * PowerUp component that renders power-up items in the game
 * Displays different visual effects based on power-up type
 */
import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PowerUpType, useGameStore } from '../store/gameStore';

interface PowerUpProps {
  id: string;
  position: THREE.Vector3;
  type: PowerUpType;
}

const PowerUp: React.FC<PowerUpProps> = ({ id, position, type }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const collectPowerUp = useGameStore(state => state.collectPowerUp);
  const localPlayerId = useGameStore(state => state.localPlayerId);
  const players = useGameStore(state => state.players);
  
  // Check for collision with any non-"it" player
  useEffect(() => {
    if (!meshRef.current) return;
    
    const checkCollision = () => {
      const powerUpPosition = new THREE.Vector3().copy(position);
      
      // Check collision with local player first
      if (localPlayerId) {
        const localPlayer = players[localPlayerId];
        if (localPlayer && !localPlayer.isIt && localPlayer.isAlive) {
          const playerPosition = new THREE.Vector3().copy(localPlayer.position);
          const distance = powerUpPosition.distanceTo(playerPosition);
          
          // Increased collision radius for better collection
          if (distance < 2.5) {
            console.log('Local player collecting power-up:', localPlayerId); // Debug log
            collectPowerUp(localPlayerId, id);
            return; // Exit after collecting
          }
        }
      }
      
      // Then check collision with other players
      Object.values(players).forEach(player => {
        if (player.id !== localPlayerId && !player.isIt && player.isAlive) {
          const playerPosition = new THREE.Vector3().copy(player.position);
          const distance = powerUpPosition.distanceTo(playerPosition);
          
          if (distance < 2.5) {
            console.log('Other player collecting power-up:', player.id); // Debug log
            collectPowerUp(player.id, id);
          }
        }
      });
    };
    
    // Check for collisions more frequently
    const interval = setInterval(checkCollision, 25); // Check every 25ms
    return () => clearInterval(interval);
  }, [id, position, players, collectPowerUp, localPlayerId]);
  
  // Animation for the power-up
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Hover animation
    meshRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime * 2) * 0.2 + 0.5;
    
    // Rotation animation
    meshRef.current.rotation.y += 0.01;
  });
  
  // Use different geometries and materials based on power-up type
  let geometry;
  let material;
  
  switch (type) {
    case 'speed':
      geometry = <dodecahedronGeometry args={[0.5, 0]} />;
      material = (
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFFF00"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      );
      break;
    
    case 'invisibility':
      geometry = <icosahedronGeometry args={[0.5, 0]} />;
      material = (
        <meshStandardMaterial
          color="#FFFFFF"
          transparent={true}
          opacity={0.6}
          emissive="#FFFFFF"
          emissiveIntensity={0.2}
          metalness={0.1}
          roughness={0.1}
        />
      );
      break;
    
    case 'flight':
      geometry = <torusGeometry args={[0.3, 0.2, 16, 16]} />;
      material = (
        <meshStandardMaterial
          color="#00BFFF"
          emissive="#00FFFF"
          emissiveIntensity={0.5}
          metalness={0.6}
          roughness={0.3}
        />
      );
      break;
    
    default:
      geometry = <sphereGeometry args={[0.5, 16, 16]} />;
      material = <meshStandardMaterial color="#FFFFFF" />;
  }
  
  return (
    <mesh
      ref={meshRef}
      position={[position.x, position.y, position.z]}
      castShadow
    >
      {geometry}
      {material}
    </mesh>
  );
};

export default PowerUp;