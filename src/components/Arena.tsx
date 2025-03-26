/**
 * Arena component that creates a backyard garden playground for the game
 */
import React, { Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Main Arena component
const Arena: React.FC = () => {
  const { scene } = useGLTF('/assets/backyard_garden.glb');

  // Scale up the model to match game dimensions (80x80)
  return (
    <group>
      <color attach="background" args={['#2D5A27']} /> {/* Grass green color for background */}
      <fog attach="fog" args={['#2D5A27', 20, 40]} /> {/* Matching fog color */}
      <ambientLight intensity={0.5} />
      
      {/* Load the backyard garden model */}
      <Suspense fallback={null}>
        <primitive 
          object={scene} 
          scale={[25, 25, 25]} // Reduced scale to create a tighter play area
          position={[0, -1, 0]} // Move slightly down to ensure ground level alignment
        />
      </Suspense>
      
      {/* Add invisible walls to constrain blob movement */}
      <group>
        {/* North wall */}
        <mesh position={[0, 2, -35]} visible={false}>
          <boxGeometry args={[70, 4, 1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        {/* South wall */}
        <mesh position={[0, 2, 35]} visible={false}>
          <boxGeometry args={[70, 4, 1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        {/* East wall */}
        <mesh position={[35, 2, 0]} visible={false}>
          <boxGeometry args={[1, 4, 70]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        {/* West wall */}
        <mesh position={[-35, 2, 0]} visible={false}>
          <boxGeometry args={[1, 4, 70]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>
      
      {/* Lighting setup */}
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
        args={["#2D5A27", "#2D5A27", 0.5]} // Updated hemisphere light colors to match
        position={[0, 50, 0]} 
      />
    </group>
  );
};

// Preload the model
useGLTF.preload('/assets/backyard_garden.glb');

export default Arena;