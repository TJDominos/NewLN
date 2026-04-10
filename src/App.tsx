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
import { mockBackendSpin, SpinReceipt, mockBackendGetConfig, GameConfigResponse, generateSymbol, getRandomSymbol, mockBackendGetRecords } from './mockBackend';
import { CommentsWidget } from './components/CommentsWidget';

export type SymbolData = { id: string, name: IconName };

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
  const [config, setConfig] = useState<GameConfigResponse | null>(null);
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);
  const [progressivePool, setProgressivePool] = useState(500);
  const [grid, setGrid] = useState<SymbolData[][]>(() => {
    const saved = localStorage.getItem('slotGrid');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved grid', e);
      }
    }
    return Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => generateSymbol()));
  });

  useEffect(() => {
    mockBackendGetConfig().then(setConfig).catch(console.error);
  }, []);
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
  const [showAutoMenu, setShowAutoMenu] = useState(false);

  // New Features State
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [heldCols, setHeldCols] = useState<boolean[]>([false, false, false]);
  const [canHold, setCanHold] = useState(false);
  const [cascadeMultiplier, setCascadeMultiplier] = useState(1);
  const [backendError, setBackendError] = useState<string | null>(null);

  const handleSetBet = (newBet: number) => {
    setBet(newBet);
  };

  const balanceRefValue = useRef(balance);
  const betRefValue = useRef(bet);
  const lastRecordIdRef = useRef('0');

  useEffect(() => {
    balanceRefValue.current = balance;
    betRefValue.current = bet;
  }, [balance, bet]);

  useEffect(() => {
    localStorage.setItem('slotSoundEnabled', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('slotGrid', JSON.stringify(grid));
  }, [grid]);

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
    if (!isSpinning && balanceRefValue.current >= betRefValue.current) {
      setAutoSpinsLeft(count - 1);
      spinRef.current();
    } else {
      setAutoSpinsLeft(count);
    }
  };

  const stopAutoSpins = () => {
    setAutoSpinsLeft(0);
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
    const fetchRecords = async () => {
      try {
        const newRecords = await mockBackendGetRecords(lastRecordIdRef.current);
        if (newRecords.length > 0) {
          // Update the lastRecordId to the highest ID received
          const maxId = Math.max(...newRecords.map(r => parseInt(r.id, 10)));
          lastRecordIdRef.current = maxId.toString();
          
          setWinners(prev => {
            // Prepend new records (newest first) and keep only the latest 50
            const combined = [...newRecords.reverse(), ...prev];
            return combined.slice(0, 50);
          });
        }
      } catch (error) {
        console.error("Failed to fetch records:", error);
      }
    };

    // Do not poll while spinning to save performance
    if (isSpinning) return;

    // Fetch immediately on load or right after a spin finishes
    fetchRecords();

    // Poll every 30 seconds while idle
    const interval = setInterval(fetchRecords, 30000);
    return () => clearInterval(interval);
  }, [isSpinning]);

  useEffect(() => {
    const handleFirstInteraction = async () => {
      soundManager.soundEnabled = soundEnabled;
      await soundManager.init();
      await soundManager.resume();
      if (soundEnabled) {
        soundManager.setBgm(true);
      }
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('mousedown', handleFirstInteraction);
    };
    document.addEventListener('touchstart', handleFirstInteraction);
    document.addEventListener('mousedown', handleFirstInteraction);
    return () => {
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('mousedown', handleFirstInteraction);
    };
  }, [soundEnabled]);

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
    
    // Initialize sound manager on first user interaction - don't await it to prevent UI lag
    soundManager.soundEnabled = soundEnabled;
    soundManager.init().catch(e => console.error("Sound init failed", e));
    await soundManager.resume().catch(e => console.error("Sound resume failed", e));
    
    setIsSpinning(true);
    const currentHeldCols = [...heldCols];
    setSpinningCols([!currentHeldCols[0], !currentHeldCols[1], !currentHeldCols[2]]);
    
    if (freeSpinsLeft > 0) {
      setFreeSpinsLeft(prev => prev - 1);
    } else {
      setBalance(prev => prev - bet);
      balanceRef.current -= bet;
      setProgressivePool(prev => prev + bet * 0.09); 
    }
    
    setWinningLines([]);
    setWinAmount(0);
    setCanHold(false);
    setCascadeMultiplier(1);
    setBackendError(null);

    // Start the visual spinning and sound immediately
    if (!currentHeldCols.every(h => h)) {
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
          if (!currentHeldCols[col]) {
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
    let winDetails: { symbol: IconName, count: number, lines: number, multiplier: number }[] = [];

    const playNextStep = () => {
      if (currentStepIndex >= receipt.cascades.length) {
        finalizeSpin(receipt.totalWin, receipt.jackpotWon, receipt.freeSpinsAwarded, winDetails);
        return;
      }

      const step = receipt.cascades[currentStepIndex];
      
      if (step.winningSymbols && step.winningSymbols.length > 0) {
        step.winningSymbols.forEach(info => {
          winDetails.push({
            symbol: info.symbol,
            count: 3,
            lines: info.lines,
            multiplier: step.multiplier
          });
        });
      }
      
      setWinningLines(step.winningLines);
      accumulatedWin += step.stepWin;
      setWinAmount(accumulatedWin);
      setCascadeMultiplier(step.multiplier);

      if (step.winningLines.length > 0) {
        // Wait for win animation
        setTimeout(() => {
          setGrid(step.grid);
          setWinningLines([]);
          setCascadeMultiplier(step.multiplier + 1);
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

  const finalizeSpin = (totalWin: number, wonJackpot: boolean, freeSpinsAwarded: number, winDetails: { symbol: IconName, count: number, lines: number, multiplier: number }[] = []) => {
    let currentWinLevel: 'none' | 'win_1x' | 'win_2x' | 'win_3x' | 'win_4x' | 'win_5x' | 'medium' | 'big' | 'mega' = 'none';

    if (wonJackpot) {
      totalWin += progressivePool;
      setProgressivePool(0); 
      currentWinLevel = 'mega';
      playSound('win_mega', soundEnabled);
    } else if (totalWin > 0) {
      const winRatio = totalWin / bet;
      if (winRatio >= 500) {
        currentWinLevel = 'mega';
        playSound('win_mega', soundEnabled);
      } else if (winRatio >= 100) {
        currentWinLevel = 'big';
        playSound('win_big', soundEnabled);
      } else if (winRatio >= 20) {
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
      time: getFormattedTime(),
      bet,
      win: totalWin,
      playerName: 'John',
      avatarUrl: 'https://i.pravatar.cc/150?u=john',
      winDetails
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
    <div className="h-[100dvh] w-full bg-[#0a0502] text-white font-sans flex flex-col overflow-hidden relative">
      {/* Atmospheric background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at 50% 0%, #3a1510 0%, transparent 60%), radial-gradient(circle at 10% 80%, #ff4e00 0%, transparent 40%), radial-gradient(circle at 90% 80%, #8b5cf6 0%, transparent 40%)',
          filter: 'blur(60px)',
          opacity: 0.6
        }} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMTBoNDBNMTAgMHY0ME0wIDIwaDQwTTIwIDB2NDBNMCAzMGg0ME0zMCAwdjQwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-20" />
      </div>

      <div className="shrink-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/5 relative">
        <Navigation 
          isSpinning={isSpinning} 
          soundEnabled={soundEnabled} 
          onExit={handleExit} 
          onToggleSound={async () => {
            const newState = !soundEnabled;
            setSoundEnabled(newState);
            soundManager.soundEnabled = newState;
            await soundManager.init();
            await soundManager.resume();
            soundManager.setBgm(newState);
          }} 
        />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide overscroll-contain flex flex-col items-center pt-[20px] pb-12 md:pb-1 relative z-10">
        <div className={`w-full max-w-5xl px-1.5 md:px-2 flex flex-col md:flex-row gap-1.5 md:gap-2 lg:gap-4 items-center md:items-stretch md:justify-center min-h-0 ${winLevel === 'mega' ? 'animate-shake-hard' : winLevel === 'big' || winLevel === 'medium' ? 'animate-shake' : ''}`}>
        
        {/* Main Game Area */}
        <div className="w-full max-w-[min(100%,350px,50vh)] md:max-w-[min(100%,450px,60vh)] mx-auto flex flex-col gap-1.5 md:gap-2 lg:gap-3 justify-start min-w-0">
          {backendError && (
            <div className="w-full bg-red-900/80 border border-red-500 text-red-200 px-4 py-0.5 rounded-lg text-[10px] text-center shrink-0">
              {backendError}
            </div>
          )}

          {/* Progressive Jackpot & Free Spins */}
          <div className="w-full flex gap-1.5 h-8 md:h-10 shrink-0">
            <div className="w-[70%] md:w-[75%] bg-gradient-to-b from-yellow-600 to-yellow-900 rounded-xl p-[1px] shadow-[0_0_15px_rgba(234,179,8,0.1)]">
              <div className="bg-zinc-950 rounded-lg p-1 px-2 md:px-3 flex justify-between items-center border border-yellow-500/30 h-full">
                <p className="text-yellow-500 text-[8px] md:text-xs font-semibold uppercase tracking-widest whitespace-nowrap">Jackpot</p>
                <p className="text-sm md:text-lg font-mono font-bold text-yellow-400 whitespace-nowrap ml-1">
                  ${(bet * 1000 + progressivePool).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            
            <AnimatePresence>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`flex-1 bg-gradient-to-b ${cascadeMultiplier > 1 ? 'from-blue-600 to-blue-900 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'from-zinc-800 to-zinc-900'} rounded-xl p-[1px] transition-all duration-300 min-w-0`}
              >
                <div className={`bg-zinc-950 rounded-lg p-1 px-1.5 md:px-2 flex flex-row justify-center items-center gap-1 border ${cascadeMultiplier > 1 ? 'border-blue-500/30' : 'border-zinc-800'} h-full transition-colors duration-300`}>
                  <p className={`${cascadeMultiplier > 1 ? 'text-blue-400' : 'text-zinc-600'} text-[8px] md:text-[10px] font-semibold uppercase tracking-widest transition-colors duration-300 whitespace-nowrap`}>Multi</p>
                  <p className={`text-xs md:text-sm font-mono font-bold ${cascadeMultiplier > 1 ? 'text-blue-300' : 'text-zinc-500'} transition-colors duration-300 whitespace-nowrap`}>
                    {cascadeMultiplier}x
                  </p>
                </div>
              </motion.div>
              {freeSpinsLeft > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex-1 bg-gradient-to-b from-purple-600 to-purple-900 rounded-xl p-[1px] shadow-[0_0_15px_rgba(168,85,247,0.2)] min-w-0"
                >
                  <div className="bg-zinc-950 rounded-lg p-1 px-1.5 md:px-2 flex flex-row justify-center items-center gap-1 border border-purple-500/30 h-full">
                    <p className="text-purple-400 text-[8px] md:text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap">Free</p>
                    <p className="text-xs md:text-sm font-mono font-bold text-purple-300 whitespace-nowrap">
                      {freeSpinsLeft}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* GameBoard */}
          <div ref={reelsRef} className="w-full flex items-center justify-center min-h-0 py-0.5 md:py-0">
            <div className="w-full">
              <GameBoard 
                grid={grid} 
                winningLines={winningLines} 
                spinningCols={spinningCols} 
                winAmount={winAmount} 
                isSpinning={isSpinning} 
                rtp={config?.rtp || '0%'} 
                paytable={config?.paytable || []}
                heldCols={heldCols}
                toggleHold={toggleHold}
                canHold={canHold}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="w-full shrink-0">
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
              spin={spin}
              balanceRef={balanceRef}
              winAmountRef={winAmountRef}
            />
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="w-full max-w-[min(100%,350px,50vh)] md:max-w-[min(100%,450px,60vh)] mx-auto flex flex-col shrink-0 h-[60vh] md:h-auto relative pb-8 md:pb-0">
          <div className="w-full h-full md:absolute md:inset-0 flex flex-col">
            <RecordsBoard 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              records={records}
              winners={winners}
            />
          </div>
        </div>

      </div>
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

      {/* Comments Widget */}
      <CommentsWidget unreadCount={15} />
    </div>
  );
}
