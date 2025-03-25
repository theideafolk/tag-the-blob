/**
 * Arena component that creates a backyard garden playground for the game
 */
import React from 'react';
import { Grid, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Fence component
const Fence: React.FC<{ position: [number, number, number], rotation: [number, number, number] }> = ({ position, rotation }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Fence posts */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.1, 1, 0.1]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      {/* Fence rails */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[1, 0.1, 0.1]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1, 0.1, 0.1]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
    </group>
  );
};

// Tree component
const Tree: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Tree trunk */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
        <meshStandardMaterial color="#4A2F10" />
      </mesh>
      {/* Tree top */}
      <mesh position={[0, 2.5, 0]}>
        <coneGeometry args={[1, 2, 8]} />
        <meshStandardMaterial color="#2D5A27" />
      </mesh>
    </group>
  );
};

// Flower component
const Flower: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Flower stem */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
        <meshStandardMaterial color="#2D5A27" />
      </mesh>
      {/* Flower petals */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#FF69B4" />
      </mesh>
    </group>
  );
};

// Main Arena component
const Arena: React.FC = () => {
  return (
    <group>
      {/* Ground with grass texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial 
          color="#2D5A27" // Natural grass green
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      
      {/* Fences around the arena */}
      {[-40, 40].map((x) => (
        <Fence key={`fence-x-${x}`} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      ))}
      {[-40, 40].map((z) => (
        <Fence key={`fence-z-${z}`} position={[0, 0, z]} rotation={[0, 0, 0]} />
      ))}
      
      {/* Trees */}
      <Tree position={[-30, 0, -30]} />
      <Tree position={[30, 0, 30]} />
      <Tree position={[-30, 0, 30]} />
      <Tree position={[30, 0, -30]} />
      
      {/* Flowers scattered around */}
      {[-20, -10, 0, 10, 20].map((x) => 
        [-20, -10, 0, 10, 20].map((z) => (
          <Flower key={`flower-${x}-${z}`} position={[x, 0, z]} />
        ))
      )}
      
      {/* Add subtle fog to enhance depth */}
      <fog attach="fog" args={["#87CEEB", 50, 100]} /> {/* Sky blue fog */}
      
      {/* Lighting setup */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight
        position={[-10, 10, -5]}
        intensity={0.5}
        castShadow={false}
      />
      <hemisphereLight 
        args={["#87CEEB", "#2D5A27", 0.5]} 
        position={[0, 50, 0]} 
      />
    </group>
  );
};

export default Arena;