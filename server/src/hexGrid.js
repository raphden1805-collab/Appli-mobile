// Grille hexagonale en coordonnees axiales (q, r).
// Reference: https://www.redblobgames.com/grids/hexagons/

function hexKey(q, r) {
  return `${q},${r}`;
}

function hexDistance(a, b) {
  const aq = a.q;
  const ar = a.r;
  const bq = b.q;
  const br = b.r;
  return (Math.abs(aq - bq) + Math.abs(aq + ar - bq - br) + Math.abs(ar - br)) / 2;
}

// Genere une ile hexagonale (toutes les tuiles a distance <= radius du centre).
function generateIsland(radius) {
  const tiles = [];
  for (let q = -radius; q <= radius; q += 1) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r += 1) {
      tiles.push({ q, r });
    }
  }
  return tiles;
}

const NEIGHBOR_DIRS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

function neighbors(hex) {
  return NEIGHBOR_DIRS.map((d) => ({ q: hex.q + d.q, r: hex.r + d.r }));
}

// Repartit les positions de depart des joueurs sur un anneau de l'ile.
function startingPositions(radius, maxPlayers) {
  const ringRadius = Math.max(1, radius - 1);
  const positions = [];
  for (let i = 0; i < maxPlayers; i += 1) {
    const angle = (i / maxPlayers) * Math.PI * 2;
    const x = ringRadius * Math.cos(angle);
    const z = ringRadius * Math.sin(angle);
    // conversion axiale approximative (axial "pointy-top") puis arrondi cube
    const q = (Math.sqrt(3) / 3) * x - (1 / 3) * z;
    const r = (2 / 3) * z;
    positions.push(cubeRound(q, r));
  }
  return positions;
}

function cubeRound(q, r) {
  let x = q;
  let z = r;
  let y = -x - z;

  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);

  const xDiff = Math.abs(rx - x);
  const yDiff = Math.abs(ry - y);
  const zDiff = Math.abs(rz - z);

  if (xDiff > yDiff && xDiff > zDiff) {
    rx = -ry - rz;
  } else if (yDiff > zDiff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  return { q: rx, r: rz };
}

module.exports = { hexKey, hexDistance, generateIsland, neighbors, startingPositions };
