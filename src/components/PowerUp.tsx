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
  
  let scene;
  try {
    const result = useGLTF(modelPath);
    scene = result.scene;
    console.log('Model loaded successfully:', { type, scene });
    
    // Ensure the model is properly scaled and positioned
    scene.scale.set(0.75, 0.75, 0.75);
    scene.position.set(position.x, position.y, position.z);
    
    // Log scene details
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        console.log('Mesh found in model:', {
          name: child.name,
          geometry: child.geometry,
          material: child.material,
          position: child.position,
          scale: child.scale,
          rotation: child.rotation
        });
        
        // Ensure materials are properly configured
        if (child.material) {
          child.material.transparent = true;
          child.material.opacity = 1;
          child.material.needsUpdate = true;
        }
      }
    });
  } catch (error) {
    console.error('Error loading model:', { type, error });
  }

  useEffect(() => {
    if (!meshRef.current) return;

    const checkCollision = () => {
      if (!meshRef.current) return;

      // Check collision with all non-"it" players
      Object.values(players).forEach(player => {
        if (!player.isIt && player.isAlive) {
          const distance = player.position.distanceTo(position);
          if (distance < 3.75) { // Increased collision radius by 25% from 3.0
            console.log(`Power-up collection! Player ${player.id} collected ${type} power-up`);
            collectPowerUp(player.id, id);
            return; // Exit immediately after collection
          }
        }
      });
    };

    const interval = setInterval(checkCollision, 50); // Check more frequently
    return () => clearInterval(interval);
  }, [id, players, collectPowerUp, type, position]);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Hover effect
    meshRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    // Rotation
    meshRef.current.rotation.y = state.clock.elapsedTime;
  });

  if (!type || !scene) return null;

  console.log('Rendering power-up:', { id, type, position }); // Debug log

  return (
    <primitive
      ref={meshRef}
      object={scene}
      position={[position.x, position.y, position.z]}
      scale={[0.75, 0.75, 0.75]}
      rotation={[0, 0, 0]}
    />
  );
};

// Preload all power-up models
useGLTF.preload('/assets/models/speed.glb');
useGLTF.preload('/assets/models/invisibility.glb');
useGLTF.preload('/assets/models/flight.glb');