import React from 'react';
import { toast } from 'sonner';

interface CustomDrinkForm {
  name: string;
  amount: number | string;
  factor: number;
}

interface CustomDrinkModalProps {
  showCustomDrink: boolean;
  setShowCustomDrink: (show: boolean) => void;
  customDrinkForm: CustomDrinkForm;
  setCustomDrinkForm: (form: CustomDrinkForm) => void;
  handleAddWater: (amount: number, factor: number, name: string) => void;
}

const CustomDrinkModal: React.FC<CustomDrinkModalProps> = ({
  showCustomDrink,
  setShowCustomDrink,
  customDrinkForm,
  setCustomDrinkForm,
  handleAddWater,
}) => {
  if (!showCustomDrink) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setShowCustomDrink(false)}>
      <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: '#1e293b', border: '1px solid rgba(6,182,212,0.2)' }} onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-black text-white mb-5">Thêm đồ uống khác</h3>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">Tên đồ uống</label>
            <input type="text" value={customDrinkForm.name} onChange={e => setCustomDrinkForm({...customDrinkForm, name: e.target.value})} className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500" placeholder="VD: Trà đào, Nước dừa..." />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">Dung tích (ml)</label>
            <input type="number" value={customDrinkForm.amount} onChange={e => setCustomDrinkForm({...customDrinkForm, amount: e.target.value})} className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">Nhóm chất lỏng (BHI)</label>
            <select value={customDrinkForm.factor} onChange={e => setCustomDrinkForm({...customDrinkForm, factor: Number(e.target.value)})} className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500">
              <option value={1.0}>Nước lọc / Nước trái cây (100%)</option><option value={1.1}>Nước bù khoáng / Sữa (110%)</option><option value={0.8}>Cà phê / Trà đậm (80%)</option><option value={-0.5}>Rượu / Bia / Cồn (-50%)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setShowCustomDrink(false)} className="flex-1 py-3 rounded-xl text-slate-400 font-bold text-sm border border-slate-700 bg-slate-800">Huỷ</button>
          <button onClick={() => { const amt = Number(customDrinkForm.amount) || 0; if (amt <= 0) return toast.error("Dung tích không hợp lệ!"); handleAddWater(amt, customDrinkForm.factor, customDrinkForm.name || 'Đồ uống tùy chỉnh'); setShowCustomDrink(false); }} className="flex-1 py-3 rounded-xl font-bold text-slate-900 text-sm" style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>Thêm ngay</button>
        </div>
      </div>
    </div>
  );
};

export default CustomDrinkModal;