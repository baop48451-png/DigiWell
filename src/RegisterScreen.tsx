import { useState, type FormEvent } from 'react';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { supabase } from './lib/supabase';

interface RegisterScreenProps {
  onBack: () => void;
  onSuccess: (email: string) => void;
}

const card = "bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl";

export default function RegisterScreen({ onBack, onSuccess }: RegisterScreenProps) {
  const [regData, setRegData] = useState({
    nickname: '', password: '', gender: 'Nam', age: 20,
    height: 172, weight: 82, activity: 'active',
    climate: 'Nhiệt đới (Nóng)', goal: 'Giảm mỡ & Tăng cơ',
    wakeUp: '06:00', bedTime: '23:00'
  });
  
  const [regEmail, setRegEmail] = useState('');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmittingReg) return;
    if (!regEmail || !regData.nickname || !regData.password) { toast.error("Vui lòng điền đầy đủ thông tin!"); return; }
    if (!isValidEmail(regEmail)) { toast.error("Email không hợp lệ!"); return; }
    if (regData.password.length < 6) { toast.error("Mật khẩu tối thiểu 6 ký tự!"); return; }
    
    setIsSubmittingReg(true);
    const toastId = toast.loading("Đang thiết lập Cloud Profile...");
    
    try {
      await supabase!.auth.signOut();

      const { data: authData, error: authError } = await supabase!.auth.signUp({ 
        email: regEmail.toLowerCase().trim(), 
        password: regData.password,
      });
      
      if (authError) throw authError;

      if (authData.user) {
        const { error: dbError } = await supabase!.from('profiles').upsert([{
          id: authData.user.id,
          nickname: regData.nickname.trim(),
          gender: regData.gender,
          age: regData.age,
          height: regData.height,
          weight: regData.weight,
          activity: regData.activity,
          climate: regData.climate,
          goal: regData.goal,
          wake_up: regData.wakeUp,
          bed_time: regData.bedTime,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' });
        if (dbError) throw new Error("Lỗi lưu hồ sơ: " + dbError.message);
      }
      
      toast.success("Khởi tạo tài khoản thành công! ✅", { id: toastId });
      
      if (!authData.session) { 
        onSuccess(regEmail); 
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi đăng ký!", { id: toastId });
    } finally { setIsSubmittingReg(false); }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto font-sans overflow-y-auto" style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)' }}>
      <Toaster position="top-center" theme="dark" richColors />
      <div className="p-6 pt-14">
        <button onClick={onBack} className="mb-8 p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 inline-flex">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-3xl font-black text-white mb-8">Tạo tài khoản</h2>

        <form onSubmit={handleRegister} className="space-y-5 pb-16">
          <div className={`${card} p-5 space-y-3`}>
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest pb-2 border-b border-slate-700">Tài khoản</p>
            <input type="email" placeholder="Email" value={regEmail} onChange={e => setRegEmail(e.target.value)} disabled={isSubmittingReg} className="w-full p-3.5 rounded-xl bg-slate-900/70 border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-cyan-500 text-sm disabled:opacity-50" />
            <input type="text" placeholder="Nickname" value={regData.nickname} onChange={e => setRegData({ ...regData, nickname: e.target.value })} disabled={isSubmittingReg} className="w-full p-3.5 rounded-xl bg-slate-900/70 border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-cyan-500 text-sm disabled:opacity-50" />
            <input type="password" placeholder="Mật khẩu (tối thiểu 6 ký tự)" value={regData.password} onChange={e => setRegData({ ...regData, password: e.target.value })} disabled={isSubmittingReg} className="w-full p-3.5 rounded-xl bg-slate-900/70 border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-cyan-500 text-sm disabled:opacity-50" />
          </div>

          <div className={`${card} p-5 space-y-3`}>
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest pb-2 border-b border-slate-700">Chỉ số cơ thể</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5 block">Giới tính</label><select value={regData.gender} onChange={e => setRegData({ ...regData, gender: e.target.value })} disabled={isSubmittingReg} className="w-full p-3 rounded-xl bg-slate-900/70 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500 disabled:opacity-50"><option>Nam</option><option>Nữ</option><option>Khác</option></select></div>
              <div><label className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5 block">Tuổi</label><input type="number" value={regData.age} onChange={e => setRegData({ ...regData, age: +e.target.value })} disabled={isSubmittingReg} className="w-full p-3 rounded-xl bg-slate-900/70 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500 disabled:opacity-50" /></div>
              <div><label className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5 block">Chiều cao (cm)</label><input type="number" value={regData.height} onChange={e => setRegData({ ...regData, height: +e.target.value })} disabled={isSubmittingReg} className="w-full p-3 rounded-xl bg-slate-900/70 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500 disabled:opacity-50" /></div>
              <div><label className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5 block">Cân nặng (kg)</label><input type="number" value={regData.weight} onChange={e => setRegData({ ...regData, weight: +e.target.value })} disabled={isSubmittingReg} className="w-full p-3 rounded-xl bg-slate-900/70 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500 disabled:opacity-50" /></div>
            </div>
          </div>

          <div className={`${card} p-5 space-y-3`}>
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest pb-2 border-b border-slate-700">Lối sống</p>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5 block">Cường độ vận động</label>
              <select value={regData.activity} onChange={e => setRegData({ ...regData, activity: e.target.value })} disabled={isSubmittingReg} className="w-full p-3 rounded-xl bg-slate-900/70 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500 disabled:opacity-50">
                <option value="sedentary">Ít vận động</option><option value="low">Vận động nhẹ</option><option value="active">Năng động</option><option value="very">Rất năng động</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5 block">Khí hậu nơi sống</label>
              <select value={regData.climate} onChange={e => setRegData({ ...regData, climate: e.target.value })} disabled={isSubmittingReg} className="w-full p-3 rounded-xl bg-slate-900/70 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500 disabled:opacity-50">
                <option value="Nhiệt đới (Nóng)">Nhiệt đới</option><option value="Ôn đới (Mát)">Ôn đới</option><option value="Khô hanh">Khô hanh</option><option value="Lạnh">Lạnh</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5 block">Mục tiêu sức khỏe chính</label>
              <select value={regData.goal} onChange={e => setRegData({ ...regData, goal: e.target.value })} disabled={isSubmittingReg} className="w-full p-3 rounded-xl bg-slate-900/70 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500 disabled:opacity-50">
                <option value="Giảm mỡ & Tăng cơ">Giảm mỡ & Tăng cơ</option><option value="Sức khỏe tổng quát">Sức khỏe tổng quát</option><option value="Bảo vệ da">Bảo vệ da</option>
              </select>
            </div>
          </div>

          <div className={`${card} p-5 space-y-3`}>
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest pb-2 border-b border-slate-700">Nhịp sinh học</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5 block">Giờ thức dậy</label><input type="time" value={regData.wakeUp} onChange={e => setRegData({ ...regData, wakeUp: e.target.value })} disabled={isSubmittingReg} className="w-full p-3 rounded-xl bg-slate-900/70 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500 disabled:opacity-50" /></div>
              <div><label className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5 block">Giờ đi ngủ</label><input type="time" value={regData.bedTime} onChange={e => setRegData({ ...regData, bedTime: e.target.value })} disabled={isSubmittingReg} className="w-full p-3 rounded-xl bg-slate-900/70 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500 disabled:opacity-50" /></div>
            </div>
          </div>

          <button type="submit" disabled={isSubmittingReg} className="w-full py-4 rounded-xl font-bold text-slate-900 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all" style={{ background: isSubmittingReg ? '#334155' : 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>
            {isSubmittingReg ? "Đang xử lý..." : <><span>Xác nhận & Bắt đầu</span><ArrowRight size={16} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
