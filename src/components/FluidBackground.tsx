import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ShaderMaterial, Vector2 } from 'three';
import * as THREE from 'three';

const FluidShader = () => {
  const materialRef = useRef<ShaderMaterial>(null);
  const mouseRef = useRef(new Vector2(0, 0));
  const timeRef = useRef(0);

  // Track mouse movement
  useMemo(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      timeRef.current += 0.005;
      materialRef.current.uniforms.uTime.value = timeRef.current;
      materialRef.current.uniforms.uMouse.value = mouseRef.current;
    }
  });

  const shaderArgs = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new Vector2(0, 0) },
        uResolution: { value: new Vector2(window.innerWidth, window.innerHeight) },
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
        uniform vec2 uMouse;
        uniform vec2 uResolution;
        varying vec2 vUv;

        // Simplex noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v - i + dot(i, C.xx);
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m; m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x = a0.x * x0.x + h.x * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
          vec2 uv = vUv;
          vec2 mouseInfluence = uMouse * 0.2;
          
          // Multiple layers of noise for organic movement
          float noise1 = snoise(uv * 2.0 + uTime * 0.3 + mouseInfluence);
          float noise2 = snoise(uv * 3.0 - uTime * 0.2 + mouseInfluence * 0.5);
          float noise3 = snoise(uv * 4.0 + uTime * 0.15);
          
          float combinedNoise = (noise1 + noise2 * 0.5 + noise3 * 0.25) / 1.75;
          
          // Cinematic gradient colors: purple -> blue -> teal -> pink
          vec3 color1 = vec3(0.55, 0.27, 0.85); // Purple
          vec3 color2 = vec3(0.27, 0.45, 0.85); // Blue
          vec3 color3 = vec3(0.27, 0.85, 0.75); // Teal
          vec3 color4 = vec3(0.85, 0.27, 0.65); // Pink
          
          // Mix colors based on noise and position
          vec3 color = mix(color1, color2, smoothstep(-0.5, 0.5, combinedNoise + uv.x));
          color = mix(color, color3, smoothstep(-0.3, 0.7, noise2 + uv.y));
          color = mix(color, color4, smoothstep(0.2, 0.8, noise3));
          
          // Add subtle glow effect near mouse
          float mouseDist = length(uv - (uMouse * 0.5 + 0.5));
          float mouseGlow = smoothstep(0.8, 0.0, mouseDist);
          color += mouseGlow * vec3(0.3, 0.2, 0.4);
          
          // Darken for better UI readability
          color *= 0.35;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    }),
    []
  );

  return (
    <mesh scale={[window.innerWidth / 100, window.innerHeight / 100, 1]}>
      <planeGeometry args={[1, 1, 32, 32]} />
      <shaderMaterial ref={materialRef} {...shaderArgs} />
    </mesh>
  );
};

export const FluidBackground = () => {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ antialias: false, alpha: false }}
        dpr={[1, 1.5]} // Limit DPR for performance
      >
        <FluidShader />
      </Canvas>
    </div>
  );
};
