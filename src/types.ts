import { IconName } from './components/PixelIcon';

export interface PlayRecord {
  id: string;
  time: string;
  bet: number;
  win: number;
}

export interface WinnerRecord {
  id: string;
  user: string;
  win: number;
  time: string;
}

export type { IconName };
