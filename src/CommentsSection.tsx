import React, { useState, useEffect } from 'react';
import { Heart, Trash2, RefreshCw } from 'lucide-react';
import { fetchComments, addComment, toggleCommentLike, type SocialComment } from './lib/socialEnhanced';

interface CommentsSectionProps {
  postId: string;
  currentUserId: string;
}

export default function CommentsSection({ postId, currentUserId }: CommentsSectionProps) {
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    setIsLoading(true);
    const data = await fetchComments(postId, currentUserId);
    setComments(data);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    const result = await addComment(postId, currentUserId, newComment.trim());
    if (result.success && result.comment) {
      setComments(prev => [...prev, result.comment!]);
      setNewComment('');
    }
    setIsSubmitting(false);
  };

  const handleLike = async (comment: SocialComment) => {
    await toggleCommentLike(comment.id, currentUserId, comment.likedByMe || false);
    setComments(prev => prev.map(c => 
      c.id === comment.id 
        ? { ...c, likedByMe: !c.likedByMe, like_count: (c.like_count || 0) + (c.likedByMe ? -1 : 1) }
        : c
    ));
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
  };

  return (
    <div className="border-t border-slate-700/50 mt-4 pt-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
          Bình luận ({comments.length})
        </span>
        <button onClick={loadComments} className="text-cyan-400 text-xs hover:underline">
          <RefreshCw size={12} className="inline mr-1" />Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <RefreshCw size={20} className="animate-spin text-cyan-400 mx-auto" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-4">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-700/30">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-cyan-300">
                  {(comment.author?.nickname || 'U')[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-xs font-bold">{comment.author?.nickname || 'Người dùng'}</span>
                  <span className="text-slate-500 text-[10px]">{formatTime(comment.created_at)}</span>
                </div>
                <p className="text-slate-300 text-sm mt-1">{comment.content}</p>
                <div className="flex items-center gap-4 mt-2">
                  <button 
                    onClick={() => handleLike(comment)}
                    className={`flex items-center gap-1 text-xs ${comment.likedByMe ? 'text-rose-400' : 'text-slate-500 hover:text-rose-400'}`}
                  >
                    <Heart size={12} className={comment.likedByMe ? 'fill-rose-400' : ''} />
                    {comment.like_count || 0}
                  </button>
                  {comment.author_id === currentUserId && (
                    <button className="text-slate-500 hover:text-red-400 text-xs">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Viết bình luận..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-500"
        />
        <button 
          type="submit" 
          disabled={isSubmitting || !newComment.trim()}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-900 font-bold text-sm disabled:opacity-50"
        >
          Gửi
        </button>
      </form>
    </div>
  );
}
