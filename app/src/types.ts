export type FighterState = {
  id: string;
  name: string;
  x: number;
  health: number;
  facing: 1 | -1;
  isBlocking: boolean;
  lastAction: 'punch' | 'kick' | null;
  ko: boolean;
};

export type FightState = {
  roomId: string;
  fighters: FighterState[];
  timeRemainingMs: number;
  finished: boolean;
  winnerId: string | null;
};

export type ActionType = 'move_left' | 'move_right' | 'move_stop' | 'punch' | 'kick' | 'block_start' | 'block_stop';
