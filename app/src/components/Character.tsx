import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';

function Figure({ color }: { color: string }) {
  const bodyRef = useRef<Group>(null);
  const headRef = useRef<Mesh>(null);
  const armLRef = useRef<Group>(null);
  const armRRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(t * 1.6) * 0.02;
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.5) * 0.2;
    }
    if (armLRef.current) {
      armLRef.current.rotation.x = Math.sin(t * 1.6) * 0.08 - 0.05;
    }
    if (armRRef.current) {
      armRRef.current.rotation.x = -Math.sin(t * 1.6) * 0.08 - 0.05;
    }
  });

  const skin = '#e0a877';

  return (
    <group>
      {/* socle */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.04, 32]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      <group ref={bodyRef}>
        {/* jambes */}
        <mesh position={[-0.16, 0.5, 0]}>
          <capsuleGeometry args={[0.12, 0.7, 4, 8]} />
          <meshStandardMaterial color="#2b2f3a" />
        </mesh>
        <mesh position={[0.16, 0.5, 0]}>
          <capsuleGeometry args={[0.12, 0.7, 4, 8]} />
          <meshStandardMaterial color="#2b2f3a" />
        </mesh>

        {/* torse */}
        <mesh position={[0, 1.25, 0]}>
          <capsuleGeometry args={[0.22, 0.55, 4, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>

        {/* bras */}
        <group ref={armLRef} position={[-0.3, 1.42, 0]}>
          <mesh position={[0, -0.32, 0]}>
            <capsuleGeometry args={[0.08, 0.55, 4, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
        <group ref={armRRef} position={[0.3, 1.42, 0]}>
          <mesh position={[0, -0.32, 0]}>
            <capsuleGeometry args={[0.08, 0.55, 4, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>

        {/* tete */}
        <mesh ref={headRef} position={[0, 1.85, 0]}>
          <sphereGeometry args={[0.22, 24, 24]} />
          <meshStandardMaterial color={skin} />
        </mesh>
      </group>
    </group>
  );
}

export function Character({ color }: { color: string }) {
  return (
    <Canvas
      camera={{ position: [0, 1.3, 4.2], fov: 32 }}
      onCreated={({ camera }) => camera.lookAt(0, 1.0, 0)}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 4]} intensity={1.1} />
      <directionalLight position={[-3, 2, -2]} intensity={0.3} />
      <Figure color={color} />
    </Canvas>
  );
}
