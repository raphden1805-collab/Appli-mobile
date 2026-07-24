import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { HexTile } from './HexTile';
import type { Tile } from '../types';

export function HexIsland({
  tiles,
  colorByOwner,
  selectable,
  onSelectTile,
  islandRadius,
}: {
  tiles: Tile[];
  colorByOwner: Record<string, string>;
  selectable: boolean;
  onSelectTile: (tile: Tile) => void;
  islandRadius: number;
}) {
  const cameraDistance = islandRadius * 3.2;
  const cameraPosition = useMemo<[number, number, number]>(
    () => [cameraDistance * 0.7, cameraDistance * 1.15, cameraDistance * 0.7],
    [cameraDistance]
  );

  return (
    <Canvas camera={{ position: cameraPosition, fov: 45 }} onCreated={({ camera }) => camera.lookAt(0, 0, 0)}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 20, 10]} intensity={1} />
      {tiles.map((tile) => (
        <HexTile
          key={`${tile.q},${tile.r}`}
          tile={tile}
          ownerColor={tile.ownerId ? colorByOwner[tile.ownerId] ?? null : null}
          selectable={selectable}
          onSelect={onSelectTile}
        />
      ))}
    </Canvas>
  );
}
