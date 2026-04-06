import { Droplet } from 'lucide-react';

interface WelcomeScreenProps {
  onNavigate: (view: 'login' | 'register') => void;
}

export default function WelcomeScreen({ onNavigate }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto relative overflow-hidden font-sans"
      style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
      <div className="absolute bottom-32 right-0 w-64 h-64 rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />

      <div className="flex-1 flex flex-col items-center justify-center px-8 z-10">
        <div className="mb-8 relative">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>
            <Droplet className="w-12 h-12 text-white" fill="white" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
        </div>

        <h1 className="text-5xl font-black text-white tracking-tight mb-1">DigiWell</h1>
        <p className="text-cyan-400 text-xs font-bold tracking-[0.3em] uppercase mb-3">Smart Wellness System</p>
        <p className="text-slate-400 text-sm text-center leading-relaxed mb-16">
          Theo dõi sức khỏe thông minh,<br />được cá nhân hóa cho bạn.
        </p>

        <div className="w-full space-y-3">
          <button onClick={() => onNavigate('login')} className="w-full py-4 rounded-2xl font-bold text-sm tracking-wide text-slate-900 transition-all active:scale-95" style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>
            Đăng nhập
          </button>
          <button onClick={() => onNavigate('register')} className="w-full py-4 rounded-2xl font-bold text-sm tracking-wide text-cyan-300 border border-slate-600 bg-slate-800/50 transition-all active:scale-95">
            Tạo tài khoản mới
          </button>
        </div>
      </div>
      <p className="text-center text-slate-600 text-xs pb-8 z-10">Digital Citizen · VLU 2026</p>
    </div>
  );
}