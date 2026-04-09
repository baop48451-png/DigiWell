import React from 'react';
import { Droplet, Zap } from 'lucide-react';

interface DashboardProps {
  userName?: string;
  waterIntake?: number;
  waterGoal?: number;
  streak?: number;
}

const Dashboard: React.FC<DashboardProps> = ({
  userName = 'Bạn',
  waterIntake = 0,
  waterGoal = 2000,
  streak = 0,
}) => {
  // Handle Edge Cases: Đảm bảo dữ liệu không bị lỗi tính toán (chia cho 0, số âm)
  const safeGoal = waterGoal > 0 ? waterGoal : 2000;
  const safeIntake = Math.max(0, waterIntake);
  const progress = Math.min((safeIntake / safeGoal) * 100, 100);
  const remaining = Math.max(safeGoal - safeIntake, 0);

  return (
    <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl w-full max-w-md mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Tổng quan hôm nay</p>
          <h2 className="text-2xl font-black text-white mt-1">Chào, <span className="text-cyan-400">{userName}</span> 👋</h2>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-1.5 shadow-inner">
          <Zap size={14} className="text-orange-400 fill-orange-400" />
          <span className="text-orange-400 font-bold text-sm">{Math.max(0, streak)} ngày</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-6 bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Droplet size={16} className="text-cyan-400" />
            <span className="text-slate-300 font-bold">Lượng nước</span>
          </div>
          <div className="flex items-baseline gap-1 truncate">
            <span className="text-4xl font-black text-white">{safeIntake}</span>
            <span className="text-slate-400 font-semibold">/ {safeGoal} ml</span>
          </div>
          <p className="text-slate-500 text-xs mt-2 truncate">
            {remaining > 0 ? `Còn thiếu ${remaining} ml` : 'Đã hoàn thành mục tiêu! 🎉'}
          </p>
        </div>

        <div className="relative w-20 h-20 flex-shrink-0 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.15)]" style={{ background: `conic-gradient(#06b6d4 ${progress * 3.6}deg, #1e293b 0deg)` }}>
          <div className="absolute inset-1.5 bg-slate-900 rounded-full flex items-center justify-center shadow-inner">
            <span className="text-white font-black text-sm">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;