# Hướng dẫn kích hoạt Social Enhanced

## Bước 1: Chạy SQL trên Supabase

1. Truy cập: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **SQL Editor**
4. Copy toàn bộ nội dung file `supabase/social_enhanced.sql`
5. Paste vào SQL Editor
6. Click **Run** ▶️

## Bước 2: Sync Capacitor (sau khi có code mới)

```bash
npm install
npx cap sync ios
npx cap sync android
```

## Bước 3: Build lại app

```bash
# iOS (trên Mac)
open ios/App/App.xcworkspace

# Android
cd android && ./gradlew assembleDebug
```

## Tính năng mới sau khi kích hoạt:

### 1. Comments (Bình luận)
- Comment trên bài viết của người khác
- Like comments
- Realtime - comment mới hiện ngay lập tức

### 2. Direct Messages (Nhắn tin riêng)
- Chat riêng 1-1 với bất kỳ user nào
- Đánh dấu đã đọc/chưa đọc
- Realtime - tin nhắn mới đến ngay

### 3. Notifications (Thông báo)
- Thông báo khi có người like bài viết
- Thông báo khi có bình luận mới
- Thông báo khi có người follow mới
- Thông báo khi có tin nhắn mới

## Cấu trúc Database mới:

### social_comments
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| post_id | UUID | Foreign key to posts |
| author_id | UUID | User viết comment |
| content | TEXT | Nội dung (max 500 chars) |
| like_count | INTEGER | Số lượt like |
| created_at | TIMESTAMPTZ | Thời gian tạo |

### direct_messages
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| sender_id | UUID | Người gửi |
| receiver_id | UUID | Người nhận |
| content | TEXT | Nội dung tin nhắn |
| is_read | BOOLEAN | Đã đọc chưa |

### notifications
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Người nhận thông báo |
| type | ENUM | Loại: like_post, comment, follow, dm... |
| actor_id | UUID | Người thực hiện hành động |
| is_read | BOOLEAN | Đã đọc chưa |

## Troubleshooting

### Lỗi "Table does not exist"
→ Chưa chạy SQL. Kiểm tra lại SQL Editor trên Supabase.

### Lỗi Permission denied
→ RLS policies chưa đúng. Kiểm tra lại SQL đã tạo policies.

### Notifications không hoạt động
→ Supabase Realtime có thể cần bật cho các bảng mới.
  Vào Database → Replication → Enable realtime cho:
  - social_comments
  - direct_messages
  - notifications
