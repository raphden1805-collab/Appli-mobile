import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Asset } from 'expo-asset';
import * as THREE from 'three';

const SKY_TOP = '#3a5a7a';
const SKY_BOTTOM = '#0c141c';

const modelAsset = Asset.fromModule(require('../../assets/models/CesiumMan.glb'));

const TARGET_HEIGHT = 1.75;

function AnimatedModel() {
  const gltf = useLoader(GLTFLoader, modelAsset.uri);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    // Normalise l'echelle et recentre le modele sur l'origine (pieds a y=0),
    // quelle que soit l'unite d'origine du fichier glTF.
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    if (size.y > 0) {
      const scale = TARGET_HEIGHT / size.y;
      gltf.scene.scale.setScalar(scale);
    }
    const centeredBox = new THREE.Box3().setFromObject(gltf.scene);
    gltf.scene.position.x -= (centeredBox.min.x + centeredBox.max.x) / 2;
    gltf.scene.position.z -= (centeredBox.min.z + centeredBox.max.z) / 2;
    gltf.scene.position.y -= centeredBox.min.y;
  }, [gltf]);

  useEffect(() => {
    if (gltf.animations.length === 0) return;
    const mixer = new THREE.AnimationMixer(gltf.scene);
    const action = mixer.clipAction(gltf.animations[0]);
    action.timeScale = 0.5;
    action.play();
    mixerRef.current = mixer;
    return () => {
      mixer.stopAllAction();
    };
  }, [gltf]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
  });

  return <primitive object={gltf.scene} />;
}

function LoadingPlaceholder() {
  return (
    <mesh position={[0, 0.9, 0]}>
      <capsuleGeometry args={[0.25, 1, 4, 8]} />
      <meshStandardMaterial color="#333" />
    </mesh>
  );
}

function GradientSky() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(16, 11, 1, 1);
    const top = new THREE.Color(SKY_TOP);
    const bottom = new THREE.Color(SKY_BOTTOM);
    // ordre des sommets de PlaneGeometry : haut-gauche, haut-droit, bas-gauche, bas-droit
    const colors = new Float32Array([
      top.r, top.g, top.b,
      top.r, top.g, top.b,
      bottom.r, bottom.g, bottom.b,
      bottom.r, bottom.g, bottom.b,
    ]);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} position={[0, 2, -6]}>
      <meshBasicMaterial vertexColors fog={false} />
    </mesh>
  );
}

function DistantHexes() {
  const hexes = useMemo(
    () => [
      { x: -2.4, z: -4, s: 0.9, o: 0.25 },
      { x: 2.1, z: -4.6, s: 1.1, o: 0.2 },
      { x: -0.8, z: -5.2, s: 0.7, o: 0.18 },
      { x: 3.2, z: -3.4, s: 0.6, o: 0.22 },
    ],
    []
  );
  return (
    <>
      {hexes.map((h, i) => (
        <mesh key={i} position={[h.x, h.s * 0.5, h.z]}>
          <cylinderGeometry args={[h.s, h.s, 0.08, 6]} />
          <meshBasicMaterial color="#274863" transparent opacity={h.o} fog={false} />
        </mesh>
      ))}
    </>
  );
}

function Ground() {
  return (
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[2.6, 48]} />
      <meshStandardMaterial color="#12202c" />
    </mesh>
  );
}

export function Character({ color }: { color: string }) {
  return (
    <Canvas
      camera={{ position: [0, 1.3, 3.4], fov: 32 }}
      onCreated={({ camera }) => camera.lookAt(0, 0.95, 0)}
    >
      <fog attach="fog" args={[SKY_BOTTOM, 5, 11]} />
      <GradientSky />
      <DistantHexes />
      <Ground />

      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={1.1} />
      <directionalLight position={[-3, 2, -2]} intensity={0.25} />
      <pointLight position={[0, 1.4, 1.6]} intensity={0.4} color={color} />

      <Suspense fallback={<LoadingPlaceholder />}>
        <AnimatedModel />
      </Suspense>
    </Canvas>
  );
}
