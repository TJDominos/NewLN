import { IconName } from './components/PixelIcon';

export interface PlayRecord {
  id: string;
  time: string;
  bet: number;
  win: number;
  playerName?: string;
  avatarUrl?: string;
}

export interface PlayboardRecord {
  id: string;
  user: string;
  avatar: string;
  isWin: boolean;
  winAmount?: number;
  time: string;
  bio: string;
  location: string;
  joinDate: string;
}

export type { IconName };
