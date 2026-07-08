import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

const FOG_COLOR = '#05070a';
const FLOOR_COLOR = '#12161b';
const WALL_COLOR = '#1a1f26';
const CRATE_COLOR = '#2a2f36';
const PANEL_SCREEN_COLOR = '#4fd0ff';
const AMBER_LIGHT_COLOR = '#ffab40';

function ControlPanel({ x }: { x: number }) {
  return (
    <group position={[x, 2.1, -9.6]}>
      <mesh>
        <boxGeometry args={[1.1, 1.1, 0.35]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.15, 0.19]}>
        <planeGeometry args={[0.8, 0.5]} />
        <meshBasicMaterial color={PANEL_SCREEN_COLOR} toneMapped={false} fog={false} />
      </mesh>
      <pointLight position={[0, 0.15, 0.6]} color={PANEL_SCREEN_COLOR} intensity={0.6} distance={3} />
    </group>
  );
}

function CrateStack({ x, z, count }: { x: number; z: number; count: number }) {
  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[(i % 2) * 0.08, 0.4 + i * 0.82, (i % 2) * 0.05]} rotation={[0, i * 0.15, 0]}>
          <boxGeometry args={[0.75, 0.78, 0.75]} />
          <meshStandardMaterial color={CRATE_COLOR} roughness={0.9} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

function Railing({ x, length }: { x: number; length: number }) {
  return (
    <group position={[x, 0, -2]}>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.06, 0.06, length]} />
        <meshStandardMaterial color="#e0a940" roughness={0.5} metalness={0.6} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[0, 0.45, -length / 2 + (i * length) / 4]}>
          <boxGeometry args={[0.05, 0.9, 0.05]} />
          <meshStandardMaterial color="#3a3f46" roughness={0.6} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function SideWall({ x }: { x: number }) {
  return (
    <mesh position={[x, 3, -3]} rotation={[0, x > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
      <planeGeometry args={[18, 8]} />
      <meshStandardMaterial color={WALL_COLOR} roughness={0.85} />
    </mesh>
  );
}

function Scene() {
  const panelXs = useMemo(() => [-2.4, -1.2, 0, 1.2, 2.4], []);

  return (
    <>
      <fog attach="fog" args={[FOG_COLOR, 5, 18]} />
      <color attach="background" args={[FOG_COLOR]} />

      <ambientLight intensity={0.4} color="#9fc0ff" />
      <directionalLight position={[0, 6, 6]} intensity={0.55} color="#dbe8ff" />
      <pointLight position={[-2.4, 0.3, 1.2]} color={AMBER_LIGHT_COLOR} intensity={1.6} distance={6} />
      <pointLight position={[2.4, 0.3, 1.2]} color={AMBER_LIGHT_COLOR} intensity={1.6} distance={6} />
      <pointLight position={[0, 0.3, 4.5]} color={AMBER_LIGHT_COLOR} intensity={1} distance={6} />

      {/* Sol */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -3]}>
        <planeGeometry args={[18, 20]} />
        <meshStandardMaterial color={FLOOR_COLOR} roughness={0.55} metalness={0.25} />
      </mesh>

      {/* Murs lateraux */}
      <SideWall x={-9} />
      <SideWall x={9} />

      {/* Mur du fond avec panneaux de controle lumineux */}
      <mesh position={[0, 3, -10]}>
        <planeGeometry args={[18, 8]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.8} />
      </mesh>
      {panelXs.map((x) => (
        <ControlPanel key={x} x={x} />
      ))}

      {/* Caisses empilees de part et d'autre, plus proches de la camera */}
      <CrateStack x={-3.4} z={0.8} count={3} />
      <CrateStack x={-2.7} z={2} count={2} />
      <CrateStack x={3.4} z={0.8} count={3} />
      <CrateStack x={2.7} z={2} count={2} />

      {/* Garde-corps stylises */}
      <Railing x={-2.6} length={5} />
      <Railing x={2.6} length={5} />
    </>
  );
}

export function SciFiBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Canvas
        frameloop="demand"
        camera={{ position: [0, 1.8, 7.5], fov: 62 }}
        onCreated={({ camera, gl }) => {
          camera.lookAt(0, 1.2, -3);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
        }}
      >
        <Scene />
      </Canvas>
    </View>
  );
}
