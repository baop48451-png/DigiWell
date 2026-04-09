import React from 'react';
import { Coffee, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingModalProps {
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
  profileId?: string;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  showOnboarding,
  setShowOnboarding,
  onboardingStep,
  setOnboardingStep,
  profileId,
}) => {
  if (!showOnboarding) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-slate-900/90 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-[2rem] p-8 text-center relative overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)]" style={{ background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(6,182,212,0.3)' }}>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl"></div>
        
        {onboardingStep === 1 && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 mx-auto bg-cyan-500/20 border-2 border-cyan-500/50 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <span className="text-4xl font-black text-white">(^o^)</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-3">Holo-Pet</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">Nhắc bạn uống nước mỗi ngày.</p>
          </div>
        )}
        {onboardingStep === 2 && (
          <div className="animate-in fade-in slide-in-from-right duration-500">
            <div className="w-20 h-20 mx-auto bg-orange-500/20 border-2 border-orange-500/50 rounded-3xl flex items-center justify-center mb-6"><Coffee size={32} className="text-orange-400" /></div>
            <h3 className="text-2xl font-black text-white mb-3">Đồ uống</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">Mỗi loại đồ uống có hệ số khác nhau.</p>
          </div>
        )}
        {onboardingStep === 3 && (
          <div className="animate-in fade-in slide-in-from-right duration-500">
            <div className="w-20 h-20 mx-auto bg-emerald-500/20 border-2 border-emerald-500/50 rounded-3xl flex items-center justify-center mb-6"><Sparkles size={32} className="text-emerald-400" /></div>
            <h3 className="text-2xl font-black text-white mb-3">Tiện ích</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">Mở góc phải màn hình để xem kết nối và lời nhắc.</p>
          </div>
        )}

        <button onClick={() => { if (onboardingStep < 3) setOnboardingStep(onboardingStep + 1); else { localStorage.setItem(`digiwell_onboarded_${profileId}`, 'true'); setShowOnboarding(false); toast.success("Đã hoàn tất thiết lập!"); } }} className="w-full py-4 rounded-xl font-bold text-slate-900 text-sm active:scale-95 transition-all shadow-lg" style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>
          {onboardingStep < 3 ? 'Tiếp tục' : 'Bắt đầu'}
        </button>
        <div className="flex justify-center gap-2 mt-6">{[1, 2, 3].map(i => (<div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${onboardingStep === i ? 'bg-cyan-400 w-6' : 'bg-slate-700'}`} />))}</div>
      </div>
    </div>
  );
};

export default OnboardingModal;