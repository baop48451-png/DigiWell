import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import { CreditCard, Lock, RefreshCw } from 'lucide-react';

interface StripeCheckoutFormProps {
  onSuccess: () => void;
  price: number;
}

export const StripeCheckoutForm: React.FC<StripeCheckoutFormProps> = ({ onSuccess, price }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    // Simulation of Stripe Payment confirmation
    // In real life: await stripe.confirmCardPayment(clientSecret, { payment_method: { card: elements.getElement(CardElement)! } })
    
    setTimeout(() => {
      setIsProcessing(false);
      toast.success('Thanh toán thành công qua Stripe! 🌟');
      onSuccess();
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-[1.5rem] p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={16} className="text-cyan-400" />
          <p className="text-xs font-bold text-white uppercase tracking-wider">Thông tin thẻ quốc tế</p>
        </div>
        
        <div className="p-3 bg-white rounded-xl mb-4">
          <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': { color: '#aab7c4' },
              },
              invalid: { color: '#9e2146' },
            },
          }} />
        </div>
        
        <div className="flex items-center gap-2 text-[10px] text-slate-500 justify-center">
          <Lock size={10} />
          <span>Thanh toán bảo mật chuẩn PCI-DSS bởi Stripe</span>
        </div>
      </div>

      <button
        disabled={!stripe || isProcessing}
        type="submit"
        className="w-full py-4 rounded-xl font-bold text-slate-900 text-sm active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #22d3ee, #0ea5e9)' }}
      >
        {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <Lock size={16} />}
        Thanh toán {price.toLocaleString('vi-VN')}đ
      </button>
    </form>
  );
};
