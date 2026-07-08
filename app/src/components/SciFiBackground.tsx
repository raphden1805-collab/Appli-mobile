import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { hexToWorld } from '../hexMath';

const FOG_COLOR = '#05070a';
const WALL_COLOR = '#1a1f26';
const CRATE_COLOR = '#2a2f36';
const PANEL_SCREEN_COLOR = '#4fd0ff';
const AMBER_LIGHT_COLOR = '#ffab40';
const HEX_TILE_SIZE = 0.62;
const FLOOR_GREYS = ['#171b21', '#1b2027', '#1e232a', '#20262d'];
const CEILING_GREYS = ['#0e1116', '#12161c', '#151a20'];

function hashInt(a: number, b: number) {
  let h = (a * 374761393 + b * 668265263) ^ (a << 13);
  h = (h ^ (h >>> 15)) >>> 0;
  return h;
}

function generateHexPositions(rangeQ: number, rangeR: number, minX: number, maxX: number, minZ: number, maxZ: number) {
  const positions: { q: number; r: number; x: number; z: number }[] = [];
  for (let q = -rangeQ; q <= rangeQ; q += 1) {
    for (let r = -rangeR; r <= rangeR; r += 1) {
      const [x, z] = hexToWorld(q, r, HEX_TILE_SIZE);
      if (x >= minX && x <= maxX && z >= minZ && z <= maxZ) {
        positions.push({ q, r, x, z });
      }
    }
  }
  return positions;
}

function HexFloor() {
  const tiles = useMemo(() => generateHexPositions(16, 14, -9, 9, -11, 8), []);
  return (
    <group position={[0, 0, 0]}>
      {tiles.map((t) => (
        <mesh key={`${t.q}-${t.r}`} position={[t.x, -0.02, t.z]}>
          <cylinderGeometry args={[HEX_TILE_SIZE * 0.94, HEX_TILE_SIZE * 0.94, 0.05, 6]} />
          <meshStandardMaterial color={FLOOR_GREYS[hashInt(t.q, t.r) % FLOOR_GREYS.length]} roughness={0.45} metalness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function HexCeiling() {
  const tiles = useMemo(() => generateHexPositions(16, 14, -9, 9, -11, 8), []);
  return (
    <group position={[0, 4.3, 0]}>
      {tiles.map((t) => (
        <mesh key={`${t.q}-${t.r}`} position={[t.x, 0.02, t.z]}>
          <cylinderGeometry args={[HEX_TILE_SIZE * 0.94, HEX_TILE_SIZE * 0.94, 0.05, 6]} />
          <meshStandardMaterial color={CEILING_GREYS[hashInt(t.q, t.r) % CEILING_GREYS.length]} roughness={0.8} />
        </mesh>
      ))}
      {[-4, -1.3, 1.3, 4].map((x) => (
        <group key={x}>
          {[-7, -4, -1, 2, 5].map((z) => (
            <mesh key={z} position={[x, -0.06, z]}>
              <boxGeometry args={[0.16, 0.04, 1.1]} />
              <meshBasicMaterial color="#bfe4ff" toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

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
      <pointLight position={[0, 3.8, -1]} color="#bfe4ff" intensity={0.5} distance={7} />

      <HexFloor />
      <HexCeiling />

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

      <EffectComposer>
        <Bloom intensity={0.4} luminanceThreshold={0.55} luminanceSmoothing={0.6} mipmapBlur />
        <Vignette eskil={false} offset={0.15} darkness={0.9} />
      </EffectComposer>
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
