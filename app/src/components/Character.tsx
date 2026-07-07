import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Asset } from 'expo-asset';
import * as THREE from 'three';
import type { Group } from 'three';

const modelAsset = Asset.fromModule(require('../../assets/models/CesiumMan.glb'));

const TARGET_HEIGHT = 1.75;
const TURN_SPEED = 0.12;

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
    action.timeScale = 0.45;
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

function Pedestal({ color }: { color: string }) {
  // Socle + halo lumineux (anneaux concentriques degressifs, sans texture canvas
  // pour rester compatible React Native).
  const rings = [
    { r: 1.15, o: 0.05 },
    { r: 0.85, o: 0.09 },
    { r: 0.55, o: 0.14 },
  ];
  return (
    <group position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {rings.map((ring, i) => (
        <mesh key={i} position={[0, 0, i * 0.001]}>
          <circleGeometry args={[ring.r, 48]} />
          <meshBasicMaterial color={color} transparent opacity={ring.o} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.004]}>
        <ringGeometry args={[1.15, 1.2, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function Stage({ color }: { color: string }) {
  const turntable = useRef<Group>(null);
  useFrame((_, delta) => {
    if (turntable.current) turntable.current.rotation.y += delta * TURN_SPEED;
  });

  return (
    <>
      <Pedestal color={color} />
      <group ref={turntable}>
        <Suspense fallback={<LoadingPlaceholder />}>
          <AnimatedModel />
        </Suspense>
      </group>
    </>
  );
}

export function Character({ color }: { color: string }) {
  return (
    <Canvas
      gl={{ alpha: true }}
      camera={{ position: [0, 1.3, 3.4], fov: 32 }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(0, 0.95, 0);
        gl.setClearColor(0x000000, 0);
      }}
    >
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} />
      <directionalLight position={[-3, 2, -2]} intensity={0.3} />
      <pointLight position={[0, 1.4, 1.6]} intensity={0.5} color={color} />

      <Stage color={color} />
    </Canvas>
  );
}
