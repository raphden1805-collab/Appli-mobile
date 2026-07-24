// Conversion coordonnees axiales (q, r) -> position monde (pointy-top), miroir de server/src/hexGrid.js

export const HEX_SIZE = 1;

export function hexToWorld(q: number, r: number, size: number = HEX_SIZE): [number, number] {
  const x = size * Math.sqrt(3) * (q + r / 2);
  const z = size * 1.5 * r;
  return [x, z];
}
