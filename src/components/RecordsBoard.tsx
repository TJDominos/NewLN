import React from 'react';
import { History, Users } from 'lucide-react';
import { PlayRecord, PlayboardRecord } from '../types';
import { PixelIcon } from './PixelIcon';

interface RecordsBoardProps {
  activeTab: 'records' | 'winners';
  setActiveTab: (tab: 'records' | 'winners') => void;
  records: PlayRecord[];
  winners: PlayboardRecord[];
}

export const RecordsBoard: React.FC<RecordsBoardProps> = ({
  activeTab,
  setActiveTab,
  records,
  winners,
}) => {
  return (
    <div className="w-full bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-xl flex flex-col h-full">
      <div className="flex border-b border-zinc-800 shrink-0">
        <button 
          onClick={() => setActiveTab('records')}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'records' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <History size={16} /> My Records
        </button>
        <button 
          onClick={() => setActiveTab('winners')}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'winners' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Users size={16} /> Play Board
        </button>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar scrollbar-hide overscroll-contain min-h-0">
        {activeTab === 'records' ? (
          records.length > 0 ? (
            <div className="space-y-2">
              {records.map(record => (
                <div key={record.id} className="flex flex-col p-3 bg-zinc-800/50 rounded-xl text-sm gap-2 will-change-transform">
                  <div className="grid grid-cols-[120px_1fr_80px] items-center gap-2">
                    <span className="text-zinc-400 font-mono text-xs text-left whitespace-nowrap">{record.time}</span>
                    <span className="text-zinc-300 text-center">Bet: {record.bet}</span>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold leading-none mb-0.5">Net</span>
                      <span className={`font-bold font-mono text-right leading-none ${record.win - record.bet > 0 ? 'text-emerald-400' : record.win - record.bet < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                        {record.win - record.bet > 0 ? `+${record.win - record.bet}` : record.win - record.bet}
                      </span>
                    </div>
                  </div>
                  {record.winDetails && record.winDetails.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-500">Win:</span>
                      {record.winDetails.map((detail, idx) => (
                        <div key={idx} className="flex items-center gap-1 bg-zinc-900/50 px-1.5 py-0.5 rounded border border-zinc-700/50">
                          <span className="text-xs text-zinc-400">{detail.count}</span>
                          <div className="w-4 h-4 flex items-center justify-center">
                            <PixelIcon name={detail.symbol} size={16} />
                          </div>
                          {detail.lines > 1 && (
                            <span className="text-[10px] font-bold text-zinc-300">x{detail.lines}</span>
                          )}
                          {detail.multiplier > 1 && (
                            <span className="text-[10px] font-bold text-blue-400">Multi x{detail.multiplier}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
              No play records yet.
            </div>
          )
        ) : (
          <div className="flex flex-col h-full">
            <p className="text-xs text-zinc-500 text-center mb-1 shrink-0">Showing the latest 50 plays</p>
            <p className="text-[10px] text-zinc-600 text-center mb-3 shrink-0 italic">* Amounts shown are gross win amount, not net amount</p>
            <div className="space-y-2">
              {winners.map(winner => (
                <div key={winner.id} className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-xl text-sm will-change-transform">
                  <div className="flex items-center gap-3">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${winner.user}`} 
                      alt={winner.user} 
                      className="w-8 h-8 rounded-full bg-zinc-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col">
                      <span className="text-zinc-300 font-medium">{winner.user}</span>
                      <span className="text-zinc-500 font-mono text-xs">{winner.time}</span>
                    </div>
                  </div>
                  <span className="font-bold font-mono text-yellow-400">
                    +${winner.winAmount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
