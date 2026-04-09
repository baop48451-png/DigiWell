import React, { useState } from 'react';
import { Sparkles, ChevronLeft, Globe, Zap, QrCode, ArrowRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripeCheckoutForm } from './StripeCheckoutForm';
import { VietQRCode } from './VietQRCode';
import { confirmPremiumPayment, createPayOSLink } from '../lib/payment';
import { useAuthStore } from '../store/useAuthStore';

// Initialize Stripe (Test Key)
const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

interface PremiumModalProps {
  showPremiumModal: boolean;
  setShowPremiumModal: (show: boolean) => void;
  setIsPremium: (isPremium: boolean) => void;
}

type PaymentStep = 'features' | 'selection' | 'stripe' | 'payos' | 'vietqr';

const PremiumModal: React.FC<PremiumModalProps> = ({
  showPremiumModal,
  setShowPremiumModal,
  setIsPremium,
}) => {
  const { profile } = useAuthStore();
  const [step, setStep] = useState<PaymentStep>('features');
  const [region, setRegion] = useState<'vn' | 'intl'>('vn');
  const SUBSCRIPTION_PRICE = 49000;

  if (!showPremiumModal) return null;

  const handlePaymentSuccess = async (gateway: string) => {
    if (!profile?.id) return;
    
    const result = await confirmPremiumPayment(profile.id, gateway, SUBSCRIPTION_PRICE);
    if (result.success) {
      setIsPremium(true);
      setShowPremiumModal(false);
      toast.success("Chào mừng bạn đến với DigiWell PRO! 🌟");
    } else {
      toast.error("Có lỗi xảy ra khi kích hoạt tài khoản. Vui lòng liên hệ hỗ trợ.");
    }
  };

  const startPayOSFlow = async () => {
    const { checkoutUrl, error } = await createPayOSLink(SUBSCRIPTION_PRICE, 'DigiWell PRO 1 Month');
    if (error) return toast.error(error);
    
    toast.info("Đang chuyển hướng đến cổng PayOS...");
    setTimeout(() => {
      window.open(checkoutUrl, '_blank');
      // In real scenario, we'd wait for webhook. Here we simulate success button.
      setStep('payos');
    }, 1500);
  };

  const renderHeader = () => {
    if (step === 'features') return null;
    return (
      <button 
        onClick={() => setStep(step === 'selection' ? 'features' : 'selection')}
        className="absolute top-6 left-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
      >
        <ChevronLeft size={18} />
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-slate-950/90 backdrop-blur-xl" onClick={() => setShowPremiumModal(false)}>
      <div 
        className="w-full max-w-sm rounded-[2.5rem] p-8 relative overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.15)] border border-white/10" 
        style={{ background: 'linear-gradient(160deg, #0f172a 0%, #020617 100%)' }} 
        onClick={e => e.stopPropagation()}
      >
        {renderHeader()}
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-[60px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none"></div>
        
        {/* STEP 1: FEATURES */}
        {step === 'features' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,158,11,0.4)]">
              <Sparkles size={32} className="text-slate-900" />
            </div>
            
            <h3 className="text-2xl font-black text-white mb-2 leading-tight">DigiWell <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">PRO</span></h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">Nâng cấp để mở khóa toàn bộ sức mạnh của AI Health Coach.</p>
            
            <ul className="space-y-4 mb-10">
              {[
                { text: 'Xuất báo cáo PDF chuẩn Y khoa', desc: 'Dữ liệu chuyên sâu cho bác sĩ' },
                { text: 'Chế độ Nhịn ăn chuyên sâu', desc: 'Theo dõi Fasting tự động' },
                { text: 'AI Analytics & Dự báo', desc: 'Cảnh báo sớm rủi ro sức khỏe' },
              ].map((ft, i) => (
                <li key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Zap size={18} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{ft.text}</p>
                    <p className="text-[11px] text-slate-500">{ft.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => setStep('selection')} 
              className="w-full py-4 rounded-2xl font-black text-slate-900 text-[15px] active:scale-95 transition-all shadow-[0_10px_30px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 group" 
              style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)' }}
            >
              Nâng cấp ngay - 49.000đ
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => setShowPremiumModal(false)} className="w-full mt-4 py-2 font-bold text-slate-500 text-xs hover:text-slate-400 transition-colors">Để sau</button>
          </div>
        )}

        {/* STEP 2: GATEWAY SELECTION */}
        {step === 'selection' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-black text-white mb-6">Chọn phương thức thanh toán</h3>
            
            <div className="space-y-3">
              {/* Regional Toggle (VN vs Intl) */}
              <div className="flex p-1 bg-slate-900/80 rounded-2xl border border-white/5 mb-6">
                <button 
                  onClick={() => setRegion('vn')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${region === 'vn' ? 'bg-cyan-500 text-slate-900 shadow-lg' : 'text-slate-500'}`}
                >
                  Việt Nam
                </button>
                <button 
                  onClick={() => setRegion('intl')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${region === 'intl' ? 'bg-cyan-500 text-slate-900 shadow-lg' : 'text-slate-500'}`}
                >
                  Quốc tế
                </button>
              </div>

              {region === 'vn' ? (
                <>
                  <button 
                    onClick={startPayOSFlow}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-white/5 hover:border-cyan-500/50 transition-all active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center group flex-shrink-0">
                      <Zap size={24} className="text-orange-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">Cổng PayOS</p>
                      <p className="text-[10px] text-slate-500">MoMo, ZaloPay, Thẻ nội địa</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setStep('vietqr')}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-white/5 hover:border-cyan-500/50 transition-all active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <QrCode size={24} className="text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">Chuyển khoản VietQR</p>
                      <p className="text-[10px] text-slate-500">Quét mã ngân hàng (MB Bank)</p>
                    </div>
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setStep('stripe')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-white/5 hover:border-cyan-500/50 transition-all active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                    <Globe size={24} className="text-indigo-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Stripe Elements</p>
                    <p className="text-[10px] text-slate-500">Visa, Mastercard, Apple Pay</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: STRIPE EXECUTION */}
        {step === 'stripe' && (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <h3 className="text-xl font-black text-white mb-6">Thanh toán Quốc tế</h3>
            <Elements stripe={stripePromise}>
              <StripeCheckoutForm price={SUBSCRIPTION_PRICE} onSuccess={() => handlePaymentSuccess('stripe')} />
            </Elements>
          </div>
        )}

        {/* STEP 3: VIETQR EXECUTION */}
        {step === 'vietqr' && (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <h3 className="text-xl font-black text-white mb-6 text-center">Quét mã chuyển khoản</h3>
            <VietQRCode amount={SUBSCRIPTION_PRICE} description={`DigiWell PRO ${profile?.nickname || ''}`} />
            
            <button 
              onClick={() => handlePaymentSuccess('bank_transfer')}
              className="w-full mt-6 py-4 rounded-xl font-black text-slate-900 text-sm active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              Tôi đã chuyển khoản
            </button>
          </div>
        )}

        {/* STEP 3: PAYOS MOCK SUCCESS */}
        {step === 'payos' && (
          <div className="animate-in fade-in text-center p-4">
             <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <RefreshCw size={40} className="text-orange-400 animate-spin" />
             </div>
             <p className="text-white font-bold mb-2">Đang xử lý thanh toán...</p>
             <p className="text-slate-500 text-xs mb-8">Vui lòng hoàn tất thanh toán trên trang PayOS vừa mở.</p>
             
             <button 
              onClick={() => handlePaymentSuccess('payos')}
              className="w-full py-4 rounded-xl font-black text-slate-900 text-sm active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #fb923c, #ea580c)' }}
            >
              Xác nhận đã thanh toán
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default PremiumModal;