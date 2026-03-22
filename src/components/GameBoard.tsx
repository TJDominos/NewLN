import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { PixelIcon, IconName } from './PixelIcon';
import { SymbolData } from '../App';

interface GameBoardProps {
  grid: SymbolData[][];
  winningLines: number[][];
  spinningCols: boolean[];
  winAmount: number;
  isSpinning: boolean;
  rtp: string;
  paytable: { id: IconName; weight: number; payout: number }[];
  heldCols: boolean[];
  toggleHold: (colIndex: number) => void;
  canHold: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  grid,
  winningLines,
  spinningCols,
  winAmount,
  isSpinning,
  rtp,
  paytable,
  heldCols,
  toggleHold,
  canHold,
}) => {
  const [showRtpInfo, setShowRtpInfo] = useState(false);
  const [shakeCol, setShakeCol] = useState<number | null>(null);
  const rtpRef = useRef<HTMLDivElement>(null);
  const totalWeight = paytable.reduce((sum, item) => sum + item.weight, 0);

  const handleHoldClick = (colIndex: number) => {
    if (!canHold || isSpinning) {
      setShakeCol(colIndex);
      setTimeout(() => setShakeCol(null), 400);
      return;
    }
    toggleHold(colIndex);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rtpRef.current && !rtpRef.current.contains(event.target as Node)) {
        setShowRtpInfo(false);
      }
    };

    if (showRtpInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRtpInfo]);

  return (
    <div className="relative w-full bg-zinc-900 p-2 rounded-3xl shadow-[0_0_40px_rgba(234,179,8,0.15)] border-2 border-yellow-600/30">
      <div className="absolute -top-3 right-4 z-30" ref={rtpRef}>
        <button 
          onClick={() => setShowRtpInfo(!showRtpInfo)}
          className="bg-zinc-950 border border-yellow-600/50 px-3 py-1 rounded-full text-xs text-yellow-500 font-mono shadow-md flex items-center gap-1 hover:bg-zinc-900 transition-colors"
        >
          RTP: {rtp} <ChevronDown size={12} className={`transition-transform duration-200 ${showRtpInfo ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showRtpInfo && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full right-0 sm:-right-4 mt-2 w-[280px] sm:w-[320px] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-40"
            >
              <div className="p-3 bg-zinc-900/50 border-b border-zinc-800">
                <p className="text-[10px] text-zinc-400 leading-relaxed text-center">
                  Base RTP <span className="text-yellow-500 font-mono">(Excludes Cascades)</span>
                </p>
              </div>
              <div className="p-2">
                <table className="w-full table-fixed text-[10px] sm:text-xs text-center">
                  <thead>
                    <tr className="text-zinc-500 border-b border-zinc-800">
                      <th className="pb-2 font-medium w-1/4">Sym</th>
                      <th className="pb-2 font-medium w-1/4">Spin Odds</th>
                      <th className="pb-2 font-medium w-1/4">Payout</th>
                      <th className="pb-2 font-medium w-1/4">RTP %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paytable.map((item) => {
                      const wildWeight = paytable.find(s => s.id === 'wild')?.weight || 0;
                      const pw = wildWeight / totalWeight;
                      let probSpin = 0;
                      let rtpContrib = 0;

                      if (item.id === 'wild') {
                        const probLine = Math.pow(pw, 3);
                        probSpin = probLine * 8;
                        rtpContrib = probLine * item.payout * 8 * 100;
                      } else {
                        const px = item.weight / totalWeight;
                        const probLine = Math.pow(px + pw, 3) - Math.pow(pw, 3);
                        probSpin = probLine * 8;
                        rtpContrib = probLine * item.payout * 8 * 100;
                      }

                      const oddsValue = probSpin > 0 ? 1 / probSpin : Infinity;
                      
                      let oddsStr = '';
                      if (oddsValue === Infinity) {
                        oddsStr = 'N/A';
                      } else if (oddsValue >= 1000000) {
                        oddsStr = `1 in ${(oddsValue / 1000000).toFixed(1)}M`;
                      } else if (oddsValue >= 1000) {
                        oddsStr = `1 in ${(oddsValue / 1000).toFixed(1)}k`;
                      } else {
                        oddsStr = `1 in ${oddsValue.toLocaleString('en-US', { maximumFractionDigits: 1 })}`;
                      }

                      return (
                        <tr key={item.id} className="border-b border-zinc-800/50 last:border-0">
                          <td className="py-2 flex justify-center items-center">
                            <PixelIcon name={item.id} size={16} />
                          </td>
                          <td className="py-2 font-mono text-emerald-400">{oddsStr}</td>
                          <td className="py-2 font-mono text-yellow-500">{`${item.payout}x`}</td>
                          <td className="py-2 font-mono text-blue-400">{rtpContrib.toFixed(2)}%</td>
                        </tr>
                      );
                    })}
                    <tr className="border-b border-zinc-800/50 last:border-0">
                      <td className="py-2 flex justify-center items-center">
                        <span className="text-yellow-500 font-bold text-[10px]">PROG</span>
                      </td>
                      <td className="py-2 font-mono text-emerald-400">Every Spin</td>
                      <td className="py-2 font-mono text-yellow-500">Pool</td>
                      <td className="py-2 font-mono text-blue-400">9.00%</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="text-zinc-300 font-bold border-t border-zinc-700">
                      <td className="py-2 text-right pr-4" colSpan={3}>Total Base RTP</td>
                      <td className="py-2 font-mono text-blue-400">
                        {rtp}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <div className="mt-4 pt-3 border-t border-zinc-800 text-[10px] sm:text-xs text-zinc-400 text-left space-y-2 px-2 pb-2">
                  <p><strong className="text-purple-400">Wild (W):</strong> Substitutes for all symbols.</p>
                  <p><strong className="text-yellow-500">Cascades & Multiplier:</strong> Winning symbols disappear, and new ones drop in. Each consecutive cascade increases your win multiplier by 1x!</p>
                  <p><strong className="text-emerald-400">Hold Column:</strong> After a spin, you can choose to "Hold" 1 or 2 columns, locking them in place for the next spin to improve your chances of winning.</p>
                  <p><strong className="text-red-400">Jackpot:</strong> 3 '5' or 3 'WILD' symbols on any line awards their fixed prize + the entire Progressive Jackpot!</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="relative grid grid-cols-3 gap-x-1 gap-y-0 bg-zinc-950 p-1 rounded-2xl shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] mt-2 overflow-hidden border border-zinc-800">
        {/* Subtle inner shadow for depth, without dimming the top/bottom rows */}
        <div className="absolute inset-0 pointer-events-none z-20 rounded-2xl shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]" />
        
        {[0, 1, 2].map(colIndex => (
          <div key={`col-${colIndex}`} className="flex flex-col gap-y-0 relative">
            <AnimatePresence mode="popLayout">
              {[0, 1, 2].map(rowIndex => {
                const symbol = grid[rowIndex][colIndex];
                const isWinningCell = winningLines.some(line => {
                  for(let i=0; i<line.length; i+=2) {
                    if (line[i] === rowIndex && line[i+1] === colIndex) return true;
                  }
                  return false;
                });
                
                return (
                  <motion.div 
                    key={symbol.id}
                    layout
                    initial={{ y: -100, opacity: 0, scale: 0.5 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ scale: 0, opacity: 0, rotate: 180 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className={`aspect-square flex items-center justify-center bg-zinc-900 relative overflow-hidden
                      ${isWinningCell ? 'ring-2 ring-yellow-400 z-10 bg-zinc-800 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : ''}
                    `}
                  >
                    <div className={`transition-all duration-75 flex items-center justify-center w-full h-full ${spinningCols[colIndex] ? 'animate-reel' : 'blur-0 scale-100 opacity-100 translate-y-0'}`}>
                      <PixelIcon name={symbol.name} size={96} className="drop-shadow-lg w-full h-full p-2" />
                    </div>
                    {isWinningCell && (
                      <motion.div 
                        className="absolute inset-0 bg-yellow-400/20"
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Hold Buttons */}
      <div className="grid grid-cols-3 gap-x-1 mt-2 px-1">
        {[0, 1, 2].map(colIndex => (
          <button
            key={`hold-${colIndex}`}
            onClick={() => handleHoldClick(colIndex)}
            className={`
              py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold uppercase tracking-widest transition-all
              ${heldCols[colIndex] 
                ? 'bg-yellow-500 text-zinc-900 shadow-[0_0_10px_rgba(234,179,8,0.5)] border border-yellow-400' 
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}
              ${(!canHold || isSpinning) && !heldCols[colIndex] 
                ? 'opacity-50' 
                : 'hover:bg-zinc-700 hover:text-zinc-300'}
              ${shakeCol === colIndex ? 'animate-shake bg-red-900/50 text-red-400 border-red-500/50 !opacity-100' : ''}
            `}
          >
            {heldCols[colIndex] ? 'Held' : 'Hold'}
          </button>
        ))}
      </div>
    </div>
  );
};
