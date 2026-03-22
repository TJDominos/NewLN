import React from 'react';
import { History, Users } from 'lucide-react';
import { PlayRecord, PlayboardRecord } from '../types';

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
      
      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar scrollbar-hide min-h-0">
        {activeTab === 'records' ? (
          records.length > 0 ? (
            <div className="space-y-2">
              {records.map(record => (
                <div key={record.id} className="grid grid-cols-[120px_1fr_80px] items-center p-3 bg-zinc-800/50 rounded-xl text-sm gap-2">
                  <span className="text-zinc-400 font-mono text-xs text-left whitespace-nowrap">{record.time}</span>
                  <span className="text-zinc-300 text-center">Bet: {record.bet}</span>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold leading-none mb-0.5">Net</span>
                    <span className={`font-bold font-mono text-right leading-none ${record.win - record.bet > 0 ? 'text-emerald-400' : record.win - record.bet < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                      {record.win - record.bet > 0 ? `+${record.win - record.bet}` : record.win - record.bet}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
              No play records yet.
            </div>
          )
        ) : (
          <div className="space-y-2">
            {winners.map(winner => (
              <div key={winner.id} className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-xl text-sm">
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
        )}
      </div>
    </div>
  );
};
