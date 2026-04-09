import React from 'react';
import { Search, Users } from 'lucide-react';
import type { SearchResult } from '../types';

interface AddFriendModalProps {
  showAddFriend: boolean;
  setShowAddFriend: (show: boolean) => void;
  searchQuery: string;
  handleSearchUser: (query: string) => void;
  isSearching: boolean;
  searchResults: SearchResult[];
  handleAddFriend: (id: string, name: string) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({
  showAddFriend,
  setShowAddFriend,
  searchQuery,
  handleSearchUser,
  isSearching,
  searchResults,
  handleAddFriend,
  setSearchQuery,
  setSearchResults,
}) => {
  if (!showAddFriend) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => { setShowAddFriend(false); setSearchQuery(''); setSearchResults([]); }}>
      <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: '#1e293b', border: '1px solid rgba(16,185,129,0.3)' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-xl font-black text-white">Thêm bạn bè</h3>
          </div>
          <button onClick={() => { setShowAddFriend(false); setSearchQuery(''); setSearchResults([]); }} className="text-slate-400 hover:text-white">✕</button>
        </div>
        
        <div className="relative mb-6">
          <input type="text" value={searchQuery} onChange={e => handleSearchUser(e.target.value)} placeholder="Nhập nickname cần tìm..." className="w-full p-3.5 pl-10 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-emerald-500" />
          <Search size={16} className="absolute left-3.5 top-4 text-slate-500" />
        </div>

        {isSearching ? (
          <p className="text-center text-slate-400 text-sm py-4">Đang tìm kiếm...</p>
        ) : searchResults.length > 0 ? (
          <div className="space-y-3 mb-6">
            {searchResults.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800 border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    {user.nickname.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">{user.nickname}</p>
                    <p className="text-slate-400 text-[10px]">Người dùng DigiWell</p>
                  </div>
                </div>
                <button onClick={() => handleAddFriend(user.id, user.nickname)} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold active:scale-95 transition-all">
                  Kết bạn
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Users size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">{searchQuery.length > 2 ? 'Không tìm thấy người dùng này' : 'Tìm kiếm bằng nickname để cùng đua top'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddFriendModal;