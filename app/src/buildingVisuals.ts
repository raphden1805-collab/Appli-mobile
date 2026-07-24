export type BuildingVisual = { shape: 'box' | 'cone' | 'cylinder'; color: string; height: number };

export const BUILDING_VISUALS: Record<string, BuildingVisual> = {
  town_hall: { shape: 'cylinder', color: '#f5f5f5', height: 0.9 },
  gold_mine: { shape: 'cone', color: '#ffd54f', height: 0.6 },
  bank: { shape: 'box', color: '#ab47bc', height: 0.7 },
  house: { shape: 'box', color: '#d7a86e', height: 0.4 },
  market: { shape: 'box', color: '#ff8a65', height: 0.5 },
  farm: { shape: 'box', color: '#9ccc65', height: 0.3 },
  factory: { shape: 'box', color: '#90a4ae', height: 0.8 },
};
