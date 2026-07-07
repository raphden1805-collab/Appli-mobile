export type BuildingDef = {
  id: string;
  category: 'income' | 'civilian' | 'produce';
  name: string;
  cost: number;
  incomePerMin: number;
};

export type BuildingCatalog = Record<string, BuildingDef>;

export type Tile = {
  q: number;
  r: number;
  ownerId: string | null;
  buildingId: string | null;
};

export type MatchPlayer = {
  id: string;
  name: string;
  color: string;
  gold: number;
  incomePerMin: number;
  connected: boolean;
};

export type MatchPhase = 'countdown' | 'active' | 'finished';

export type MatchState = {
  matchId: string;
  phase: MatchPhase;
  countdownRemainingMs: number;
  timeRemainingMs: number;
  finished: boolean;
  winnerId: string | null;
  players: MatchPlayer[];
  tiles: Tile[];
};
