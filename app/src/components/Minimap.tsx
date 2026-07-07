import React from 'react';
import { StyleSheet, View } from 'react-native';
import { hexToWorld } from '../hexMath';
import type { Tile } from '../types';

const SIZE = 140;

export function Minimap({
  tiles,
  colorByOwner,
  islandRadius,
}: {
  tiles: Tile[];
  colorByOwner: Record<string, string>;
  islandRadius: number;
}) {
  const worldExtent = islandRadius * 1.8;

  return (
    <View style={styles.box}>
      {tiles
        .filter((t) => t.ownerId)
        .map((tile) => {
          const [x, z] = hexToWorld(tile.q, tile.r);
          const left = ((x + worldExtent) / (worldExtent * 2)) * SIZE;
          const top = ((z + worldExtent) / (worldExtent * 2)) * SIZE;
          const isTownHall = tile.buildingId === 'town_hall';
          return (
            <View
              key={`${tile.q},${tile.r}`}
              style={[
                styles.dot,
                {
                  left,
                  top,
                  backgroundColor: colorByOwner[tile.ownerId as string] ?? '#888',
                  width: isTownHall ? 8 : 5,
                  height: isTownHall ? 8 : 5,
                  borderRadius: isTownHall ? 4 : 2.5,
                },
              ]}
            />
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: SIZE,
    height: SIZE,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
  },
  dot: { position: 'absolute' },
});
