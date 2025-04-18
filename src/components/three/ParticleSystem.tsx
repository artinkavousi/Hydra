import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { glassParameters } from '../audio/store';

const vertexShader = `
  attribute vec3 offset;
  attribute float size;
  attribute vec3 color;
  attribute float speed;
  
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uAudioLow;
  uniform float uAudioHigh;
  uniform float uBassImpact;
  
  varying vec3 vColor;
  
  void main() {
    vColor = color;
    
    // Position
    vec3 pos = offset;
    
    // Audio-reactive swirl motion
    float t = uTime * speed * (1.0 + uAudioLevel * 0.5);
    float radius = length(pos.xy);
    float angle = atan(pos.y, pos.x) + t * 0.1 + sin(t * 0.2) * uAudioLow * 2.0;
    
    // Bass impact pushes particles outward
    radius += uBassImpact * 0.5 * sin(t * 3.0 + radius * 4.0);
    
    // Reconstruct position with audio-reactive motion
    pos.x = cos(angle) * radius;
    pos.y = sin(angle) * radius;
    
    // Oscillate on Z based on high frequencies
    pos.z += sin(t * 2.0 + radius * 5.0) * 0.1 * (1.0 + uAudioHigh * 2.0);
    
    // Scale with audio
    float dynamicSize = size * (1.0 + uAudioLevel * 0.8 + uBassImpact * 0.5);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = dynamicSize * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  
  void main() {
    // Calculate distance from center of point
    vec2 coord = gl_PointCoord - vec2(0.5);
    float distance = length(coord);
    
    // Soft particle edge
    float alpha = 1.0 - smoothstep(0.4, 0.5, distance);
    
    // Apply color with alpha
    gl_FragColor = vec4(vColor, alpha);
    
    // Discard transparent pixels
    if (alpha < 0.01) discard;
  }
`;

export const ParticleSystem: React.FC = () => {
  const mesh = useRef<THREE.Points>(null);
  
  // Get parameters from global settings
  const count = glassParameters.particleCount;
  const size = glassParameters.particleSize;
  const volume = glassParameters.particleVolume;
  const color = glassParameters.particleColor;
  const colorVariation = glassParameters.particleColorVariation;
  
  const baseColor = useMemo(() => new THREE.Color(color), [color]);
  
  // Setup instanced particles
  const { positions, sizes, colors, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Position within a sphere
      const radius = Math.random() * volume;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Size with variation
      sizes[i] = size * (0.5 + Math.random());
      
      // Color with variation
      const particleColor = baseColor.clone();
      particleColor.r += (Math.random() - 0.5) * colorVariation;
      particleColor.g += (Math.random() - 0.5) * colorVariation;
      particleColor.b += (Math.random() - 0.5) * colorVariation;
      
      colors[i * 3] = particleColor.r;
      colors[i * 3 + 1] = particleColor.g;
      colors[i * 3 + 2] = particleColor.b;
      
      // Individual movement speed
      speeds[i] = 0.5 + Math.random();
    }
    
    return { positions, sizes, colors, speeds };
  }, [count, size, volume, baseColor, colorVariation]);
  
  // Update particles on each frame
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    
    // Update shader uniforms with audio data
    const material = mesh.current.material as THREE.ShaderMaterial;
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uAudioLevel.value = glassParameters.audioLevel || 0;
    material.uniforms.uAudioLow.value = glassParameters.audioLow || 0;
    material.uniforms.uAudioHigh.value = glassParameters.audioHigh || 0;
    material.uniforms.uBassImpact.value = glassParameters.audioBassImpact || 0;
  });
  
  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={new Float32Array(count * 3)}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-offset"
          array={positions}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          array={sizes}
          count={count}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-color"
          array={colors}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-speed"
          array={speeds}
          count={count}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uAudioLevel: { value: 0 },
          uAudioLow: { value: 0 },
          uAudioHigh: { value: 0 },
          uBassImpact: { value: 0 }
        }}
      />
    </points>
  );
}; 