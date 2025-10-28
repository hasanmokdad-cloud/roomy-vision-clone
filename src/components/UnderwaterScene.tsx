import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const Particles = () => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particleCount = 1000;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      
      // Gentle wave motion
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3 + 1] += Math.sin(state.clock.elapsedTime + positions[i3]) * 0.001;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#5eead4"
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

const Caustics = () => {
  const meshRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>>(null);

  useFrame((state) => {
    if (meshRef.current && meshRef.current.material) {
      const time = state.clock.elapsedTime;
      meshRef.current.material.uniforms.uTime.value = time;
    }
  });

  const causticsShader = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      void main() {
        vec2 uv = vUv * 3.0;
        float n1 = noise(uv + uTime * 0.1);
        float n2 = noise(uv * 2.0 - uTime * 0.15);
        float caustic = n1 * n2;
        
        vec3 color = vec3(0.36, 0.91, 0.83) * caustic;
        gl_FragColor = vec4(color, caustic * 0.3);
      }
    `,
  }), []);

  return (
    <mesh ref={meshRef} position={[0, 0, -10]}>
      <planeGeometry args={[100, 100]} />
      <shaderMaterial
        transparent
        {...causticsShader}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

export const UnderwaterScene = () => {
  return (
    <div className="fixed inset-0 -z-10 opacity-40">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ antialias: false, alpha: true }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#0a0f1e']} />
        <fog attach="fog" args={['#0a0f1e', 10, 50]} />
        
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#5eead4" />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#a78bfa" />
        
        <Particles />
        <Caustics />
      </Canvas>
    </div>
  );
};
