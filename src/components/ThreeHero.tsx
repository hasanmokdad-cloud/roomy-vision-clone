import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

const FloatingRoom = ({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[1, 1, 1]} />
        <MeshDistortMaterial
          color="#a78bfa"
          attach="material"
          distort={0.3}
          speed={2}
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
};

const ConnectionLine = () => {
  const lineRef = useRef<THREE.Line>(null);

  useFrame((state) => {
    if (lineRef.current) {
      lineRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  const points = [];
  for (let i = 0; i < 50; i++) {
    points.push(new THREE.Vector3(
      Math.sin(i * 0.2) * 3,
      Math.cos(i * 0.2) * 2,
      (i - 25) * 0.1
    ));
  }

  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: '#5eead4', linewidth: 2, opacity: 0.6, transparent: true }))} />
  );
};

export const ThreeHero = () => {
  return (
    <div className="absolute inset-0 opacity-30 md:opacity-40">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#5eead4" />
        
        <FloatingRoom position={[-2, 1, 0]} />
        <FloatingRoom position={[2, -1, -1]} />
        <FloatingRoom position={[0, 0, 1]} />
        
        <ConnectionLine />
      </Canvas>
    </div>
  );
};
