import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins } from 'lucide-react';
import { IconName } from './components/PixelIcon';
import { playSound, soundManager, startSpinSound, stopSpinSound } from './utils/sound';
import { Navigation } from './components/Navigation';
import { GameBoard } from './components/GameBoard';
import { Controls } from './components/Controls';
import { RecordsBoard } from './components/RecordsBoard';
import { PlayRecord, PlayboardRecord } from './types';
import { mockBackendSpin, SpinReceipt } from './mockBackend';

export const PAYTABLE: { id: IconName; weight: number; payout: number }[] = [
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

export type SymbolData = { id: string, name: IconName };

const TOTAL_WEIGHT = PAYTABLE.reduce((sum, item) => sum + item.weight, 0);

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
  id: Math.random().toString(36).substr(2, 9),
  name: getRandomSymbol()
});

const LINES = [
  [[0,0], [0,1], [0,2]], 
  [[1,0], [1,1], [1,2]], 
  [[2,0], [2,1], [2,2]], 
  [[0,0], [1,0], [2,0]], 
  [[0,1], [1,1], [2,1]], 
  [[0,2], [1,2], [2,2]], 
  [[0,0], [1,1], [2,2]], 
  [[2,0], [1,1], [0,2]], 
];

export const calculateRTP = () => {
  let totalRTP = 0;
  const wildWeight = PAYTABLE.find(s => s.id === 'wild')?.weight || 0;
  const pw = wildWeight / TOTAL_WEIGHT;

  PAYTABLE.forEach(symbol => {
    if (symbol.id === 'wild') {
      const probLine = Math.pow(pw, 3);
      totalRTP += probLine * symbol.payout * LINES.length;
    } else {
      const px = symbol.weight / TOTAL_WEIGHT;
      const probLine = Math.pow(px + pw, 3) - Math.pow(pw, 3);
      totalRTP += probLine * symbol.payout * LINES.length;
    }
  });
  
  // Add 9% progressive jackpot contribution
  totalRTP += 0.09;
  
  return (totalRTP * 100).toFixed(2) + '%';
};

