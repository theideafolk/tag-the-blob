import React, { useMemo } from 'react';
import * as THREE from 'three';

interface TreeProps {
  position: [number, number, number];
  scale: number;
}

const Tree: React.FC<TreeProps> = ({ position, scale }) => {
  return (
    <group position={position}>
      {/* Tree trunk */}
      <mesh castShadow position={[0, scale * 1, 0]}>
        <cylinderGeometry args={[scale * 0.2, scale * 0.3, scale * 2, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      {/* Tree top */}
      <mesh castShadow position={[0, scale * 2.5, 0]}>
        <coneGeometry args={[scale * 1.2, scale * 2.5, 8]} />
        <meshStandardMaterial color="#355E3B" roughness={0.6} />
      </mesh>
    </group>
  );
};

interface TreeData {
  position: [number, number, number];
  scale: number;
}

const Trees: React.FC = () => {
  // Generate random positions for trees around the arena
  const trees = useMemo(() => {
    const treeData: TreeData[] = [];
    const count = 20; // Number of trees
    
    for (let i = 0; i < count; i++) {
      // Generate random angle
      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.5 - 0.25);
      // Generate random distance from center (between 50 and 60 units)
      const distance = 50 + Math.random() * 10;
      
      // Calculate position
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      
      // Random scale between 1.5 and 2.5
      const scale = 1.5 + Math.random();
      
      treeData.push({
        position: [x, 0, z],
        scale: scale
      });
    }
    return treeData;
  }, []);

  return (
    <group>
      {trees.map((tree, index) => (
        <Tree 
          key={`tree-${index}`} 
          position={tree.position}
          scale={tree.scale}
        />
      ))}
    </group>
  );
};

export default Trees; 