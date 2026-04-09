import React from 'react';
import { Droplet, Cpu } from 'lucide-react';
import type { LocalWaterEntry } from '../types';

interface HistoryModalProps {
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  waterEntries: LocalWaterEntry[];
  waterIntake: number;
  setEditingEntry: (entry: LocalWaterEntry | null) => void;
  setEditAmount: (amount: string) => void;
  handleDeleteEntry: (id: string) => Promise<void>;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  showHistory,
  setShowHistory,
  waterEntries,
  waterIntake,
  setEditingEntry,
  setEditAmount,
  handleDeleteEntry,
}) => {
  if (!showHistory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setShowHistory(false)}>
      <div className="w-full max-w-md rounded-t-3xl p-6 pb-10" style={{ background: '#1e293b', border: '1px solid rgba(6,182,212,0.2)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest">Hôm nay</p>
            <h3 className="text-xl font-black text-white">Lịch sử uống nước</h3>
          </div>
          <button onClick={() => setShowHistory(false)} className="text-slate-400 text-xs bg-slate-700 px-3 py-1.5 rounded-lg font-bold">Đóng</button>
        </div>

        {waterEntries.length === 0 ? (
          <div className="text-center py-10">
            <Droplet size={36} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Chưa có ghi nhận nào hôm nay</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {[...waterEntries].reverse().map((entry) => {
              const t = new Date(entry.timestamp);
              const timeStr = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(t);
              return (
                <div key={entry.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)' }}>
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Cpu size={16} className="text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${(entry.actual_ml !== undefined && entry.actual_ml < 0) ? 'text-red-400' : 'text-white'}`}>
                      {(entry.actual_ml !== undefined && entry.actual_ml < 0) ? '' : '+'}{entry.actual_ml || entry.amount} ml
                    </p>
                    <p className="text-slate-400 text-[10px] line-clamp-1 truncate pr-2">
                      {timeStr} · {entry.name || 'Nước lọc'}
                    </p>
                  </div>
                  <button onClick={() => { setEditingEntry(entry); setEditAmount(entry.amount.toString()); setShowHistory(false); }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-cyan-400 border border-cyan-500/30 bg-cyan-500/10 mr-1">
                    Sửa
                  </button>
                  <button onClick={() => handleDeleteEntry(entry.id)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-red-400 border border-red-500/30 bg-red-500/10">
                    Xóa
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
          <p className="text-slate-400 text-xs">{waterEntries.length} lần · Tổng cộng</p>
          <p className="text-cyan-400 font-black">{waterIntake} ml</p>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;