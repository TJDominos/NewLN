import { IconName } from './components/PixelIcon';
import { SymbolData } from './App';
import { PlayboardRecord } from './types';

// Simulate a global database of records on the IC canister
let globalRecordsIdCounter = 0;
const globalRecords: PlayboardRecord[] = [];

const getFormattedTime = () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yy}${mm}${dd} ${hh}:${min}:${ss}`;
};

// Helper to generate mock records in the background
setInterval(() => {
  const mockUsers = [
    { name: 'John', avatar: 'https://i.pravatar.cc/150?u=john', bio: 'Am the Grace and Mercy of THE GOD Of Zion.', location: 'Nigeria', joinDate: 'Joined October 2025' },
    { name: 'Alice', avatar: 'https://i.pravatar.cc/150?u=alice', bio: 'Crypto enthusiast and slot lover.', location: 'USA', joinDate: 'Joined Jan 2026' },
    { name: 'Bob', avatar: 'https://i.pravatar.cc/150?u=bob', bio: 'Just here for fun.', location: 'UK', joinDate: 'Joined Feb 2026' }
  ];
  const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
  const isWin = Math.random() > 0.5;
  
  globalRecordsIdCounter++;
  const newRecord: PlayboardRecord = {
    id: globalRecordsIdCounter.toString(),
    user: user.name,
    avatar: user.avatar,
    isWin,
    winAmount: isWin ? Math.floor(Math.random() * 500) + 10 : 0,
    time: getFormattedTime(),
    bio: user.bio,
    location: user.location,
    joinDate: user.joinDate
  };
  
  globalRecords.push(newRecord);
  if (globalRecords.length > 100) {
    globalRecords.shift();
  }
}, 5000);

export const mockBackendGetRecords = async (lastId: string): Promise<PlayboardRecord[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const lastIdNum = parseInt(lastId || '0', 10);
  return globalRecords.filter(record => parseInt(record.id, 10) > lastIdNum);
};

export interface CommentData {
  id: number;
  user: string;
  avatar: string;
  date?: string;
  content: string;
  replies?: number;
  verified?: boolean;
}

let globalCommentsIdCounter = 7;
const globalComments: CommentData[] = [
  { id: 1, user: 'System', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=System', content: 'Welcome to the platform! 🎮', replies: 0, verified: true },
  { id: 2, user: 'ApeMan99', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ApeMan99', content: 'Whoa, just hit a big milestone! 🚀', replies: 2, verified: false },
  { id: 3, user: 'ProGamer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer', content: 'Can someone tell me how to level up faster?', replies: 1, verified: false },
  { id: 4, user: 'System', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Tip', content: 'Tip: Check out the leaderboard to see top scores! 🏆', replies: 0, verified: true },
  { id: 5, user: 'LuckyStrik3', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky', content: 'Waiting for that epic moment!!!', replies: 0, verified: false },
  { id: 6, user: 'Bob', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', content: 'Good luck everyone 🍀', replies: 0, verified: false },
  { id: 7, user: 'RichGuy', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RichGuy', content: 'Wow, insane combo! 🔥', replies: 5, verified: true }
];

// Simulate other users typing comments in the background
setInterval(() => {
  if (Math.random() < 0.3) {
    globalCommentsIdCounter++;
    const newComment = {
      id: globalCommentsIdCounter,
      user: 'Player_' + Math.floor(Math.random() * 999),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
      content: ['Nice one!', 'Wow, so close', 'Amazing run!', 'I just logged in 👋', 'Good luck! 🍀', 'Lets gooo!'][Math.floor(Math.random() * 6)],
      replies: 0,
      verified: Math.random() > 0.8
    };
    globalComments.push(newComment);
    if (globalComments.length > 200) {
      globalComments.shift();
    }
  }
}, 3000);

// Fetch initial comments or recent comments
export const mockBackendGetRecentComments = async (limit: number = 6): Promise<CommentData[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return globalComments.slice(-limit);
};

// Fetch entirely new comments since an ID
export const mockBackendGetCommentsSince = async (lastId: number): Promise<CommentData[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const lastIndex = globalComments.findIndex(c => c.id === lastId);
  if (lastIndex === -1) {
    if (globalComments.length > 0 && lastId < globalComments[0].id) {
       // if lastId is older than our oldest tracked comment, just return recent ones
       return globalComments.slice(-10);
    }
    return [];
  }
  return globalComments.slice(lastIndex + 1);
};

/**
 * ==========================================
 * BACKEND API CONTRACT
 * ==========================================
 * 
 * This file mocks the backend API that the frontend expects.
 * In a real implementation, the frontend would make HTTP requests to a backend server.
 * 
 * ENDPOINT: POST /api/spin
 * 
 * REQUEST PAYLOAD:
 */
export interface SpinRequest {
  bet: number;                 // The amount bet on this spin
  heldCols: boolean[];         // Array of 3 booleans indicating which columns are held (e.g., [false, true, false])
  previousGrid: SymbolData[][];// The 3x3 grid from the previous spin (required if heldCols has any true values)
}

/**
 * RESPONSE PAYLOAD:
 */
export interface SpinResponse {
  initialGrid: SymbolData[][]; // The 3x3 grid generated for the initial spin (incorporating held columns)
  cascades: CascadeStep[];     // Array of cascade steps (wins, disappearing symbols, new symbols falling)
  totalWin: number;            // Total amount won across all cascades
  freeSpinsAwarded: number;    // Number of free spins awarded (if any)
  jackpotWon: boolean;         // Whether the progressive jackpot was won
}

export interface WinningSymbolInfo {
  symbol: IconName;
  lines: number;
}

export interface CascadeStep {
  grid: SymbolData[][];
  winningLines: number[][];
  stepWin: number;
  multiplier: number;
  winningSymbols: WinningSymbolInfo[];
}

// For backward compatibility with App.tsx
export type SpinReceipt = SpinResponse;

const PAYTABLE: { id: IconName; weight: number; payout: number }[] = [
  { id: 'cherry',     weight: 100,    payout: 1 },
  { id: 'banana',     weight: 74.74,  payout: 2 },
  { id: 'lemon',      weight: 50.87,  payout: 5 },
  { id: 'orange',     weight: 38.02,  payout: 10 },
  { id: 'grape',      weight: 32.07,  payout: 15 },
  { id: 'strawberry', weight: 21.24,  payout: 40 },
  { id: 'apple',      weight: 14.45,  payout: 100 },
  { id: 'watermelon', weight: 9.84,   payout: 250 },
  { id: 'star',       weight: 7.35,   payout: 500 },
  { id: 'five',       weight: 3.76,   payout: 1000 },
  { id: 'wild',       weight: 0.3,    payout: 2000 }
];

const TOTAL_WEIGHT = PAYTABLE.reduce((sum, item) => sum + item.weight, 0);

const LINES = [
  [[0,0], [0,1], [0,2]], 
  [[1,0], [1,1], [1,2]], 
  [[2,0], [2,1], [2,2]], 
  [[0,0], [1,0], [2,0]], 
  [[0,1], [1,1], [2,1]], 
  [[0,2], [1,2], [2,2]], 
  [[0,0], [1,1], [2,2]], 
  [[2,0], [1,1], [0,2]]  
];

export const getRandomSymbol = (): IconName => {
  const rand = Math.random() * TOTAL_WEIGHT;
  let sum = 0;
  for (const item of PAYTABLE) {
    sum += item.weight;
    if (rand <= sum) return item.id;
  }
  return PAYTABLE[0].id;
};

export const generateSymbol = (): SymbolData => ({
  id: Math.random().toString(36).substring(2, 9),
  name: getRandomSymbol()
});

export const calculateRTP = () => {
  const wildWeight = PAYTABLE.find(s => s.id === 'wild')?.weight || 0;
  const pw = wildWeight / TOTAL_WEIGHT;

  let regularBaseRTP = 0;
  let jackpotBaseRTP = 0;
  let totalLineProb = 0;

  PAYTABLE.forEach(symbol => {
    const px = symbol.weight / TOTAL_WEIGHT;
    let probLine = 0;
    
    if (symbol.id === 'wild') {
      probLine = Math.pow(pw, 3);
      jackpotBaseRTP += probLine * symbol.payout * LINES.length;
    } else {
      probLine = Math.pow(px + pw, 3) - Math.pow(pw, 3);
      if (symbol.id === 'five') {
        jackpotBaseRTP += probLine * symbol.payout * LINES.length;
      } else {
        regularBaseRTP += probLine * symbol.payout * LINES.length;
      }
    }
    totalLineProb += probLine;
  });

  // Calculate Hit Frequency (H) - chance of at least one line hitting
  const hitFrequency = 1 - Math.pow(1 - totalLineProb, LINES.length);
  
  // Calculate Cascade Boost (G4)
  // Formula: 1 + (H * 2) + (H^2 * 3) + (H^3 * 5)
  // Note: This is an approximation for the multiplier effect
  const cascadeBoost = 1 + (hitFrequency * 2) + (Math.pow(hitFrequency, 2) * 3) + (Math.pow(hitFrequency, 3) * 5);
  
  // Effective RTP = (Regular_RTP * CascadeBoost) + Jackpot_RTP + 0.09
  const effectiveRTP = (regularBaseRTP * cascadeBoost) + jackpotBaseRTP + 0.09;
  
  return (effectiveRTP * 100).toFixed(2) + '%';
};

export interface GameConfigResponse {
  paytable: { id: IconName; weight: number; payout: number }[];
  rtp: string;
}

export const mockBackendGetConfig = async (): Promise<GameConfigResponse> => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    paytable: PAYTABLE,
    rtp: calculateRTP()
  };
};

/**
 * MOCK BACKEND ENGINE
 * This function simulates the Rust canister logic. It takes the parameters defined in SpinRequest,
 * generates the initial grid, and synchronously calculates all cascades in a single call,
 * returning a SpinResponse.
 */
export const mockBackendSpin = async (
  bet: number, 
  heldCols: boolean[], 
  previousGrid: SymbolData[][]
): Promise<SpinResponse> => {
  
  // --- BACKEND VALIDATION LOGIC ---
  if (!heldCols || heldCols.length !== 3) {
    throw new Error("Invalid hold configuration: must specify exactly 3 columns.");
  }

  const heldCount = heldCols.filter(Boolean).length;
  if (heldCount > 2) {
    throw new Error("Cannot hold all 3 columns. Maximum 2 columns can be held.");
  }

  if (heldCount > 0) {
    if (!previousGrid || previousGrid.length !== 3 || previousGrid[0].length !== 3) {
      throw new Error("Cannot hold columns without a valid previous spin grid.");
    }
    // Note: In a real backend, you would also validate that the `bet` matches the previous spin's bet.
  }
  // --------------------------------

  // Simulate network latency (the ~2s consensus delay for raw_rand)
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 1. Generate Initial Grid
  let currentGrid: SymbolData[][] = Array(3).fill(null).map(() => Array(3).fill(null));
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (heldCols[c] && previousGrid[r] && previousGrid[r][c]) {
        currentGrid[r][c] = { ...previousGrid[r][c] };
      } else {
        currentGrid[r][c] = generateSymbol();
      }
    }
  }

  const initialGrid = currentGrid.map(row => [...row]);
  const cascades: CascadeStep[] = [];
  let totalWin = 0;
  let multiplier = 1;
  let freeSpinsAwarded = 0;
  let jackpotWon = false;

  // 2. Synchronous Cascade Loop
  while (true) {
    let stepWin = 0;
    const winningLines: number[][] = [];
    const stepWinningSymbolsMap = new Map<IconName, number>();
    let hasJackpotInStep = false;
    
    // Evaluate Lines
    LINES.forEach(line => {
      const s1 = currentGrid[line[0][0]][line[0][1]].name;
      const s2 = currentGrid[line[1][0]][line[1][1]].name;
      const s3 = currentGrid[line[2][0]][line[2][1]].name;

      let winningSymbol: IconName | null = null;
      let isWin = true;

      for (const s of [s1, s2, s3]) {
        if (s !== 'wild') {
          if (!winningSymbol) winningSymbol = s;
          else if (winningSymbol !== s) {
            isWin = false;
            break;
          }
        }
      }

      if (isWin) {
        winningSymbol = winningSymbol || 'wild';
        const payoutMultiplier = PAYTABLE.find(s => s.id === winningSymbol)?.payout || 0;
        
        // 5s and Wilds (Jackpots) do NOT use the cascade multiplier
        const isJackpot = winningSymbol === 'five' || winningSymbol === 'wild';
        const currentMultiplier = isJackpot ? 1 : multiplier;
        
        stepWin += bet * payoutMultiplier * currentMultiplier;
        
        if (isJackpot) {
          jackpotWon = true;
          hasJackpotInStep = true;
        }
        
        stepWinningSymbolsMap.set(winningSymbol, (stepWinningSymbolsMap.get(winningSymbol) || 0) + 1);
        
        winningLines.push([
          line[0][0], line[0][1],
          line[1][0], line[1][1],
          line[2][0], line[2][1],
          isJackpot ? 1 : 0 // Add a flag to indicate if this line is a jackpot
        ]);
      }
    });

    if (winningLines.length === 0) {
      break; // No wins, end cascade sequence
    }

    totalWin += stepWin;

    // Apply Gravity and Refill
    const nextGrid = currentGrid.map(row => [...row]);
    const winningPositions = new Set<string>();
    winningLines.forEach(line => {
      const isJackpot = line[6] === 1;
      // 5s and Wilds (Jackpots) do NOT disappear (no cascade for them)
      if (!isJackpot) {
        for (let i = 0; i < 6; i += 2) {
          winningPositions.add(`${line[i]},${line[i+1]}`);
        }
      }
    });

    // If there were only jackpot wins, no symbols will disappear
    if (winningPositions.size > 0) {
      for (let c = 0; c < 3; c++) {
        const remainingSymbols = [];
        for (let r = 0; r < 3; r++) {
          if (!winningPositions.has(`${r},${c}`)) {
            remainingSymbols.push(nextGrid[r][c]);
          }
        }
        const newSymbolsCount = 3 - remainingSymbols.length;
        const newSymbols = Array.from({ length: newSymbolsCount }, () => generateSymbol());
        const finalColumn = [...newSymbols, ...remainingSymbols];
        
        for (let r = 0; r < 3; r++) {
          nextGrid[r][c] = finalColumn[r];
        }
      }
    }

    const stepWinningSymbols: WinningSymbolInfo[] = Array.from(stepWinningSymbolsMap.entries()).map(([symbol, lines]) => ({ symbol, lines }));

    cascades.push({
      grid: nextGrid.map(row => [...row]),
      winningLines: winningLines.map(l => l.slice(0, 6)), // Clean up the flag for the frontend
      stepWin,
      multiplier,
      winningSymbols: stepWinningSymbols
    });

    currentGrid = nextGrid;
    
    // If a jackpot was hit, the cascade stops immediately
    if (hasJackpotInStep) {
      break;
    }

    multiplier++;

    // Safety break
    if (cascades.length > 50) break;
  }

  return {
    initialGrid,
    cascades,
    totalWin,
    freeSpinsAwarded,
    jackpotWon
  };
};
