import React from 'react';
import { Sparkles, Target } from 'lucide-react';
import { toast } from 'sonner';

interface PremiumModalProps {
  showPremiumModal: boolean;
  setShowPremiumModal: (show: boolean) => void;
  setIsPremium: (isPremium: boolean) => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({
  showPremiumModal,
  setShowPremiumModal,
  setIsPremium,
}) => {
  if (!showPremiumModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-slate-900/90 backdrop-blur-md" onClick={() => setShowPremiumModal(false)}>
      <div className="w-full max-w-sm rounded-[2rem] p-8 relative overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.15)]" style={{ background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(245,158,11,0.3)' }} onClick={e => e.stopPropagation()}>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/50 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
          <Sparkles size={28} className="text-amber-400" />
        </div>
        
        <h3 className="text-2xl font-black text-white mb-2">DigiWell <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">PRO</span></h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">Nâng cấp để mở khóa toàn bộ tính năng thông minh.</p>
        
        <ul className="space-y-3 mb-8">
          {[
            'Xuất báo cáo PDF chuẩn Y khoa',
            'Chế độ Nhịn ăn gián đoạn (Fasting)',
            'AI Analytics chuyên sâu phân tích thói quen',
          ].map((ft, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0"><Target size={12} className="text-amber-400" /></div>
              {ft}
            </li>
          ))}
        </ul>

        <button onClick={() => { setIsPremium(true); setShowPremiumModal(false); toast.success("Chào mừng bạn đến với DigiWell PRO! 🌟"); }} className="w-full py-4 rounded-xl font-bold text-slate-900 text-sm active:scale-95 transition-all shadow-lg" style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)' }}>
          Nâng cấp ngay - 49.000đ/tháng
        </button>
        <button onClick={() => setShowPremiumModal(false)} className="w-full mt-3 py-3 rounded-xl text-slate-400 text-xs font-bold hover:bg-slate-800 transition-colors">Để sau</button>
      </div>
    </div>
  );
};

export default PremiumModal;