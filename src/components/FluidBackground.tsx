import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

const FluidShader = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    // Noise functions
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    void main() {
      vec2 uv = vUv;
      
      // Create flowing noise patterns
      float noise1 = snoise(uv * 2.0 + vec2(uTime * 0.15, uTime * 0.1));
      float noise2 = snoise(uv * 3.0 - vec2(uTime * 0.1, uTime * 0.15));
      float noise3 = snoise(uv * 1.5 + vec2(sin(uTime * 0.1), cos(uTime * 0.1)));
      
      // Combine noises for fluid effect
      float combinedNoise = (noise1 + noise2 * 0.5 + noise3 * 0.3) / 1.8;
      
      // Create color gradient
      vec3 color1 = vec3(0.44, 0.24, 0.86); // Purple
      vec3 color2 = vec3(0.25, 0.55, 0.85); // Blue
      vec3 color3 = vec3(0.25, 0.75, 0.70); // Teal
      
      // Mix colors based on noise and position
      vec3 finalColor = mix(color1, color2, smoothstep(-0.5, 0.5, combinedNoise));
      finalColor = mix(finalColor, color3, smoothstep(0.3, 0.8, uv.x + combinedNoise * 0.3));
      
      // Add brightness variation
      float brightness = 0.6 + combinedNoise * 0.4;
      finalColor *= brightness;
      
      gl_FragColor = vec4(finalColor, 0.95);
    }
  `;

  const uniforms = useRef({
    uTime: { value: 0 },
  });

  useFrame((state) => {
    if (meshRef.current) {
      uniforms.current.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={meshRef} scale={[10, 6, 1]} position={[0, 0, -5]}>
        <planeGeometry args={[2, 2, 32, 32]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms.current}
          transparent
        />
      </mesh>
    </Float>
  );
};

export const FluidBackground = () => {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <FluidShader />
      </Canvas>
    </div>
  );
};
