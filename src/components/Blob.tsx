/**
 * Blob component that represents the player character
 * Handles the blob model loading, movement, and visual effects
 * Displays player name above the blob for identification
 */
import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useControls } from './useControls';
import { Player, PowerUpType, useGameStore } from '../store/gameStore';

interface BlobProps {
  player: Player;
  isLocalPlayer?: boolean;
}

const Blob: React.FC<BlobProps> = ({ 
  player,
  isLocalPlayer = false
}) => {
  const blobRef = useRef<THREE.Group>(null);
  const crownRef = useRef<THREE.Group | null>(null);
  const { scene } = useThree();
  const { keys } = useControls();
  
  // Load the blob model
  const { scene: blobScene } = useGLTF('/assets/blob.glb', true);
  // Load the crown model if the blob is "it"
  const { scene: crownScene } = useGLTF('/assets/blob-crown.glb', true);
  
  // Clone the models to avoid reference issues
  const blobModel = blobScene.clone();
  
  // Reference to the store's update function
  const updatePlayerPosition = useGameStore(state => state.updatePlayerPosition);
  const tagPlayer = useGameStore(state => state.tagPlayer);
  const activatePowerUp = useGameStore(state => state.activatePowerUp);
  
  // Movement parameters
  const baseSpeed = 0.1;
  const rotationSpeed = 0.1;
  const currentVelocity = useRef(new THREE.Vector3(0, 0, 0));
  
  // Debug state to verify local player
  const [debugInfo, setDebugInfo] = useState({
    isLocalPlayer: isLocalPlayer,
    playerId: player.id
  });
  
  // Set up the blob model
  useEffect(() => {
    if (blobRef.current) {
      // Apply color to the blob
      blobRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.color.set(player.color);
              }
            });
          } else if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.set(player.color);
          }
        }
      });
    }
    
    // Update debug info
    setDebugInfo({
      isLocalPlayer: isLocalPlayer,
      playerId: player.id
    });
  }, [player.color, isLocalPlayer, player.id]);
  
  // Handle crown visibility based on "it" status
  useEffect(() => {
    // Remove existing crown if any
    if (crownRef.current && blobRef.current) {
      blobRef.current.remove(crownRef.current);
      crownRef.current = null;
    }
    
    // Add crown if the player is "it"
    if (player.isIt && blobRef.current) {
      const newCrownModel = crownScene.clone();
      newCrownModel.position.set(0, 1.5, 0);
      newCrownModel.scale.set(1/player.scale, 1/player.scale, 1/player.scale); // Adjust crown scale
      
      blobRef.current.add(newCrownModel);
      crownRef.current = newCrownModel;
    }
  }, [player.isIt, crownScene, player.scale]);
  
  // Apply power-up effects
  useEffect(() => {
    if (!blobRef.current) return;
    
    // Find the main mesh in the blob group
    const mainMesh = blobRef.current.children.find(child => 
      child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial
    ) as THREE.Mesh;
    
    if (!mainMesh) return;
    
    if (player.powerUp && player.powerUpEndTime && player.powerUpEndTime > Date.now()) {
      switch (player.powerUp) {
        case 'speed':
          // Speed effect is handled in updatePlayerPosition
          break;
          
        case 'invisibility':
          // Only make invisible to "it" players
          if (isLocalPlayer || !player.isIt) {
            (mainMesh.material as THREE.MeshStandardMaterial).transparent = true;
            (mainMesh.material as THREE.MeshStandardMaterial).opacity = 0.3;
          }
          break;
          
        case 'flight':
          // Flight effect is handled in updatePlayerPosition
          break;
      }
    } else {
      // Reset effects when power-up ends
      (mainMesh.material as THREE.MeshStandardMaterial).transparent = false;
      (mainMesh.material as THREE.MeshStandardMaterial).opacity = 1;
    }
  }, [player.powerUp, player.powerUpEndTime, player.isIt, isLocalPlayer]);
  
  // Handle collision detection with other players
  useEffect(() => {
    if (!blobRef.current || !player.isIt) return;
    
    const checkCollisions = () => {
      if (!player.isIt || !player.isAlive) return;
      
      const players = useGameStore.getState().players;
      const thisPosition = new THREE.Vector3().copy(player.position);
      
      Object.values(players).forEach(otherPlayer => {
        if (otherPlayer.id === player.id || otherPlayer.isIt || !otherPlayer.isAlive) return;
        
        // Skip if other player has flight power-up
        if (otherPlayer.powerUp === 'flight' && 
            otherPlayer.powerUpEndTime && 
            otherPlayer.powerUpEndTime > Date.now()) {
          return;
        }
        
        // Skip if other player has invisibility and we're not the local player
        if (otherPlayer.powerUp === 'invisibility' && 
            otherPlayer.powerUpEndTime && 
            otherPlayer.powerUpEndTime > Date.now() && 
            !isLocalPlayer) {
          return;
        }
        
        const otherPosition = new THREE.Vector3().copy(otherPlayer.position);
        const distance = thisPosition.distanceTo(otherPosition);
        
        // Increased collision radius for better tagging
        const collisionRadius = 2.0 * (player.scale + otherPlayer.scale) / 2;
        
        if (distance < collisionRadius) {
          // Tag the player
          tagPlayer(otherPlayer.id, player.id);
        }
      });
    };
    
    // Check for collisions more frequently
    const collisionInterval = setInterval(checkCollisions, 50);
    return () => clearInterval(collisionInterval);
  }, [player.id, player.isIt, player.isAlive, player.position, player.scale, tagPlayer, isLocalPlayer]);
  
  // Handle movement in the game loop - ONLY for the local player
  useFrame((state, delta) => {
    if (!blobRef.current) return;
    
    // CRITICAL: Only process input controls for the local player
    // This ensures only the player's blob responds to their keyboard input
    let isMoving = false;
    
    if (isLocalPlayer) {
      // Calculate movement direction based on keys pressed
      const direction = new THREE.Vector3();
      
      // Use absolute world coordinates for movement
      if (keys.forward) direction.z -= 1;  // Move forward (negative Z)
      if (keys.backward) direction.z += 1; // Move backward (positive Z)
      if (keys.left) direction.x -= 1;     // Move left (negative X)
      if (keys.right) direction.x += 1;    // Move right (positive X)
      
      // Activate power-up on spacebar
      if (keys.action && player.powerUp && !player.powerUpEndTime) {
        activatePowerUp(player.id);
      }
      
      // Normalize direction if moving diagonally
      if (direction.length() > 0) {
        direction.normalize();
        isMoving = true;
        
        // Calculate speed based on player state
        let speed = baseSpeed;
        
        // "It" players move 10% faster
        if (player.isIt) {
          speed *= 1.1;
        }
        
        // Speed boost power-up
        if (player.powerUp === 'speed' && 
            player.powerUpEndTime && 
            player.powerUpEndTime > Date.now()) {
          speed *= 1.5;
        }
        
        // Apply movement
        const targetVelocity = new THREE.Vector3(direction.x, 0, direction.z).multiplyScalar(speed);
        
        // Smooth movement with acceleration
        currentVelocity.current.lerp(targetVelocity, 0.2);
        
        // Update position
        const newPosition = new THREE.Vector3().copy(player.position).add(currentVelocity.current);
        
        // Keep player within bounds
        const ARENA_SIZE = 40;
        newPosition.x = Math.max(-ARENA_SIZE/2, Math.min(ARENA_SIZE/2, newPosition.x));
        newPosition.z = Math.max(-ARENA_SIZE/2, Math.min(ARENA_SIZE/2, newPosition.z));
        
        // Adjust Y position for flight power-up
        if (player.powerUp === 'flight' && 
            player.powerUpEndTime && 
            player.powerUpEndTime > Date.now()) {
          newPosition.y = 3; // Hover above the ground
        } else {
          newPosition.y = 1; // Normal height
        }
        
        // Calculate rotation based on movement direction
        const newRotation = Math.atan2(currentVelocity.current.x, currentVelocity.current.z);
        
        // Update both the blob reference and the store
        if (blobRef.current) {
          blobRef.current.position.copy(newPosition);
          // Sync position and rotation to store
          updatePlayerPosition(player.id, newPosition, newRotation);
        }
      } else {
        // Decelerate when no keys are pressed
        currentVelocity.current.multiplyScalar(0.9);
        
        if (currentVelocity.current.length() > 0.01) {
          const newPosition = new THREE.Vector3().copy(player.position).add(currentVelocity.current);
          
          // Keep player within bounds
          const ARENA_SIZE = 40;
          newPosition.x = Math.max(-ARENA_SIZE/2, Math.min(ARENA_SIZE/2, newPosition.x));
          newPosition.z = Math.max(-ARENA_SIZE/2, Math.min(ARENA_SIZE/2, newPosition.z));
          
          updatePlayerPosition(player.id, newPosition, player.rotation);
        }
      }
    }
    
    // For ALL players (local and non-local), update mesh position and rotation from store
    if (blobRef.current) {
      // Update the group position to match the player's state
      blobRef.current.position.copy(player.position);
      
      // Apply bounce effect
      const bounce = Math.abs(Math.sin(state.clock.elapsedTime * 5)) * 0.05;
      blobRef.current.position.y += bounce;
      
      // Scale the blob slightly based on movement for a squish effect
      if (isLocalPlayer && isMoving) {
        const squish = 1 + (Math.abs(Math.sin(state.clock.elapsedTime * 10)) * 0.05);
        blobRef.current.scale.set(
          player.scale * squish, 
          player.scale * (2 - squish), 
          player.scale * squish
        );
      } else {
        // Reset scale when not moving
        blobRef.current.scale.set(player.scale, player.scale, player.scale);
      }
    }
  });
  
  // Don't render invisible players unless they're the local player
  if (player.powerUp === 'invisibility' && 
      player.powerUpEndTime && 
      player.powerUpEndTime > Date.now() && 
      !isLocalPlayer) {
    return null;
  }
  
  return (
    <group>
      {/* Root container at player position */}
      <group 
        ref={blobRef}
        position={player.position}
      >
        {/* The blob model with rotation */}
        <group rotation-y={player.rotation}>
          <primitive object={blobModel} />
        </group>

        {/* 2D overlays that always face camera */}
        <Billboard>
          {/* Player name label */}
          <Text
            position={[0, 2.5, 0]}
            fontSize={0.5}
            color={player.isIt ? "#ff4444" : "#ffffff"}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#000000"
            outlineOpacity={0.8}
            maxWidth={5}
            overflowWrap="break-word"
            whiteSpace="nowrap"
          >
            {player.name}
            {isLocalPlayer && " (You)"}
          </Text>
          
          {/* Local player indicator (arrow above) */}
          {isLocalPlayer && (
            <mesh position={[0, 3.2, 0]}>
              <coneGeometry args={[0.2, 0.4, 16]} />
              <meshStandardMaterial color="#44ff44" emissive="#22cc22" emissiveIntensity={0.5} />
            </mesh>
          )}
        </Billboard>
      </group>
    </group>
  );
};

export default Blob;

// Preload models to avoid glitches when first rendering
useGLTF.preload('/assets/blob.glb');
useGLTF.preload('/assets/blob-crown.glb');