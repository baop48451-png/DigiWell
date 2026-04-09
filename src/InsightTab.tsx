import { useState, useMemo } from 'react';
import { BarChart2, Lock, Cpu, RefreshCw, Calendar, ChevronLeft, ChevronRight, Droplet, FileSpreadsheet, Smile, Coffee } from 'lucide-react';
import { loadMonthlyWaterHistory, exportWaterDataCSV, loadStoredWaterEntries, type DailyWaterSummary } from './lib/waterStorage';

interface InsightTabProps {
  isPremium: boolean;
  setShowPremiumModal: (show: boolean) => void;
  isExportingPDF: boolean;
  handleExportPDF: () => void;
  waterIntake: number;
  progress: number;
  isAiLoading: boolean;
  aiAdvice: string;
  fetchAIAdvice: (mood?: string, meal?: string) => void;
  setShowAiChat: (show: boolean) => void;
  profileId?: string;
  waterGoal: number;
}

const card = "bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl";

export default function InsightTab({
  isPremium, setShowPremiumModal, isExportingPDF, handleExportPDF,
  progress, isAiLoading, aiAdvice, fetchAIAdvice, setShowAiChat,
  profileId, waterGoal
}: InsightTabProps) {
  const [historyMonth, setHistoryMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DailyWaterSummary | null>(null);
  const [activeMood, setActiveMood] = useState<string>('');
  const [mealInput, setMealInput] = useState<string>('');

  const monthlyHistory = useMemo(() => {
    if (!profileId) return [];
    const history = loadMonthlyWaterHistory(profileId);
    return history.map(h => ({
      ...h,
      goalMl: waterGoal,
      percentage: waterGoal > 0 ? Math.min((h.totalMl / waterGoal) * 100, 100) : 0,
    }));
  }, [profileId, waterGoal]);

  const getDaysInMonth = (date: Date): DailyWaterSummary[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: DailyWaterSummary[] = [];
    
    const startDayOfWeek = firstDay.getDay();
    
    if (startDayOfWeek > 0) {
      const prevMonth = new Date(year, month, 0);
      for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const d = new Date(year, month - 1, prevMonth.getDate() - i);
        const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const existing = monthlyHistory.find(h => h.day === day);
        days.push(existing || { day, date: d, totalMl: 0, goalMl: waterGoal, entryCount: 0, percentage: 0 });
      }
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const day = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const existing = monthlyHistory.find(h => h.day === day);
      days.push(existing || { day, date: d, totalMl: 0, goalMl: waterGoal, entryCount: 0, percentage: 0 });
    }
    
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const existing = monthlyHistory.find(h => h.day === day);
      days.push(existing || { day, date: d, totalMl: 0, goalMl: waterGoal, entryCount: 0, percentage: 0 });
    }
    
    return days;
  };

  const monthDays = getDaysInMonth(historyMonth);
  const monthName = historyMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const prevMonth = () => setHistoryMonth(new Date(historyMonth.getFullYear(), historyMonth.getMonth() - 1, 1));
  const nextMonth = () => setHistoryMonth(new Date(historyMonth.getFullYear(), historyMonth.getMonth() + 1, 1));

  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const recent7Days = useMemo(() => {
    if (!profileId) return [];
    return Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const existing = loadStoredWaterEntries(profileId, dayStr);
      const totalMl = existing.reduce((sum, e) => sum + (e.actual_ml || e.amount), 0);
      return { day: dayStr, date: d, totalMl, goalMl: waterGoal, entryCount: existing.length, percentage: Math.min((totalMl / waterGoal) * 100, 100) };
    });
  }, [profileId, waterGoal, historyMonth /* trick trigger update */]);

  const previous7Days = useMemo(() => {
    if (!profileId) return [];
    return Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const existing = loadStoredWaterEntries(profileId, dayStr);
      const totalMl = existing.reduce((sum, e) => sum + (e.actual_ml || e.amount), 0);
      return { day: dayStr, date: d, totalMl, goalMl: waterGoal, entryCount: existing.length, percentage: Math.min((totalMl / waterGoal) * 100, 100) };
    });
  }, [profileId, waterGoal, historyMonth]);

  const avgMl = recent7Days.length > 0 ? Math.round(recent7Days.reduce((sum, d) => sum + d.totalMl, 0) / recent7Days.length) : 0;
  const completedDays = monthlyHistory.filter(d => d.percentage >= 100).length;
  const bestDay = monthlyHistory.reduce<{ totalMl: number; day: string }>((best, d) => d.totalMl > best.totalMl ? d : best, { totalMl: 0, day: '' });

  const getDayColor = (day: DailyWaterSummary, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return 'bg-slate-800/30 text-slate-600';
    if (day.day === todayStr) return 'ring-2 ring-cyan-400 bg-cyan-500/30 text-white';
    if (day.totalMl === 0) return 'bg-slate-800/50 text-slate-400';
    if (day.percentage >= 100) return 'bg-emerald-500/60 text-white';
    if (day.percentage >= 70) return 'bg-cyan-500/50 text-white';
    if (day.percentage >= 40) return 'bg-yellow-500/40 text-white';
    return 'bg-red-500/40 text-white';
  };

  const isCurrentMonthDay = (day: DailyWaterSummary) => {
    return day.date.getMonth() === historyMonth.getMonth() && day.date.getFullYear() === historyMonth.getFullYear();
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-black text-white">Thống kê</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportWaterDataCSV(profileId || 'export', monthlyHistory)} className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all active:scale-95 shadow-md">
            <FileSpreadsheet size={14} className="text-cyan-400" /> Xuất CSV
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all active:scale-95 shadow-md">
            <BarChart2 size={14} className={isPremium ? "text-cyan-400" : "text-amber-400"} />
            {isExportingPDF ? 'Đang xuất...' : 'Xuất PDF'}
            {!isPremium && <Lock size={12} className="text-amber-500" />}
          </button>
        </div>
      </div>

      <div className={`${card} p-6`}>
        <div className="flex justify-between items-center mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">7 ngày gần nhất (WoW)</p>
          <div className="flex gap-3 text-[9px] font-bold uppercase">
             <span className="text-cyan-400 flex items-center gap-1"><div className="w-2 h-2 rounded bg-cyan-400"></div> Tuần này</span>
             <span className="text-purple-400 opacity-70 flex items-center gap-1"><div className="w-2 h-2 rounded bg-purple-500/50"></div> Tuần trước</span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 h-44">
          {recent7Days.map((item, index) => (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold" style={{ color: item.day === todayStr ? '#22d3ee' : '#64748b' }}>
                {item.totalMl > 0 ? `${(item.totalMl / 1000).toFixed(1)}L` : '0L'}
              </span>
              <div className="w-full rounded-xl relative overflow-hidden bg-slate-800 border border-slate-700 hover:bg-slate-700/50 transition-colors cursor-pointer" style={{ height: '120px', boxShadow: item.day === todayStr ? '0 0 15px rgba(6,182,212,0.3)' : 'none' }}>
                {previous7Days[index] && (
                  <div className="absolute bottom-0 w-full rounded-xl opacity-30 bg-purple-500 transition-all duration-700"
                    style={{ height: `${Math.max(previous7Days[index].percentage, 5)}%`, width: '100%' }} title={`Tuần trước: ${previous7Days[index].totalMl}ml`} />
                )}
                <div className="absolute bottom-0 w-full rounded-xl opacity-90 transition-all duration-700"
                  style={{ height: `${Math.max(item.percentage, item.day === todayStr ? 5 : 0)}%`, background: item.day === todayStr ? 'linear-gradient(180deg, #06b6d4, #0ea5e9)' : 'rgba(6,182,212,0.7)' }} title={`Tuần này: ${item.totalMl}ml`} />
              </div>
              <span className="text-[10px] font-bold" style={{ color: item.day === todayStr ? '#22d3ee' : '#64748b' }}>
                {item.date.toLocaleDateString('vi-VN', { weekday: 'short' }).replace('/', '')}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={`${card} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-cyan-400" />
            <p className="text-white text-sm font-bold uppercase tracking-widest">Lịch sử uống nước</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white active:scale-95 transition-all">
            <ChevronLeft size={16} />
          </button>
          <p className="text-white font-bold">{monthName}</p>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white active:scale-95 transition-all">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-500 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day, idx) => (
            <button
              key={idx}
              onClick={() => day.entryCount > 0 && setSelectedDay(day)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-all ${getDayColor(day, isCurrentMonthDay(day))} ${day.entryCount > 0 ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
            >
              <span>{day.date.getDate()}</span>
              {day.totalMl > 0 && (
                <span className="text-[8px] opacity-70">{Math.round(day.percentage)}%</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500/40" />
              <span className="text-[10px] text-slate-500">{"<40%"}</span>
            </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500/40" />
            <span className="text-[10px] text-slate-500">40-70%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-cyan-500/50" />
            <span className="text-[10px] text-slate-500">70-99%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500/60" />
            <span className="text-[10px] text-slate-500">100%+</span>
          </div>
        </div>

        {selectedDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedDay(null)}>
            <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: '#1e293b', border: '1px solid rgba(6,182,212,0.2)' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest">Chi tiết</p>
                  <h3 className="text-xl font-black text-white mt-1">
                    {selectedDay.date.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                </div>
                <button onClick={() => setSelectedDay(null)} className="text-slate-400 text-xs bg-slate-700 px-3 py-1.5 rounded-lg font-bold">Đóng</button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/80 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <Droplet size={20} className="text-cyan-400" />
                    <span className="text-white text-sm font-bold">Tổng lượng nước</span>
                  </div>
                  <span className="text-cyan-400 font-black text-lg">{selectedDay.totalMl} ml</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/80 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <BarChart2 size={20} className="text-emerald-400" />
                    <span className="text-white text-sm font-bold">Hoàn thành</span>
                  </div>
                  <span className="text-emerald-400 font-black text-lg">{Math.round(selectedDay.percentage)}%</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/80 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <Cpu size={20} className="text-amber-400" />
                    <span className="text-white text-sm font-bold">Số lần uống</span>
                  </div>
                  <span className="text-amber-400 font-black text-lg">{selectedDay.entryCount} lần</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Trung bình/ngày', val: avgMl > 0 ? avgMl.toLocaleString() : '--', unit: 'ml', color: '#22d3ee' },
          { label: 'Hoàn thành mục tiêu', val: completedDays.toString(), unit: `/ ${Math.min(monthlyHistory.length, 30)} ngày`, color: '#34d399' },
          { label: 'Ngày tốt nhất', val: bestDay.totalMl > 0 ? `${(bestDay.totalMl / 1000).toFixed(1)}L` : '--', unit: bestDay.day || '', color: '#fbbf24' },
          { label: 'Tiến độ hôm nay', val: `${Math.round(progress)}`, unit: '%', color: '#a78bfa' },
        ].map(s => (
          <div key={s.label} className={`${card} p-5`}>
            <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-2 font-bold">{s.label}</p>
            <p className="text-3xl font-black" style={{ color: s.color }}>{s.val}<span className="text-sm font-normal text-slate-500 ml-1">{s.unit}</span></p>
          </div>
        ))}
      </div>

      <div className={`${card} p-6 border-l-4 ${isPremium ? 'border-l-amber-500' : 'border-l-purple-500'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cpu size={16} className={`${isPremium ? 'text-amber-400' : 'text-purple-400'} ${isAiLoading ? 'animate-spin' : ''}`} />
            <p className="text-white text-sm font-bold uppercase tracking-widest">Gemini AI Coach {isPremium && <span className="text-amber-400 ml-1">PRO</span>}</p>
          </div>
          {isPremium ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => fetchAIAdvice(activeMood, mealInput)} 
                disabled={isAiLoading || (!activeMood && !mealInput && !!aiAdvice)} 
                className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-1 rounded font-bold flex items-center gap-1 disabled:opacity-60 active:scale-95 transition-all">
                <RefreshCw size={10} className={isAiLoading ? 'animate-spin' : ''} />
                {isAiLoading ? 'Đang phân tích' : 'Làm mới'}
              </button>
              <button onClick={() => setShowAiChat(true)} className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-1 rounded font-bold active:scale-95 transition-all">
                Chat AI
              </button>
            </div>
          ) : (
            <button onClick={() => setShowPremiumModal(true)} className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded font-bold">Nâng cấp Pro</button>
          )}
        </div>

        {isPremium && (
          <div className="mb-4 p-3 bg-slate-900/50 rounded-xl border border-slate-700 space-y-3">
            <div>
              <p className="text-xs text-slate-400 font-bold mb-2 flex items-center gap-1"><Smile size={12}/> Tâm trạng hôm nay</p>
              <div className="flex gap-2 text-xl">
                {['😊', '😴', '😠', '🤒', '🏃'].map(emoji => (
                  <button 
                    key={emoji} 
                    onClick={() => setActiveMood(activeMood === emoji ? '' : emoji)}
                    className={`transition-all hover:scale-110 p-1 rounded-full ${activeMood === emoji ? 'bg-amber-500/20 ring-1 ring-amber-500/50' : 'opacity-50 grayscale'}`}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold mb-2 flex items-center gap-1"><Coffee size={12}/> Ghép cặp đồ uống</p>
              <input 
                type="text" 
                value={mealInput} 
                onChange={e => setMealInput(e.target.value)} 
                placeholder="Vd: Phở bò, Salad, Cà phê..." 
                className="w-full bg-slate-800 text-sm text-yellow-50 placeholder-slate-500 border border-slate-700/50 outline-none p-2 rounded-lg"
              />
            </div>
          </div>
        )}

        <p className="text-slate-300 text-sm leading-relaxed">
          {isPremium ? 
            (isAiLoading ? 'Gemini đang suy nghĩ để đưa ra đề xuất...' : aiAdvice || 'Ghi lại tâm trạng & món ăn để Gemini chọn thức uống phù hợp nhé!')
            : 'Gemini AI Coach nằm trong gói Pro. Theo dõi cảm xúc & gợi ý đồ uống phù hợp theo bữa ăn.'}
        </p>
      </div>
    </div>
  );
}
