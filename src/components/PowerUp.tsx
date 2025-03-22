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
  
  // Check for collision with the local player
  useEffect(() => {
    if (!meshRef.current || !localPlayerId) return;
    
    const checkCollision = () => {
      const player = players[localPlayerId];
      if (!player || player.isIt) return;
      
      const distance = position.distanceTo(player.position);
      if (distance < 1.5) {
        collectPowerUp(localPlayerId, id);
      }
    };
    
    const interval = setInterval(checkCollision, 100);
    return () => clearInterval(interval);
  }, [id, position, localPlayerId, players, collectPowerUp]);
  
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