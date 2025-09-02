
import { Coordinates } from './types';

export const BOARD_SIZE = 20;
export const INITIAL_SPEED = 200; // ms per tick
export const MIN_SPEED = 50;
export const SPEED_INCREMENT = 5;

export const INITIAL_SNAKE: Coordinates[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

export const INITIAL_FOOD: Coordinates = { x: 15, y: 10 };

export const DIRECTION_MAP: { [key: string]: { x: number; y: number } } = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};
