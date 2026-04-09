import React from 'react';
import type { LocalWaterEntry } from '../types';

interface EditEntryModalProps {
  editingEntry: LocalWaterEntry | null;
  setEditingEntry: (entry: LocalWaterEntry | null) => void;
  editAmount: string;
  setEditAmount: (amount: string) => void;
  handleEditEntry: () => void;
}

const EditEntryModal: React.FC<EditEntryModalProps> = ({
  editingEntry,
  setEditingEntry,
  editAmount,
  setEditAmount,
  handleEditEntry,
}) => {
  if (!editingEntry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => { setEditingEntry(null); setEditAmount(''); }}>
      <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: '#1e293b', border: '1px solid rgba(6,182,212,0.2)' }} onClick={e => e.stopPropagation()}>
        <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-1">Chỉnh sửa</p>
        <h3 className="text-xl font-black text-white mb-5">Cập nhật ghi nhận</h3>
        <div className="mb-4">
          <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">Lượng nước (ml)</label>
          <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="w-full p-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-lg font-bold outline-none focus:border-cyan-500" autoFocus />
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setEditingEntry(null); setEditAmount(''); }} className="flex-1 py-3 rounded-xl text-slate-400 font-bold text-sm border border-slate-700 bg-slate-800">
            Huỷ
          </button>
          <button onClick={handleEditEntry} className="flex-1 py-3 rounded-xl font-bold text-slate-900 text-sm" style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEntryModal;