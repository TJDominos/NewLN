import React, { RefObject, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Minus, Plus, RefreshCw } from 'lucide-react';

interface ControlsProps {
  balance: number;
  winAmount: number;
  bet: number;
  setBet: (bet: number) => void;
  isSpinning: boolean;
  autoSpinsLeft: number;
  stopAutoSpins: () => void;
  showAutoMenu: boolean;
  setShowAutoMenu: (show: boolean) => void;
  selectAutoSpins: (count: number) => void;
  spin: () => void;
  balanceRef: RefObject<HTMLDivElement | null>;
  winAmountRef: RefObject<HTMLDivElement | null>;
}

export const Controls: React.FC<ControlsProps> = ({
  balance,
  winAmount,
  bet,
  setBet,
  isSpinning,
  autoSpinsLeft,
  stopAutoSpins,
  showAutoMenu,
  setShowAutoMenu,
  selectAutoSpins,
  spin,
  balanceRef,
  winAmountRef,
}) => {
  const autoMenuRef = useRef<HTMLDivElement>(null);

  const [inputValue, setInputValue] = useState(bet.toString());

  useEffect(() => {
    setInputValue(bet.toString());
  }, [bet]);

  const validBets = [1, 2, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100];

  const handleMinus = () => {
    const nextBet = [...validBets].reverse().find(b => b < bet);
    if (nextBet !== undefined) {
      setBet(nextBet);
    } else {
      setBet(Math.max(1, bet - 1));
    }
  };

  const handlePlus = () => {
    const nextBet = validBets.find(b => b > bet);
    if (nextBet !== undefined) {
      setBet(nextBet);
    } else {
      setBet(Math.min(100, bet + 1));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Prevent leading zeros
    val = val.replace(/^0+/, '');
    
    setInputValue(val);
    
    if (val !== '') {
      const num = parseInt(val, 10);
      if (!isNaN(num) && num >= 1 && num <= 100) {
        setBet(num);
      }
    }
  };

  const handleInputBlur = () => {
    let num = parseInt(inputValue, 10);
    if (isNaN(num) || num < 1) {
      num = 1;
    } else if (num > 100) {
      num = 100;
    }
    setBet(num);
    setInputValue(num.toString());
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autoMenuRef.current && !autoMenuRef.current.contains(event.target as Node)) {
        setShowAutoMenu(false);
      }
    };

    if (showAutoMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAutoMenu, setShowAutoMenu]);

  return (
    <div className="w-full bg-zinc-900 rounded-2xl p-1.5 md:p-2 shadow-xl border border-zinc-800">
      <div className="flex justify-between items-center mb-1 md:mb-1.5 px-1">
        <div className="flex items-center gap-1.5 md:gap-2" ref={balanceRef}>
          <span className="text-zinc-500 text-[9px] md:text-[10px] uppercase tracking-wider font-semibold">Balance</span>
          <span className="text-sm md:text-base font-mono font-bold text-emerald-400 flex items-center gap-1">
            <Coins size={12} className="md:w-3.5 md:h-3.5" /> {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2" ref={winAmountRef}>
          <span className="text-slate-400 text-[10px] md:text-xs uppercase tracking-widest font-bold">Win</span>
          <div className="relative h-5 md:h-6 flex items-center justify-end min-w-[60px] md:min-w-[80px]">
            <AnimatePresence mode="wait">
              {winAmount > 0 ? (
                <motion.span 
                  key="win"
                  initial={{ scale: 0.5, opacity: 0, y: 10 }}
                  animate={{ scale: [1.2, 1], opacity: 1, y: 0 }}
                  exit={{ scale: 0.5, opacity: 0, y: -10 }}
                  className="text-base md:text-lg font-mono font-bold text-yellow-400 [text-shadow:1px_1px_0_#dc2626,-1px_-1px_0_#dc2626,1px_-1px_0_#dc2626,-1px_1px_0_#dc2626,0_0_15px_#dc2626]"
                >
                  +{winAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </motion.span>
              ) : (
                <motion.span 
                  key="zero"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-base md:text-lg font-mono font-bold text-zinc-600"
                >
                  0.00
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="w-[110px] md:w-[130px] shrink-0 h-10 md:h-11 bg-zinc-800 rounded-xl px-1 flex items-center justify-between border border-zinc-700/50">
          <button 
            onClick={handleMinus}
            disabled={isSpinning || bet <= 1 || autoSpinsLeft > 0}
            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-zinc-700 rounded-lg hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-default transition shrink-0"
          >
            <Minus size={14} className="md:w-4 md:h-4" />
          </button>
          <div className="flex items-center justify-center px-0.5 flex-1">
            <input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              disabled={isSpinning || autoSpinsLeft > 0}
              className="w-full bg-transparent text-center text-sm md:text-base font-mono font-bold outline-none text-white disabled:opacity-50 leading-none"
            />
          </div>
          <button 
            onClick={handlePlus}
            disabled={isSpinning || bet >= 100 || bet >= balance || autoSpinsLeft > 0}
            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-zinc-700 rounded-lg hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-default transition shrink-0"
          >
            <Plus size={14} className="md:w-4 md:h-4" />
          </button>
        </div>

        {autoSpinsLeft > 0 ? (
          <div className="flex-1 flex justify-center items-center h-10 md:h-11">
            <button
              onClick={stopAutoSpins}
              className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-red-600 hover:bg-red-500 border-4 border-red-800 shadow-[0_0_15px_rgba(220,38,38,0.5)] flex items-center justify-center text-white font-bold text-lg md:text-lg transition-transform active:scale-95"
            >
              {autoSpinsLeft}
            </button>
          </div>
        ) : (
          <div className="flex-1 flex gap-1.5 md:gap-2 relative h-10 md:h-11" ref={autoMenuRef}>
            <button
              onClick={() => setShowAutoMenu(!showAutoMenu)}
              disabled={isSpinning}
              className="px-3 md:px-4 h-full bg-zinc-800 rounded-xl border border-zinc-700 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-default transition flex items-center justify-center text-zinc-300 font-bold text-[10px] md:text-xs uppercase tracking-wider"
            >
              Auto
            </button>
            
            <AnimatePresence>
              {showAutoMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full mb-2 left-0 w-24 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-2 flex flex-col gap-1">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider text-center mb-1">Auto</div>
                    {[10, 20, 50, 100].map(num => (
                      <button
                        key={num}
                        onClick={() => selectAutoSpins(num)}
                        className="py-1.5 hover:bg-zinc-700 rounded-lg text-sm font-bold text-zinc-300 transition"
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => spin()}
              onTouchStart={(e) => {
                // Prevent double trigger on some devices but allow interaction
                if (!isSpinning && balance >= bet) {
                  // We don't preventDefault here to allow the click to still fire if needed
                  // but we could if we wanted to be strictly touch-first
                }
              }}
              disabled={isSpinning || balance < bet}
              className={`flex-1 h-full rounded-xl font-bold text-sm md:text-base tracking-widest uppercase transition-all
                ${isSpinning || balance < bet 
                  ? 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-default' 
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-zinc-950 hover:from-emerald-400 hover:to-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.2)] hover:shadow-[0_0_25px_rgba(52,211,153,0.4)] active:scale-95 cursor-pointer'
                }
              `}
            >
              {isSpinning ? 'Spinning' : 'Spin'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
