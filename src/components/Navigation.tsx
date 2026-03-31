import React from 'react';
import { LogOut, Volume2, VolumeX, Bell } from 'lucide-react';

interface NavigationProps {
  isSpinning: boolean;
  soundEnabled: boolean;
  onExit: () => void;
  onToggleSound: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ isSpinning, soundEnabled, onExit, onToggleSound }) => {
  return (
    <>
      <nav className="w-full bg-zinc-900 border-b border-zinc-800 p-1.5 md:p-3 z-30 flex justify-between items-center shadow-md">
        <button 
          onClick={onExit}
          disabled={isSpinning}
          className="flex items-center justify-center text-zinc-400 hover:text-white transition disabled:opacity-50"
        >
          <LogOut className="rotate-180 w-5 h-5 md:w-6 md:h-6" />
        </button>
        <h1 className="text-base md:text-lg font-bold text-white absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
          Lucky Nickel
        </h1>
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={onToggleSound} className="text-zinc-400 hover:text-white transition">
            {soundEnabled ? <Volume2 className="w-5 h-5 md:w-6 md:h-6" /> : <VolumeX className="w-5 h-5 md:w-6 md:h-6" />}
          </button>
          <button className="text-zinc-400 hover:text-white transition">
            <Bell className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </nav>
    </>
  );
};
