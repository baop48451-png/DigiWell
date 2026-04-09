import React from 'react';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface VietQRCodeProps {
  amount: number;
  description: string;
}

const VIETQR_CONFIG = {
  bank_id: 'MB', // MB Bank
  account_no: '0392810031',
  account_name: 'PHAN BAO',
};

export const VietQRCode: React.FC<VietQRCodeProps> = ({ amount, description }) => {
  const [copied, setCopied] = useState(false);
  
  // Generating VietQR Image URL (VietQR Open API)
  const qrUrl = `https://img.vietqr.io/image/${VIETQR_CONFIG.bank_id}-${VIETQR_CONFIG.account_no}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(VIETQR_CONFIG.account_name)}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`Đã sao chép ${label}`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-3 rounded-2xl shadow-xl mb-4 border-2 border-slate-700/50">
        <img src={qrUrl} alt="VietQR" className="w-56 h-56 object-contain" />
      </div>
      
      <div className="w-full space-y-2 mb-4">
        <div className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700/50 rounded-xl">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-black">Số tài khoản</p>
            <p className="text-white font-bold">{VIETQR_CONFIG.account_no}</p>
          </div>
          <button onClick={() => copyToClipboard(VIETQR_CONFIG.account_no, 'số tài khoản')} className="p-2 text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        
        <div className="p-3 bg-slate-900/50 border border-slate-700/50 rounded-xl">
          <p className="text-[10px] text-slate-500 uppercase font-black">Chủ tài khoản</p>
          <p className="text-white font-bold">{VIETQR_CONFIG.account_name}</p>
        </div>
        
        <div className="p-3 bg-slate-900/50 border border-slate-700/50 rounded-xl">
          <p className="text-[10px] text-slate-500 uppercase font-black">Ngân hàng</p>
          <p className="text-white font-bold">MB Bank (Ngân hàng Quân đội)</p>
        </div>
      </div>
      
      <p className="text-[10px] text-slate-500 text-center italic">
        Vui lòng quét mã QR hoặc chuyển khoản đúng nội dung để hệ thống tự động kích hoạt.
      </p>
    </div>
  );
};
