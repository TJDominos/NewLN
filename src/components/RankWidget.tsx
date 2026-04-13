import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X } from 'lucide-react';

export const RankWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

      {/* Rank Panel / Modal (Placeholder) */}
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
                  : 'top-0 right-0 bottom-0 w-[400px]'
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
                    Leaderboard
                  </h2>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-center">
                <Trophy className="w-16 h-16 text-zinc-800 mb-4" />
                <h3 className="text-xl font-bold text-zinc-400 mb-2">Rank Page Coming Soon</h3>
                <p className="text-sm text-zinc-600 max-w-[250px]">
                  The global leaderboard and ranking system will be integrated here across all games.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
