import React, { RefObject, useEffect, useRef } from 'react';
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
  autoSpinsSelected: number;
  setAutoSpinsLeft: (count: number) => void;
  setAutoSpinsSelected: (count: number) => void;
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
  autoSpinsSelected,
  setAutoSpinsLeft,
  setAutoSpinsSelected,
  spin,
  balanceRef,
  winAmountRef,
}) => {
  const autoMenuRef = useRef<HTMLDivElement>(null);

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
    <div className="w-full bg-zinc-900 rounded-2xl p-4 shadow-xl border border-zinc-800">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2" ref={balanceRef}>
          <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold">Balance</span>
          <span className="text-lg font-mono font-bold text-emerald-400 flex items-center gap-1">
            <Coins size={14} /> {balance.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-2" ref={winAmountRef}>
          <span className="text-slate-400 text-sm uppercase tracking-widest font-bold">Win</span>
          <div className="relative h-8 flex items-center justify-end min-w-[80px]">
            <AnimatePresence mode="wait">
              {winAmount > 0 ? (
                <motion.span 
                  key="win"
                  initial={{ scale: 0.5, opacity: 0, y: 10 }}
                  animate={{ scale: [1.2, 1], opacity: 1, y: 0 }}
                  exit={{ scale: 0.5, opacity: 0, y: -10 }}
                  className="text-2xl font-mono font-bold text-yellow-400 [text-shadow:1px_1px_0_#dc2626,-1px_-1px_0_#dc2626,1px_-1px_0_#dc2626,-1px_1px_0_#dc2626,0_0_15px_#dc2626]"
                >
                  +{winAmount.toFixed(2)}
                </motion.span>
              ) : (
                <motion.span 
                  key="zero"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xl font-mono font-bold text-zinc-600"
                >
                  0.00
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 bg-zinc-800 rounded-xl p-1.5 flex items-center justify-between border border-zinc-700/50">
          <button 
            onClick={() => setBet(Math.max(10, bet - 10))}
            disabled={isSpinning || bet <= 10 || autoSpinsLeft > 0}
            className="p-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 disabled:opacity-50 transition"
          >
            <Minus size={16} />
          </button>
          <div className="flex flex-col items-center px-1">
            <span className="text-zinc-500 text-[9px] uppercase tracking-wider font-bold">Bet</span>
            <span className="text-base font-mono font-bold">{bet}</span>
          </div>
          <button 
            onClick={() => setBet(bet + 10)}
            disabled={isSpinning || bet >= balance || autoSpinsLeft > 0}
            className="p-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 disabled:opacity-50 transition"
          >
            <Plus size={16} />
          </button>
        </div>

        {autoSpinsLeft > 0 ? (
          <div className="flex-1 flex justify-center items-center">
            <button
              onClick={stopAutoSpins}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 border-4 border-red-800 shadow-[0_0_15px_rgba(220,38,38,0.5)] flex items-center justify-center text-white font-bold text-xl transition-transform active:scale-95"
            >
              {autoSpinsLeft}
            </button>
          </div>
        ) : (
          <div className="flex-1 flex gap-2 relative" ref={autoMenuRef}>
            <button
              onClick={() => setShowAutoMenu(!showAutoMenu)}
              disabled={isSpinning}
              className="px-3 bg-zinc-800 rounded-xl border border-zinc-700 hover:bg-zinc-700 disabled:opacity-50 transition flex items-center justify-center text-zinc-300"
            >
              <RefreshCw size={18} />
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
              onClick={() => {
                if (autoSpinsSelected > 0) {
                  setAutoSpinsLeft(autoSpinsSelected);
                  setAutoSpinsSelected(0);
                  if (!isSpinning) {
                    spin();
                    setAutoSpinsLeft(autoSpinsSelected - 1);
                  }
                } else {
                  spin();
                }
              }}
              disabled={isSpinning || balance < bet}
              className={`flex-1 py-3 rounded-xl font-bold text-sm tracking-widest uppercase transition-all
                ${isSpinning || balance < bet 
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700' 
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-zinc-950 hover:from-emerald-400 hover:to-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.2)] hover:shadow-[0_0_25px_rgba(52,211,153,0.4)] active:scale-95'
                }
              `}
            >
              {isSpinning ? 'Spinning' : autoSpinsSelected > 0 ? 'Auto Spin' : 'Spin'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
