import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Thêm import CommentsSection sau LeagueTab
if (!content.includes("import CommentsSection from './CommentsSection'")) {
  content = content.replace(
    "import LeagueTab from './LeagueTab';",
    "import LeagueTab from './LeagueTab';\nimport CommentsSection from './CommentsSection';"
  );
}

// 2. Thêm state expandedPostId
if (!content.includes("expandedPostId, setExpandedPostId")) {
  content = content.replace(
    "const [socialStories, setSocialStories] = useState<SocialFeedPost[]>([]);",
    "const [socialStories, setSocialStories] = useState<SocialFeedPost[]>([]);\n  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);"
  );
}

// 3. Thêm nút bình luận và CommentsSection sau "Đăng kiểu này"
if (content.includes("Đăng kiểu này") && !content.includes("expandedPostId === post.id")) {
  const oldBlock = `<Share2 size={14} /> Đăng kiểu này\n                      </button>\n                    </div>`;
  const newBlock = `<Share2 size={14} />\n                      </button>\n                    </div>\n                    {expandedPostId === post.id && profile?.id && (\n                      <CommentsSection postId={post.id} currentUserId={profile.id} />\n                    )}`;
  content = content.replace(oldBlock, newBlock);
}

// 4. Thêm nút bình luận vào grid 2 cột
if (content.includes('grid-cols-2 gap-2') && !content.includes("expandedPostId === post.id ? null")) {
  const oldGrid = `<div className="mt-4 grid grid-cols-2 gap-2">\n                      <button onClick={() => handleToggleLikePost(post)}`;
  const newGrid = `<div className="mt-4 grid grid-cols-3 gap-2">\n                      <button onClick={() => handleToggleLikePost(post)}`;
  content = content.replace(oldGrid, newGrid);
  
  // Thêm nút bình luận sau nút like
  const likeButtonEnd = `thích\n                      </button>\n                      <button onClick={() => openSocialComposer('progress')}`;
  const likeButtonWithComment = `thích\n                      </button>\n                      <button onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)} className={\`py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all \${expandedPostId === post.id ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' : 'bg-slate-900/70 text-slate-300 border-slate-700'}\`}>\n                        💬\n                      </button>\n                      <button onClick={() => openSocialComposer('progress')}`;
  if (content.includes(likeButtonEnd)) {
    content = content.replace(likeButtonEnd, likeButtonWithComment);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');
