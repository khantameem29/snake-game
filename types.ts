
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type Coordinates = {
  x: number;
  y: number;
};

export enum GameState {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}
