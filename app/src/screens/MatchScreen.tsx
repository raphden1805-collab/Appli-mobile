import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HexIsland } from '../components/HexIsland';
import { Minimap } from '../components/Minimap';
import { PlayerBar } from '../components/PlayerBar';
import { BuildMenu } from '../components/BuildMenu';
import type { BuildingCatalog, MatchState, Tile } from '../types';

function formatClock(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MatchScreen({
  state,
  myId,
  catalog,
  islandRadius,
  rejectionMessage,
  onPlaceBuilding,
}: {
  state: MatchState;
  myId: string;
  catalog: BuildingCatalog;
  islandRadius: number;
  rejectionMessage: string | null;
  onPlaceBuilding: (tile: Tile, buildingId: string) => void;
}) {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const me = state.players.find((p) => p.id === myId);
  const colorByOwner = Object.fromEntries(state.players.map((p) => [p.id, p.color]));

  const handleSelectTile = (tile: Tile) => {
    if (!selectedBuildingId || tile.buildingId) return;
    onPlaceBuilding(tile, selectedBuildingId);
    setSelectedBuildingId(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.hud}>
        <Text style={styles.hudText}>{state.players.length}/10</Text>
        <Text style={styles.hudText}>{formatClock(state.timeRemainingMs)}</Text>
        <View style={styles.goldBlock}>
          <Text style={styles.goldText}>{me ? Math.floor(me.gold) : 0}</Text>
          <Text style={styles.incomeText}>+{me?.incomePerMin ?? 0}/min</Text>
        </View>
      </View>

      <PlayerBar players={state.players} myId={myId} />

      <View style={styles.mainRow}>
        <View style={styles.arenaWrapper}>
          <HexIsland
            tiles={state.tiles}
            colorByOwner={colorByOwner}
            selectable={state.phase === 'active'}
            onSelectTile={handleSelectTile}
            islandRadius={islandRadius}
          />

          <View style={styles.minimapOverlay}>
            <Minimap tiles={state.tiles} colorByOwner={colorByOwner} islandRadius={islandRadius} />
          </View>

          {state.phase === 'countdown' && (
            <View style={styles.countdownOverlay}>
              <Text style={styles.countdownLabel}>STARTING IN</Text>
              <Text style={styles.countdownValue}>{Math.ceil(state.countdownRemainingMs / 1000)}</Text>
            </View>
          )}

          {rejectionMessage && (
            <View style={styles.rejectionToast}>
              <Text style={styles.rejectionText}>{rejectionMessage}</Text>
            </View>
          )}
        </View>

        <BuildMenu catalog={catalog} gold={me?.gold ?? 0} selectedBuildingId={selectedBuildingId} onSelect={setSelectedBuildingId} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  hud: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  hudText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  goldBlock: { alignItems: 'flex-end' },
  goldText: { color: '#ffd54f', fontWeight: '800', fontSize: 18 },
  incomeText: { color: '#8bc34a', fontSize: 11 },
  mainRow: { flex: 1, flexDirection: 'row', padding: 16, gap: 12 },
  arenaWrapper: { flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: '#0b1a26' },
  minimapOverlay: { position: 'absolute', top: 12, left: 12 },
  countdownOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  countdownLabel: { color: '#ccc', fontWeight: '700', letterSpacing: 1 },
  countdownValue: { color: '#fff', fontSize: 40, fontWeight: '800' },
  rejectionToast: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: '#c62828',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  rejectionText: { color: '#fff', fontWeight: '600', fontSize: 12 },
});
