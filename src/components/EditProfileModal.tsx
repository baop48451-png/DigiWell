import React from 'react';

interface EditProfileModalProps {
  showEditProfile: boolean;
  setShowEditProfile: (show: boolean) => void;
  editProfileData: any;
  setEditProfileData: (data: any) => void;
  handleSaveProfile: (e: React.FormEvent) => void;
  isUpdatingProfile: boolean;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  showEditProfile,
  setShowEditProfile,
  editProfileData,
  setEditProfileData,
  handleSaveProfile,
  isUpdatingProfile,
}) => {
  if (!showEditProfile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setShowEditProfile(false)}>
      <div className="w-full max-w-sm rounded-3xl p-6 max-h-[85vh] overflow-y-auto scrollbar-hide" style={{ background: '#1e293b', border: '1px solid rgba(6,182,212,0.2)' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-xl font-black text-white">Chỉnh sửa thông tin</h3>
          </div>
          <button onClick={() => setShowEditProfile(false)} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="text-[10px] text-slate-400 font-semibold uppercase mb-1 block">Nickname hiển thị</label>
            <input type="text" value={editProfileData.nickname} onChange={e => setEditProfileData({...editProfileData, nickname: e.target.value})} className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500" required />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] text-slate-400 font-semibold uppercase mb-1 block">Giới tính</label><select value={editProfileData.gender} onChange={e => setEditProfileData({...editProfileData, gender: e.target.value})} className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500"><option>Nam</option><option>Nữ</option><option>Khác</option></select></div>
            <div><label className="text-[10px] text-slate-400 font-semibold uppercase mb-1 block">Tuổi</label><input type="number" value={editProfileData.age} onChange={e => setEditProfileData({...editProfileData, age: +e.target.value})} className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500" required /></div>
            <div><label className="text-[10px] text-slate-400 font-semibold uppercase mb-1 block">Chiều cao (cm)</label><input type="number" value={editProfileData.height} onChange={e => setEditProfileData({...editProfileData, height: +e.target.value})} className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500" required /></div>
            <div><label className="text-[10px] text-slate-400 font-semibold uppercase mb-1 block">Cân nặng (kg)</label><input type="number" value={editProfileData.weight} onChange={e => setEditProfileData({...editProfileData, weight: +e.target.value})} className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500" required /></div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-semibold uppercase mb-1 block">Mục tiêu chính</label>
            <select value={editProfileData.goal} onChange={e => setEditProfileData({...editProfileData, goal: e.target.value})} className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500">
              <option value="Giảm mỡ & Tăng cơ">Giảm mỡ & Tăng cơ</option><option value="Sức khỏe tổng quát">Sức khỏe tổng quát</option><option value="Bảo vệ da">Bảo vệ da</option>
            </select>
          </div>

          <button type="submit" disabled={isUpdatingProfile} className="w-full py-4 mt-2 rounded-xl font-bold text-slate-900 text-sm disabled:opacity-50 active:scale-95 transition-all" style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>
            {isUpdatingProfile ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;