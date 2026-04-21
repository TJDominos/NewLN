import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X, Zap, DollarSign, Medal, Clock, CalendarDays } from 'lucide-react';

// Mock Data Generator
const generateMockLeaderboard = (type: 'multiplier' | 'amount', isAllTime: boolean) => {
  const users = Array.from({ length: 50 }).map((_, i) => {
    // Generate descending values
    const baseAmount = isAllTime ? 100000 : 50000;
    const baseMultiplier = isAllTime ? 10000 : 5000;
    
    // Create an exponential decay curve for values so the top looks much higher
    const curve = Math.pow((50 - i) / 50, 3);
    
    let value = 0;
    if (type === 'amount') {
      value = Math.max(500, Math.floor(baseAmount * curve) + Math.floor(Math.random() * 500));
    } else {
      value = Math.max(10, Math.floor(baseMultiplier * curve) + Math.floor(Math.random() * 50));
    }

    const randomSeed = `player_${type}_${isAllTime ? 'all' : '30'}_${i}_${Math.random()}`;

    return {
      id: i + 1,
      name: `Player_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`,
      value
    };
  });
  
  // Sort just in case random skewed it
  return users.sort((a, b) => b.value - a.value).map((u, index) => ({ ...u, rank: index + 1 }));
};

export const RankWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const [activeDimension, setActiveDimension] = useState<'multiplier' | 'amount'>('multiplier');
  const [activeTimeframe, setActiveTimeframe] = useState<'allTime' | '30Days'>('30Days');

  // Generate memoized mock data so it doesn't change on every render
  const leaderboards = useMemo(() => ({
    multiplier_allTime: generateMockLeaderboard('multiplier', true),
    multiplier_30Days: generateMockLeaderboard('multiplier', false),
    amount_allTime: generateMockLeaderboard('amount', true),
    amount_30Days: generateMockLeaderboard('amount', false),
  }), []);

  const currentData = leaderboards[`${activeDimension}_${activeTimeframe}`];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getRankAppearance = (rank: number) => {
    if (rank === 1) return { color: 'text-yellow-400', bg: 'bg-yellow-400/20', border: 'border-yellow-400', icon: true };
    if (rank === 2) return { color: 'text-zinc-300', bg: 'bg-zinc-300/20', border: 'border-zinc-300', icon: true };
    if (rank === 3) return { color: 'text-amber-600', bg: 'bg-amber-600/20', border: 'border-amber-600', icon: true };
    return { color: 'text-zinc-500', bg: 'bg-zinc-800', border: 'border-transparent', icon: false };
  };

  return (
    <>
      {/* Floating Rank Button */}
      <div className="fixed right-0 top-[calc(50%-3.5rem)] -translate-y-1/2 z-40 flex flex-col gap-2">
        <div 
          className="bg-zinc-950 border-y-2 border-l-2 border-yellow-500 rounded-l-2xl p-2 md:p-3 pr-2.5 md:pr-4 shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-transform hover:-translate-x-1 cursor-pointer flex flex-col items-center group"
          onClick={() => setIsOpen(true)}
        >
          <Trophy className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
        </div>
      </div>

      {/* Rank Panel / Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - Only on mobile */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              />
            )}

            {/* Panel */}
            <motion.div
              initial={isMobile ? { y: '100%' } : { x: '100%' }}
              animate={isMobile ? { y: 0 } : { x: 0 }}
              exit={isMobile ? { y: '100%' } : { x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed z-50 bg-[#18181b] flex flex-col overflow-hidden shadow-2xl border-l border-zinc-800
                ${isMobile 
                  ? 'bottom-0 left-0 right-0 h-[85vh] rounded-t-3xl' 
                  : 'top-0 right-0 bottom-0 w-[320px]'
                }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900 shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-zinc-800 rounded-full transition-colors">
                    <X className="w-6 h-6 text-zinc-400" />
                  </button>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Ranks
                  </h2>
                </div>
              </div>

              {/* Sub-Header / Filters */}
              <div className="p-4 bg-zinc-900/50 border-b border-zinc-800 shrink-0 flex flex-col gap-3">
                {/* Dimension Toggle */}
                <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800">
                  <button
                    onClick={() => setActiveDimension('multiplier')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      activeDimension === 'multiplier' ? 'bg-zinc-800 text-yellow-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Zap size={16} /> Top Multipliers
                  </button>
                  <button
                    onClick={() => setActiveDimension('amount')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      activeDimension === 'amount' ? 'bg-zinc-800 text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <DollarSign size={16} /> Highest Wins
                  </button>
                </div>

                {/* Timeframe Toggle */}
                <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800 w-2/3 mx-auto">
                  <button
                    onClick={() => setActiveTimeframe('30Days')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      activeTimeframe === '30Days' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <CalendarDays size={14} /> 30 Days
                  </button>
                  <button
                    onClick={() => setActiveTimeframe('allTime')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      activeTimeframe === 'allTime' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Clock size={14} /> All-Time
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="flex flex-col gap-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${activeDimension}_${activeTimeframe}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-2"
                    >
                      {currentData.map((player) => {
                        const style = getRankAppearance(player.rank);
                        
                        return (
                          <div 
                            key={player.id} 
                            className="flex items-center gap-3 p-2.5 bg-zinc-800/40 hover:bg-zinc-800/80 transition-colors rounded-xl border border-white/5"
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 ${style.bg} ${style.border}`}>
                              {style.icon ? (
                                <Medal size={16} className={style.color} />
                              ) : (
                                <span className={`text-xs font-bold font-mono ${style.color}`}>
                                  {player.rank}
                                </span>
                              )}
                            </div>
                            
                            <img src={player.avatar} alt={player.name} className="w-10 h-10 rounded-full bg-zinc-900 shrink-0" />
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-zinc-200 truncate">{player.name}</p>
                              {player.rank <= 3 && (
                                <p className={`text-[10px] uppercase tracking-wider font-bold ${style.color}`}>
                                  {player.rank === 1 ? '1st Place' : player.rank === 2 ? '2nd Place' : '3rd Place'}
                                </p>
                              )}
                            </div>
                            
                            <div className="text-right shrink-0">
                              {activeDimension === 'multiplier' ? (
                                <div className="text-yellow-400 font-mono font-bold text-base">
                                  {player.value}x
                                </div>
                              ) : (
                                <div className="text-emerald-400 font-mono font-bold text-base">
                                  ${player.value.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Footer text */}
              <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-center shrink-0">
                <p className="text-[10px] text-zinc-500 font-mono">Showing Top 50 Global Players ({activeDimension === 'multiplier' ? 'Multipliers' : 'Wins'})</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
