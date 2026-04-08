import { IconName } from './components/PixelIcon';

export interface WinDetail {
  symbol: IconName;
  count: number;
  lines: number;
  multiplier: number;
}

export interface PlayRecord {
  id: string;
  time: string;
  bet: number;
  win: number;
  playerName?: string;
  avatarUrl?: string;
  winDetails?: WinDetail[];
}

export interface PlayboardRecord {
  id: string;
  user: string;
  avatar: string;
  isWin: boolean;
  // NOTE: winAmount represents the gross win amount, not the net amount (win - bet)
  winAmount?: number;
  time: string;
  bio: string;
  location: string;
  joinDate: string;
}

export type { IconName };
