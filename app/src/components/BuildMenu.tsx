import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BuildingCatalog } from '../types';

const CATEGORY_LABELS: Record<string, string> = {
  income: 'INCOME',
  civilian: 'CIVILIAN',
  produce: 'PRODUCE',
};

const CATEGORY_COLORS: Record<string, string> = {
  income: '#4caf50',
  civilian: '#c9975a',
  produce: '#5c8fd6',
};

export function BuildMenu({
  catalog,
  gold,
  selectedBuildingId,
  onSelect,
}: {
  catalog: BuildingCatalog;
  gold: number;
  selectedBuildingId: string | null;
  onSelect: (buildingId: string | null) => void;
}) {
  const categories = ['income', 'civilian', 'produce'] as const;

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>BUILD MENU</Text>
      {categories.map((cat) => (
        <View key={cat}>
          <Text style={[styles.category, { color: CATEGORY_COLORS[cat] }]}>{CATEGORY_LABELS[cat]}</Text>
          <View style={styles.grid}>
            {Object.values(catalog)
              .filter((b) => b.category === cat)
              .map((b) => {
                const selected = selectedBuildingId === b.id;
                const affordable = gold >= b.cost;
                return (
                  <Pressable
                    key={b.id}
                    style={[styles.item, selected && styles.itemSelected, !affordable && styles.itemDisabled]}
                    onPress={() => onSelect(selected ? null : b.id)}
                  >
                    <Text style={styles.itemName} numberOfLines={1}>
                      {b.name}
                    </Text>
                    <Text style={styles.itemCost}>{b.cost}</Text>
                  </Pressable>
                );
              })}
          </View>
        </View>
      ))}
      {selectedBuildingId && <Text style={styles.hint}>Touche une case libre pour construire</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { width: 168, backgroundColor: '#161616', borderRadius: 12, padding: 10, gap: 6 },
  title: { color: '#fff', fontWeight: '800', fontSize: 13, marginBottom: 4 },
  category: { fontWeight: '700', fontSize: 11, marginTop: 6, marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  item: {
    width: 76,
    backgroundColor: '#242424',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  itemSelected: { borderColor: '#42a5f5', backgroundColor: '#1c2f42' },
  itemDisabled: { opacity: 0.4 },
  itemName: { color: '#eee', fontSize: 11, fontWeight: '600' },
  itemCost: { color: '#ffd54f', fontSize: 11, marginTop: 2 },
  hint: { color: '#888', fontSize: 10, marginTop: 6 },
});
