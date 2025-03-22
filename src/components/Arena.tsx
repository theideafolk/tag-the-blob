/**
 * Arena component that creates an infinite playground for the game
 * Uses Three.js primitives to generate a grid-based infinite arena
 */
import React from 'react';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';

// Main Arena component with infinite ground
const Arena: React.FC = () => {
  return (
    <group>
      {/* Infinite grid for better visual reference */}
      <Grid
        position={[0, 0, 0]}
        cellSize={4}
        cellThickness={0.6}
        cellColor="#444444"
        sectionSize={20}
        sectionThickness={1.5}
        sectionColor="#222222"
        fadeDistance={80}
        infiniteGrid
        fadeStrength={1.5}
      />
      
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial 
          color="#303030" 
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      
      {/* Add boundary markers every 10 units */}
      {[-40, -30, -20, -10, 0, 10, 20, 30, 40].map((x) => 
        [-40, -30, -20, -10, 0, 10, 20, 30, 40].map((z) => (
          <mesh key={`marker-${x}-${z}`} position={[x, 0.1, z]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial 
              color={x === 0 && z === 0 ? "#FF5555" : "#555555"}
              emissive={x === 0 && z === 0 ? "#FF0000" : "#333333"}
              emissiveIntensity={0.5}
            />
          </mesh>
        ))
      )}
      
      {/* Add boundary indicators at the edges */}
      {[
        [-40, 0, 0], [40, 0, 0], [0, 0, -40], [0, 0, 40]
      ].map(([x, y, z], index) => (
        <group key={`boundary-${index}`} position={[x, y, z]}>
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[1, 2, 1]} />
            <meshStandardMaterial 
              color="#6666AA" 
              emissive="#4444AA"
              emissiveIntensity={0.5}
            />
          </mesh>
          <pointLight
            position={[0, 3, 0]}
            intensity={0.5}
            distance={10}
            color="#8888FF"
          />
        </group>
      ))}
      
      {/* Add subtle fog to enhance the infinite feeling */}
      <fog attach="fog" args={["#202020", 50, 100]} />
      
      {/* Add ambient environment elements */}
      <ambientLight intensity={0.2} />
      
      {/* Hemisphere light for better color grading */}
      <hemisphereLight 
        args={["#7799FF", "#332211", 0.5]} 
        position={[0, 50, 0]} 
      />
    </group>
  );
};

export default Arena;