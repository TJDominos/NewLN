import React from 'react';
import { History, Users } from 'lucide-react';
import { PlayRecord, WinnerRecord } from '../types';

interface RecordsBoardProps {
  activeTab: 'records' | 'winners';
  setActiveTab: (tab: 'records' | 'winners') => void;
  records: PlayRecord[];
  winners: WinnerRecord[];
}

export const RecordsBoard: React.FC<RecordsBoardProps> = ({
  activeTab,
  setActiveTab,
  records,
  winners,
}) => {
  return (
    <div className="w-full bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-xl">
      <div className="flex border-b border-zinc-800">
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
      
      <div className="p-4 h-64 overflow-y-auto custom-scrollbar">
        {activeTab === 'records' ? (
          records.length > 0 ? (
            <div className="space-y-2">
              {records.map(record => (
                <div key={record.id} className="grid grid-cols-[120px_1fr_80px] items-center p-3 bg-zinc-800/50 rounded-xl text-sm gap-2">
                  <span className="text-zinc-400 font-mono text-xs text-left whitespace-nowrap">{record.time}</span>
                  <span className="text-zinc-300 text-center">Bet: {record.bet}</span>
                  <span className={`font-bold font-mono text-right ${record.win > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {record.win > 0 ? `+${record.win}` : '0'}
                  </span>
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
                <div className="flex flex-col">
                  <span className="text-zinc-300 font-medium">{winner.user}</span>
                  <span className="text-zinc-500 font-mono text-xs">{winner.time}</span>
                </div>
                <span className="font-bold font-mono text-yellow-400">
                  +${winner.win}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
