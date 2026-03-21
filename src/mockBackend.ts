import { IconName } from './components/PixelIcon';
import { SymbolData } from './App';

export interface CascadeStep {
  grid: SymbolData[][];
  winningLines: number[][];
  stepWin: number;
  multiplier: number;
}

export interface SpinReceipt {
  initialGrid: SymbolData[][];
  cascades: CascadeStep[];
  totalWin: number;
  freeSpinsAwarded: number;
  jackpotWon: boolean;
}

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

const getRandomSymbol = (): IconName => {
  const rand = Math.random() * TOTAL_WEIGHT;
  let sum = 0;
  for (const item of PAYTABLE) {
    sum += item.weight;
    if (rand <= sum) return item.id;
  }
  return PAYTABLE[0].id;
};

const generateSymbol = (): SymbolData => ({
  id: Math.random().toString(36).substring(2, 9),
  name: getRandomSymbol()
});

/**
 * MOCK BACKEND ENGINE
 * This function simulates the Rust canister logic. It takes the bet and held columns,
 * generates the initial grid, and synchronously calculates all cascades in a single call.
 */
export const mockBackendSpin = async (
  bet: number, 
  heldCols: boolean[], 
  previousGrid: SymbolData[][]
): Promise<SpinReceipt> => {
  
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
        stepWin += bet * payoutMultiplier * multiplier;
        
        if (winningSymbol === 'five') jackpotWon = true;
        
        winningLines.push([
          line[0][0], line[0][1],
          line[1][0], line[1][1],
          line[2][0], line[2][1]
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
      for (let i = 0; i < line.length; i += 2) {
        winningPositions.add(`${line[i]},${line[i+1]}`);
      }
    });

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

    cascades.push({
      grid: nextGrid.map(row => [...row]),
      winningLines,
      stepWin,
      multiplier
    });

    currentGrid = nextGrid;
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
