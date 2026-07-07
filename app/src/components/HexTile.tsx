import React from 'react';
import { hexToWorld, HEX_SIZE } from '../hexMath';
import { BUILDING_VISUALS } from '../buildingVisuals';
import type { Tile } from '../types';

const NEUTRAL_COLOR = '#3f6b45';

function tintTowardColor(base: string, target: string, amount: number) {
  const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [br, bg, bb] = parse(base);
  const [tr, tg, tb] = parse(target);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * amount);
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(mix(br, tr))}${toHex(mix(bg, tg))}${toHex(mix(bb, tb))}`;
}

export function HexTile({
  tile,
  ownerColor,
  selectable,
  onSelect,
}: {
  tile: Tile;
  ownerColor: string | null;
  selectable: boolean;
  onSelect: (tile: Tile) => void;
}) {
  const [x, z] = hexToWorld(tile.q, tile.r);
  const tileColor = ownerColor ? tintTowardColor(NEUTRAL_COLOR, ownerColor, 0.55) : NEUTRAL_COLOR;
  const building = tile.buildingId ? BUILDING_VISUALS[tile.buildingId] : null;

  return (
    <group position={[x, 0, z]}>
      <mesh
        position={[0, -0.1, 0]}
        onClick={(e: any) => {
          e.stopPropagation();
          if (selectable) onSelect(tile);
        }}
      >
        <cylinderGeometry args={[HEX_SIZE * 0.96, HEX_SIZE * 0.96, 0.2, 6]} />
        <meshStandardMaterial color={tileColor} />
      </mesh>

      {building && building.shape === 'box' && (
        <mesh position={[0, building.height / 2, 0]}>
          <boxGeometry args={[0.7, building.height, 0.7]} />
          <meshStandardMaterial color={building.color} />
        </mesh>
      )}
      {building && building.shape === 'cylinder' && (
        <mesh position={[0, building.height / 2, 0]}>
          <cylinderGeometry args={[0.4, 0.4, building.height, 8]} />
          <meshStandardMaterial color={building.color} />
        </mesh>
      )}
      {building && building.shape === 'cone' && (
        <mesh position={[0, building.height / 2, 0]}>
          <coneGeometry args={[0.4, building.height, 8]} />
          <meshStandardMaterial color={building.color} />
        </mesh>
      )}
    </group>
  );
}