const formatDate = (date: Date) => {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yy}${mm}${dd} ${hh}:${min}:${ss}`;
};

export default function App() {
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);
  const [progressivePool, setProgressivePool] = useState(500);
  const [grid, setGrid] = useState<SymbolData[][]>(() => Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => generateSymbol())));
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningCols, setSpinningCols] = useState<boolean[]>([false, false, false]);
  const [winningLines, setWinningLines] = useState<number[][]>([]);
  const [winAmount, setWinAmount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('slotSoundEnabled');
    return saved ? saved === 'true' : true;
  });
  const [winLevel, setWinLevel] = useState<'none' | 'win_1x' | 'win_2x' | 'win_3x' | 'win_4x' | 'win_5x' | 'medium' | 'big' | 'mega'>('none');
  const [flyingCoins, setFlyingCoins] = useState<{id: number, startX: number, startY: number, targetX: number, targetY: number}[]>([]);
  
  const [records, setRecords] = useState<PlayRecord[]>([]);
  const [winners, setWinners] = useState<PlayboardRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'records' | 'winners'>('records');

  const [autoSpinsLeft, setAutoSpinsLeft] = useState(0);
  const [autoSpinsSelected, setAutoSpinsSelected] = useState(0);
  const [showAutoMenu, setShowAutoMenu] = useState(false);

  // New Features State
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [heldCols, setHeldCols] = useState<boolean[]>([false, false, false]);
  const [canHold, setCanHold] = useState(false);
  const [cascadeMultiplier, setCascadeMultiplier] = useState(1);
  const [backendError, setBackendError] = useState<string | null>(null);

  const handleSetBet = (newBet: number) => {
    setBet(newBet);
    setHeldCols([false, false, false]);
    setCanHold(false);
  };

  const balanceRefValue = useRef(balance);
  const betRefValue = useRef(bet);

  useEffect(() => {
    balanceRefValue.current = balance;
    betRefValue.current = bet;
  }, [balance, bet]);

  useEffect(() => {
    localStorage.setItem('slotSoundEnabled', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    const handleInteraction = async () => {
      if (soundEnabled && !soundManager.isLoaded && !soundManager.isInitializing) {
        soundManager.soundEnabled = true;
        await soundManager.init();
        soundManager.setBgm(true);
      }
    };

    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [soundEnabled]);

  const selectAutoSpins = (count: number) => {
    setShowAutoMenu(false);
    setAutoSpinsSelected(count);
  };

  const stopAutoSpins = () => {
    setAutoSpinsLeft(0);
    setAutoSpinsSelected(0);
  };

  const spinRef = useRef<() => void>(() => {});
  useEffect(() => {
    spinRef.current = spin;
  });

  useEffect(() => {
    if (!isSpinning && (autoSpinsLeft > 0 || freeSpinsLeft > 0)) {
      const timer = setTimeout(() => {
        if (freeSpinsLeft > 0 || balanceRefValue.current >= betRefValue.current) {
          if (freeSpinsLeft === 0) {
            setAutoSpinsLeft(prev => prev - 1);
          }
          spinRef.current();
        } else {
          setAutoSpinsLeft(0);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isSpinning, autoSpinsLeft, freeSpinsLeft]);

  const balanceRef = useRef<HTMLDivElement>(null);
  const reelsRef = useRef<HTMLDivElement>(null);
  const winAmountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgressivePool(prev => prev + Math.random() * 2);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const mockUsers = [
        { name: 'John', avatar: 'https://i.pravatar.cc/150?u=john', bio: 'Am the Grace and Mercy of THE GOD Of Zion.', location: 'Nigeria', joinDate: 'Joined October 2025' },
        { name: 'Alice', avatar: 'https://i.pravatar.cc/150?u=alice', bio: 'Crypto enthusiast and slot lover.', location: 'USA', joinDate: 'Joined Jan 2026' },
        { name: 'Bob', avatar: 'https://i.pravatar.cc/150?u=bob', bio: 'Just here for fun.', location: 'UK', joinDate: 'Joined Feb 2026' }
      ];
      const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
      const isWin = Math.random() > 0.5;
      
      const newRecord: PlayboardRecord = {
        id: Math.random().toString(),
        user: user.name,
        avatar: user.avatar,
        isWin,
        winAmount: isWin ? Math.floor(Math.random() * 500) + 10 : 0,
        time: isWin ? '2026/03/20' : '39m ago',
        bio: user.bio,
        location: user.location,
        joinDate: user.joinDate
      };
      setWinners(prev => [newRecord, ...prev].slice(0, 15));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleExit = () => {
    if (!isSpinning) {
      setBet(10);
      setWinningLines([]);
      setWinAmount(0);
      alert("Exited game. Unused bets cleared.");
    }
  };

  const spin = async () => {
    if (isSpinning || (balance < bet && freeSpinsLeft === 0)) return;
    
    // Initialize sound manager on first user interaction
    soundManager.soundEnabled = soundEnabled;
    await soundManager.init();
    
    setIsSpinning(true);
    setSpinningCols([!heldCols[0], !heldCols[1], !heldCols[2]]);
    
    if (freeSpinsLeft > 0) {
      setFreeSpinsLeft(prev => prev - 1);
    } else {
      setBalance(prev => prev - bet);
      setProgressivePool(prev => prev + bet * 0.09); 
    }
    
    setWinningLines([]);
    setWinAmount(0);
    setCanHold(false);
    setCascadeMultiplier(1);
    setBackendError(null);

    // Start the visual spinning and sound immediately
    if (!heldCols.every(h => h)) {
      startSpinSound(soundEnabled);
    }
    const intervalTime = 100;
    let elapsed = 0;
    let backendReceipt: SpinReceipt | null = null;
    let backendFinishedTime = 0;

    const spinInterval = setInterval(() => {
      elapsed += intervalTime;
      
      let anySpinning = false;

      setGrid(prevGrid => {
        const newGrid = [...prevGrid.map(row => [...row])];
        for (let col = 0; col < 3; col++) {
          if (!heldCols[col]) {
            if (!backendReceipt || elapsed < backendFinishedTime + 500 + col * 500) {
              anySpinning = true;
              for (let row = 0; row < 3; row++) {
                newGrid[row][col] = { ...newGrid[row][col], name: getRandomSymbol() };
              }
            } else {
              for (let row = 0; row < 3; row++) {
                newGrid[row][col] = backendReceipt.initialGrid[row][col];
              }
            }
          }
        }
        return newGrid;
      });

      if (backendReceipt) {
        let stillSpinning = false;
        const updatedSpinningCols = [false, false, false];
        for (let col = 0; col < 3; col++) {
          if (!heldCols[col]) {
            if (elapsed < backendFinishedTime + 500 + col * 500) {
              updatedSpinningCols[col] = true;
              stillSpinning = true;
            }
          }
        }
        
        setSpinningCols(prev => {
          let changed = false;
          for (let col = 0; col < 3; col++) {
            if (prev[col] !== updatedSpinningCols[col]) changed = true;
          }
          return changed ? updatedSpinningCols : prev;
        });

        if (!stillSpinning) {
          clearInterval(spinInterval);
          stopSpinSound();
          setTimeout(() => {
            if (backendReceipt) playReceipt(backendReceipt);
          }, 500);
        }
      }
    }, intervalTime);

    // Call mock backend concurrently
    try {
      backendReceipt = await mockBackendSpin(bet, heldCols, grid);
    } catch (error: any) {
      console.error("Spin failed", error);
      setBackendError(error.message || "An error occurred during the spin.");
      clearInterval(spinInterval);
      stopSpinSound();
      setIsSpinning(false);
      setSpinningCols([false, false, false]);
      
      // Refund bet if it was a normal spin
      if (freeSpinsLeft === 0) {
        setBalance(prev => prev + bet);
        setProgressivePool(prev => prev - bet * 0.09);
      } else {
        setFreeSpinsLeft(prev => prev + 1);
      }
      return;
    } finally {
      backendFinishedTime = elapsed;
    }
  };

  const playReceipt = (receipt: SpinReceipt) => {
    let currentStepIndex = 0;
    let accumulatedWin = 0;

    const playNextStep = () => {
      if (currentStepIndex >= receipt.cascades.length) {
        finalizeSpin(receipt.totalWin, receipt.jackpotWon, receipt.freeSpinsAwarded);
        return;
      }

      const step = receipt.cascades[currentStepIndex];
      
      setWinningLines(step.winningLines);
      accumulatedWin += step.stepWin;
      setWinAmount(accumulatedWin);
      setCascadeMultiplier(step.multiplier);

      if (step.winningLines.length > 0) {
        // Wait for win animation
        setTimeout(() => {
          setGrid(step.grid);
          setWinningLines([]);
          playSound('spin', soundEnabled);
          
          currentStepIndex++;
          // Wait for grid to fall
          setTimeout(playNextStep, 500);
        }, 1000);
      } else {
        // No win in this step (should only happen if it's the last step and no win, but cascades only record wins usually)
        currentStepIndex++;
        playNextStep();
      }
    };

    playNextStep();
  };

  const finalizeSpin = (totalWin: number, wonJackpot: boolean, freeSpinsAwarded: number) => {
    let currentWinLevel: 'none' | 'win_1x' | 'win_2x' | 'win_3x' | 'win_4x' | 'win_5x' | 'medium' | 'big' | 'mega' = 'none';

    if (wonJackpot) {
      totalWin += progressivePool;
      setProgressivePool(0); 
      currentWinLevel = 'mega';
      playSound('win_mega', soundEnabled);
    } else if (totalWin > 0) {
      const winRatio = totalWin / bet;
      if (winRatio >= 50) {
        currentWinLevel = 'mega';
        playSound('win_mega', soundEnabled);
      } else if (winRatio >= 15) {
        currentWinLevel = 'big';
        playSound('win_big', soundEnabled);
      } else if (winRatio > 5) {
        currentWinLevel = 'medium';
        playSound('win_medium', soundEnabled);
      } else if (winRatio >= 5) {
        currentWinLevel = 'win_5x';
        playSound('win_5x', soundEnabled);
      } else if (winRatio >= 4) {
        currentWinLevel = 'win_4x';
        playSound('win_4x', soundEnabled);
      } else if (winRatio >= 3) {
        currentWinLevel = 'win_3x';
        playSound('win_3x', soundEnabled);
      } else if (winRatio >= 2) {
        currentWinLevel = 'win_2x';
        playSound('win_2x', soundEnabled);
      } else {
        currentWinLevel = 'win_1x';
        playSound('win_1x', soundEnabled);
      }
    }
    
    setWinLevel(currentWinLevel);
    setWinAmount(totalWin);
    setIsSpinning(false);
    
    // Reset holds after spin
    setHeldCols([false, false, false]);
    // Can only hold if we didn't win and we are not in free spins
    setCanHold(totalWin === 0 && freeSpinsLeft === 0);

    if (freeSpinsAwarded > 0) {
      setFreeSpinsLeft(prev => prev + freeSpinsAwarded);
    }

    const record: PlayRecord = {
      id: Math.random().toString(36).substr(2, 9),
      time: 'Just now',
      bet,
      win: totalWin,
      playerName: 'John',
      avatarUrl: 'https://i.pravatar.cc/150?u=john'
    };
    setRecords(prev => [record, ...prev].slice(0, 15));

    if (totalWin > 0) {
      triggerCoinAnimation(totalWin, currentWinLevel);
    } else {
      setCascadeMultiplier(1);
    }
  };

  const triggerCoinAnimation = (amount: number, level: 'none' | 'win_1x' | 'win_2x' | 'win_3x' | 'win_4x' | 'win_5x' | 'medium' | 'big' | 'mega') => {
    const rect = winAmountRef.current?.getBoundingClientRect();
    const targetX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const targetY = rect ? rect.top + rect.height / 2 : window.innerHeight - 50;

    const reelsRect = reelsRef.current?.getBoundingClientRect();
    const baseStartX = reelsRect ? reelsRect.left + reelsRect.width / 2 : window.innerWidth / 2;
    const baseStartY = reelsRect ? reelsRect.top + reelsRect.height / 2 : window.innerHeight / 2 - 50;

    let numCoins = 1;
    let delay = 1000;
    if (level === 'mega') { numCoins = 100; delay = 5000; }
    else if (level === 'big') { numCoins = 60; delay = 4000; }
    else if (level === 'medium') { numCoins = 15; delay = 2000; }
    else if (level === 'win_5x') { numCoins = 5; delay = 2000; }
    else if (level === 'win_4x') { numCoins = 4; delay = 1800; }
    else if (level === 'win_3x') { numCoins = 3; delay = 1600; }
    else if (level === 'win_2x') { numCoins = 2; delay = 1400; }

    const coins = Array.from({ length: numCoins }, (_, i) => ({
      id: Date.now() + i,
      startX: baseStartX + (Math.random() * 40 - 20),
      startY: baseStartY + (Math.random() * 40 - 20),
      targetX,
      targetY,
    }));
    setFlyingCoins(coins);

    setTimeout(() => {
      setFlyingCoins([]);
      setWinLevel('none');
      setBalance(prev => prev + amount);
    }, delay);
  };

  const toggleHold = (colIndex: number) => {
    if (!canHold || isSpinning) return;
    setHeldCols(prev => {
      const isCurrentlyHeld = prev[colIndex];
      if (!isCurrentlyHeld) {
        const heldCount = prev.filter(Boolean).length;
        if (heldCount >= 2) return prev; // Max 2 holds
      }
      const newHolds = [...prev];
      newHolds[colIndex] = !newHolds[colIndex];
      return newHolds;
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900 via-zinc-950 to-black text-white font-sans flex flex-col items-center pb-8 overflow-x-hidden">
      <Navigation 
        isSpinning={isSpinning} 
        soundEnabled={soundEnabled} 
        onExit={handleExit} 
        onToggleSound={async () => {
          const newState = !soundEnabled;
          setSoundEnabled(newState);
          soundManager.soundEnabled = newState;
          await soundManager.init();
          soundManager.setBgm(newState);
        }} 
      />

      <div className={`w-full max-w-sm px-4 mt-4 flex flex-col gap-4 ${winLevel === 'mega' ? 'animate-shake-hard' : winLevel === 'big' || winLevel === 'medium' ? 'animate-shake' : ''}`}>
        
        {backendError && (
          <div className="bg-red-900/80 border border-red-500 text-red-200 px-4 py-2 rounded-lg text-sm text-center">
            {backendError}
          </div>
        )}

        {/* Progressive Jackpot & Free Spins */}
        <div className="w-full flex gap-2">
          <div className="flex-1 bg-gradient-to-b from-yellow-600 to-yellow-900 rounded-xl p-[2px] shadow-[0_0_20px_rgba(234,179,8,0.15)]">
            <div className="bg-zinc-950 rounded-lg p-2 px-4 flex justify-between items-center border border-yellow-500/30 h-full">
              <p className="text-yellow-500 text-[10px] font-semibold uppercase tracking-widest">Jackpot</p>
              <p className="text-xl font-mono font-bold text-yellow-400">
                ${(bet * 1000 + progressivePool).toFixed(2)}
              </p>
            </div>
          </div>
          
          <AnimatePresence>
            {cascadeMultiplier > 1 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-gradient-to-b from-blue-600 to-blue-900 rounded-xl p-[2px] shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              >
                <div className="bg-zinc-950 rounded-lg p-2 px-4 flex flex-col justify-center items-center border border-blue-500/30 h-full min-w-[60px]">
                  <p className="text-blue-400 text-[10px] font-semibold uppercase tracking-widest">Multi</p>
                  <p className="text-xl font-mono font-bold text-blue-300">
                    {cascadeMultiplier}x
                  </p>
                </div>
              </motion.div>
            )}
            {freeSpinsLeft > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-gradient-to-b from-purple-600 to-purple-900 rounded-xl p-[2px] shadow-[0_0_20px_rgba(168,85,247,0.3)]"
              >
                <div className="bg-zinc-950 rounded-lg p-2 px-4 flex flex-col justify-center items-center border border-purple-500/30 h-full min-w-[80px]">
                  <p className="text-purple-400 text-[10px] font-semibold uppercase tracking-widest">Free</p>
                  <p className="text-xl font-mono font-bold text-purple-300">
                    {freeSpinsLeft}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={reelsRef}>
          <GameBoard 
            grid={grid} 
            winningLines={winningLines} 
            spinningCols={spinningCols} 
            winAmount={winAmount} 
            isSpinning={isSpinning} 
            rtp={calculateRTP()} 
            paytable={PAYTABLE}
            heldCols={heldCols}
            toggleHold={toggleHold}
            canHold={canHold}
          />
        </div>

        <Controls 
          balance={balance}
          winAmount={winAmount}
          bet={bet}
          setBet={handleSetBet}
          isSpinning={isSpinning}
          autoSpinsLeft={autoSpinsLeft}
          stopAutoSpins={stopAutoSpins}
          showAutoMenu={showAutoMenu}
          setShowAutoMenu={setShowAutoMenu}
          selectAutoSpins={selectAutoSpins}
          autoSpinsSelected={autoSpinsSelected}
          setAutoSpinsLeft={setAutoSpinsLeft}
          setAutoSpinsSelected={setAutoSpinsSelected}
          spin={spin}
          balanceRef={balanceRef}
          winAmountRef={winAmountRef}
        />

        <RecordsBoard 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          records={records}
          winners={winners}
        />

      </div>

      {/* Win Overlay */}
      <AnimatePresence>
        {(winLevel === 'big' || winLevel === 'mega') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none bg-black/60"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ 
                scale: [1, 1.2, 1],
                y: 0,
                rotate: [0, -5, 5, 0]
              }}
              transition={{ 
                duration: 0.6, 
                repeat: Infinity,
                repeatType: "reverse" 
              }}
              className={`text-6xl md:text-8xl font-black italic tracking-tighter uppercase drop-shadow-[0_0_40px_rgba(255,215,0,0.8)] ${winLevel === 'mega' ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600' : 'text-yellow-400'}`}
            >
              {winLevel === 'mega' ? 'MEGA WIN!' : 'BIG WIN!'}
            </motion.div>
          </motion.div>
        )}
        {['win_2x', 'win_3x', 'win_4x', 'win_5x'].includes(winLevel) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: -20, scale: 1.1 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none"
          >
            <div className="text-4xl font-bold text-green-400 drop-shadow-lg bg-black/50 px-6 py-2 rounded-full border border-green-500/30">
              {winLevel === 'win_5x' ? '5x Payout!' :
               winLevel === 'win_4x' ? '4x Payout!' :
               winLevel === 'win_3x' ? '3x Payout!' : '2x Payout!'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flying Coins Animation */}
      {flyingCoins.map(coin => (
        <motion.div
          key={coin.id}
          initial={{ x: coin.startX, y: coin.startY, scale: 0.5, opacity: 1 }}
          animate={{ 
            x: coin.targetX - 12, 
            y: coin.targetY - 12, 
            scale: 1, 
            opacity: 0 
          }}
          transition={{ 
            duration: winLevel === 'mega' ? 5.0 : winLevel === 'big' ? 4.0 : winLevel === 'medium' || winLevel === 'win_5x' ? 2.0 : winLevel === 'win_4x' ? 1.8 : winLevel === 'win_3x' ? 1.6 : winLevel === 'win_2x' ? 1.4 : 1.0,
            ease: "easeInOut" 
          }}
          className="fixed top-0 left-0 z-50 pointer-events-none text-yellow-400 drop-shadow-lg"
        >
          <Coins size={24} />
        </motion.div>
      ))}
    </div>
  );
}
