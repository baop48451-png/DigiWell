create extension if not exists pgcrypto;

-- Profiles table (Assumed to exist, but good to have a placeholder or actual definition)
-- create table if not exists public.profiles (
--   id uuid primary key references auth.users (id) on delete cascade,
--   nickname text,
--   avatar_url text,
--   created_at timestamptz default timezone('utc', now())
-- );
-- alter table public.profiles enable row level security;
-- DROP POLICY IF EXISTS "Profiles are public" ON public.profiles;
create policy "Profiles are public" on public.profiles for select using (true);
-- DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- 1. SOCIAL FOLLOWS
create table if not exists public.social_follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (follower_id, following_id),
  constraint social_follows_no_self_follow check (follower_id <> following_id)
);

create index if not exists social_follows_following_idx
  on public.social_follows (following_id);

alter table public.social_follows enable row level security;

DROP POLICY IF EXISTS "social_follows_select_authenticated" ON public.social_follows;
create policy "social_follows_select_authenticated" on public.social_follows
for select
to authenticated
using (true); -- Consider refining based on privacy needs (e.g., only mutuals or public profiles)

DROP POLICY IF EXISTS "social_follows_insert_own" ON public.social_follows;
create policy "social_follows_insert_own" on public.social_follows
for insert
to authenticated
with check (auth.uid() = follower_id);

DROP POLICY IF EXISTS "social_follows_delete_own" ON public.social_follows;
create policy "social_follows_delete_own" on public.social_follows
for delete
to authenticated
using (auth.uid() = follower_id);

-- 2. SOCIAL POSTS
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null default '',
  image_url text,
  post_kind text not null default 'status'
    check (post_kind in ('status', 'progress', 'story')),
  visibility text not null default 'public'
    check (visibility in ('public', 'followers')),
  hydration_ml integer,
  streak_snapshot integer,
  like_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz
);

create index if not exists social_posts_author_created_idx
  on public.social_posts (author_id, created_at desc);

create index if not exists social_posts_story_idx
  on public.social_posts (post_kind, expires_at);

alter table public.social_posts enable row level security;

DROP POLICY IF EXISTS "social_posts_select_visible" ON public.social_posts;
create policy "social_posts_select_visible" on public.social_posts
for select
to authenticated
using (
  visibility = 'public'
  or author_id = auth.uid()
  or (
    visibility = 'followers'
    and exists (
      select 1
      from public.social_follows
      where follower_id = auth.uid()
        and following_id = author_id
    )
  )
);

DROP POLICY IF EXISTS "social_posts_insert_own" ON public.social_posts;
create policy "social_posts_insert_own" on public.social_posts
for insert
to authenticated
with check (auth.uid() = author_id);

DROP POLICY IF EXISTS "social_posts_update_own" ON public.social_posts;
create policy "social_posts_update_own" on public.social_posts
for update
to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

DROP POLICY IF EXISTS "social_posts_delete_own" ON public.social_posts;
create policy "social_posts_delete_own" on public.social_posts
for delete
to authenticated
using (auth.uid() = author_id);

-- 3. SOCIAL POST LIKES
create table if not exists public.social_post_likes (
  post_id uuid not null references public.social_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

create index if not exists social_post_likes_user_idx
  on public.social_post_likes (user_id);

alter table public.social_post_likes enable row level security;

DROP POLICY IF EXISTS "social_post_likes_select_authenticated" ON public.social_post_likes;
create policy "social_post_likes_select_authenticated" on public.social_post_likes
for select
to authenticated
using (true); -- Consider refining based on privacy needs

DROP POLICY IF EXISTS "social_post_likes_insert_own" ON public.social_post_likes;
create policy "social_post_likes_insert_own" on public.social_post_likes
for insert
to authenticated
with check (auth.uid() = user_id);

DROP POLICY IF EXISTS "social_post_likes_delete_own" ON public.social_post_likes;
create policy "social_post_likes_delete_own" on public.social_post_likes
for delete
to authenticated
using (auth.uid() = user_id);

-- 4. SOCIAL COMMENTS
CREATE TABLE IF NOT EXISTS social_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 500),
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON social_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON social_comments(author_id);

ALTER TABLE social_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comments on public posts" ON social_comments;
CREATE POLICY "Anyone can view comments on public posts" ON social_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM social_posts p 
            WHERE p.id = post_id AND p.visibility = 'public'
        )
        OR
        EXISTS (
            SELECT 1 FROM social_follows f 
            WHERE f.follower_id = auth.uid() 
            AND f.following_id = (SELECT author_id FROM social_posts WHERE id = post_id)
        )
        OR author_id = auth.uid()
    );

DROP POLICY IF EXISTS "Authenticated users can comment" ON social_comments;
CREATE POLICY "Authenticated users can comment" ON social_comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

DROP POLICY IF EXISTS "Authors can update comments" ON social_comments;
CREATE POLICY "Authors can update comments" ON social_comments
    FOR UPDATE USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Authors can delete comments" ON social_comments;
CREATE POLICY "Authors can delete comments" ON social_comments
    FOR DELETE USING (author_id = auth.uid());

-- 5. COMMENT LIKES
CREATE TABLE IF NOT EXISTS social_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES social_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON social_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON social_comment_likes(user_id);

ALTER TABLE social_comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comment likes" ON social_comment_likes;
CREATE POLICY "Anyone can view comment likes" ON social_comment_likes
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can like comments" ON social_comment_likes;
CREATE POLICY "Users can like comments" ON social_comment_likes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "Users can unlike comments" ON social_comment_likes;
CREATE POLICY "Users can unlike comments" ON social_comment_likes
    FOR DELETE USING (user_id = auth.uid());

-- 6. DIRECT MESSAGES (Nhắn tin riêng)
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_conversation ON direct_messages(sender_id, receiver_id, created_at);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their messages" ON direct_messages;
CREATE POLICY "Users can view their messages" ON direct_messages
    FOR SELECT USING (auth.uid() IN (sender_id, receiver_id));

DROP POLICY IF EXISTS "Users can send messages" ON direct_messages;
CREATE POLICY "Users can send messages" ON direct_messages
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own messages" ON direct_messages;
CREATE POLICY "Users can update own messages" ON direct_messages
    FOR UPDATE USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own messages" ON direct_messages;
CREATE POLICY "Users can delete own messages" ON direct_messages
    FOR DELETE USING (sender_id = auth.uid());

-- 7. NOTIFICATIONS (Thông báo)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM (
            'like_post',
            'like_comment', 
            'comment',
            'follow',
            'mention',
            'dm'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES social_comments(id) ON DELETE CASCADE,
    message_id UUID REFERENCES direct_messages(id) ON DELETE CASCADE,
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Users can mark notifications as read" ON notifications;
CREATE POLICY "Users can mark notifications as read" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- 8. CONVERSATIONS LIST (VIEW)
CREATE OR REPLACE VIEW conversations AS
SELECT 
    LEAST(sender_id, receiver_id) as user_a,
    GREATEST(sender_id, receiver_id) as user_b,
    COUNT(*) as message_count,
    MAX(created_at) as last_message_at,
    STRING_AGG(
        CASE WHEN sender_id = LEAST(sender_id, receiver_id) THEN content ELSE NULL END, 
        ' ' ORDER BY created_at DESC
    ) as last_message_preview,
    SUM(CASE WHEN sender_id != LEAST(sender_id, receiver_id) AND is_read = FALSE THEN 1 ELSE 0 END) as unread_count
FROM direct_messages
GROUP BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id);

-- STORAGE BUCKET FOR SOCIAL MEDIA
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'social-media',
  'social-media',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/jpg']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "social_media_public_read" on storage.objects;
create policy "social_media_public_read"
on storage.objects
for select
to public
using (bucket_id = 'social-media');

drop policy if exists "social_media_authenticated_upload" on storage.objects;
create policy "social_media_authenticated_upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'social-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "social_media_authenticated_update" on storage.objects;
create policy "social_media_authenticated_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'social-media'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'social-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "social_media_authenticated_delete" on storage.objects;
create policy "social_media_authenticated_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'social-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto update updated_at for comments
CREATE OR REPLACE FUNCTION update_comment_timestamp()
RETURNS TRIGGER AS $f$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$f$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comment_updated_at ON social_comments;
CREATE TRIGGER comment_updated_at
    BEFORE UPDATE ON social_comments
    FOR EACH ROW EXECUTE FUNCTION update_comment_timestamp();

-- Auto create notification for comments
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $f$
DECLARE
    post_author UUID;
    comment_author UUID;
BEGIN
    post_author := (SELECT author_id FROM social_posts WHERE id = NEW.post_id);
    comment_author := NEW.author_id;
    
    -- Don't notify if commenting on own post
    IF post_author != comment_author THEN
        INSERT INTO notifications (user_id, type, actor_id, post_id, comment_id, content)
        VALUES (post_author, 'comment', comment_author, NEW.post_id, NEW.id, 
                (SELECT nickname FROM profiles WHERE id = comment_author) || ' đã bình luận: "' || LEFT(NEW.content, 50) || '"');
    END IF;
    
    RETURN NEW;
END;
$f$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_comment ON social_comments;
CREATE TRIGGER on_new_comment
    AFTER INSERT ON social_comments
    FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- Auto create notification for likes
CREATE OR REPLACE FUNCTION notify_on_like_post()
RETURNS TRIGGER AS $f$
DECLARE
    post_author UUID;
    liker_id UUID;
BEGIN
    post_author := (SELECT author_id FROM social_posts WHERE id = NEW.post_id);
    liker_id := NEW.user_id;
    
    IF post_author != liker_id THEN
        INSERT INTO notifications (user_id, type, actor_id, post_id, content)
        VALUES (post_author, 'like_post', liker_id, NEW.post_id,
                (SELECT nickname FROM profiles WHERE id = liker_id) || ' đã thích bài viết của bạn');
    END IF;
    
    RETURN NEW;
END;
$f$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_post ON social_post_likes;
CREATE TRIGGER on_like_post
    AFTER INSERT ON social_post_likes
    FOR EACH ROW EXECUTE FUNCTION notify_on_like_post();

-- Auto create notification for follows
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $f$
DECLARE
    follower_name TEXT;
BEGIN
    follower_name := (SELECT nickname FROM profiles WHERE id = NEW.follower_id);
    
    INSERT INTO notifications (user_id, type, actor_id, content)
    VALUES (NEW.following_id, 'follow', NEW.follower_id, follower_name || ' đã theo dõi bạn');
    
    RETURN NEW;
END;
$f$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_follow ON social_follows;
CREATE TRIGGER on_new_follow
    AFTER INSERT ON social_follows
    FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- Auto update DM read status
CREATE OR REPLACE FUNCTION mark_dm_read()
RETURNS TRIGGER AS $f$
BEGIN
    IF NEW.receiver_id = auth.uid() AND OLD.is_read = FALSE THEN
        NEW.is_read := TRUE;
        NEW.read_at := NOW();
    END IF;
    RETURN NEW;
END;
$f$ LANGUAGE plpgsql;

CREATE POLICY "Users can mark notifications as read" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- 8. CONVERSATIONS LIST (VIEW)
CREATE OR REPLACE VIEW conversations AS
SELECT 
    LEAST(sender_id, receiver_id) as user_a,
    GREATEST(sender_id, receiver_id) as user_b,
    COUNT(*) as message_count,
    MAX(created_at) as last_message_at,
    STRING_AGG(
        CASE WHEN sender_id = LEAST(sender_id, receiver_id) THEN content ELSE NULL END, 
        ' ' ORDER BY created_at DESC
    ) as last_message_preview,
    SUM(CASE WHEN sender_id != LEAST(sender_id, receiver_id) AND is_read = FALSE THEN 1 ELSE 0 END) as unread_count
FROM direct_messages
GROUP BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id);

-- STORAGE BUCKET FOR SOCIAL MEDIA
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'social-media',
  'social-media',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/jpg']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "social_media_public_read" on storage.objects;
create policy "social_media_public_read"
on storage.objects
for select
to public
using (bucket_id = 'social-media');

drop policy if exists "social_media_authenticated_upload" on storage.objects;
create policy "social_media_authenticated_upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'social-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "social_media_authenticated_update" on storage.objects;
create policy "social_media_authenticated_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'social-media'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'social-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "social_media_authenticated_delete" on storage.objects;
create policy "social_media_authenticated_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'social-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto update updated_at for comments
CREATE OR REPLACE FUNCTION update_comment_timestamp()
RETURNS TRIGGER AS $f$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$f$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comment_updated_at ON social_comments;
CREATE TRIGGER comment_updated_at
    BEFORE UPDATE ON social_comments
    FOR EACH ROW EXECUTE FUNCTION update_comment_timestamp();

-- Auto create notification for comments
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $f$
DECLARE
    post_author UUID;
    comment_author UUID;
BEGIN
    post_author := (SELECT author_id FROM social_posts WHERE id = NEW.post_id);
    comment_author := NEW.author_id;
    
    -- Don't notify if commenting on own post
    IF post_author != comment_author THEN
        INSERT INTO notifications (user_id, type, actor_id, post_id, comment_id, content)
        VALUES (post_author, 'comment', comment_author, NEW.post_id, NEW.id, 
                (SELECT nickname FROM profiles WHERE id = comment_author) || ' đã bình luận: "' || LEFT(NEW.content, 50) || '"');
    END IF;
    
    RETURN NEW;
END;
$f$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_comment ON social_comments;
CREATE TRIGGER on_new_comment
    AFTER INSERT ON social_comments
    FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- Auto create notification for likes
CREATE OR REPLACE FUNCTION notify_on_like_post()
RETURNS TRIGGER AS $f$
DECLARE
    post_author UUID;
    liker_id UUID;
BEGIN
    post_author := (SELECT author_id FROM social_posts WHERE id = NEW.post_id);
    liker_id := NEW.user_id;
    
    IF post_author != liker_id THEN
        INSERT INTO notifications (user_id, type, actor_id, post_id, content)
        VALUES (post_author, 'like_post', liker_id, NEW.post_id,
                (SELECT nickname FROM profiles WHERE id = liker_id) || ' đã thích bài viết của bạn');
    END IF;
    
    RETURN NEW;
END;
$f$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_post ON social_post_likes;
CREATE TRIGGER on_like_post
    AFTER INSERT ON social_post_likes
    FOR EACH ROW EXECUTE FUNCTION notify_on_like_post();

-- Auto create notification for follows
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $f$
DECLARE
    follower_name TEXT;
BEGIN
    follower_name := (SELECT nickname FROM profiles WHERE id = NEW.follower_id);
    
    INSERT INTO notifications (user_id, type, actor_id, content)
    VALUES (NEW.following_id, 'follow', NEW.follower_id, follower_name || ' đã theo dõi bạn');
    
    RETURN NEW;
END;
$f$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_follow ON social_follows;
CREATE TRIGGER on_new_follow
    AFTER INSERT ON social_follows
    FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- Auto update DM read status
CREATE OR REPLACE FUNCTION mark_dm_read()
RETURNS TRIGGER AS $f$
BEGIN
    IF NEW.receiver_id = auth.uid() AND OLD.is_read = FALSE THEN
        NEW.is_read := TRUE;
        NEW.read_at := NOW();
    END IF;
    RETURN NEW;
END;
$f$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dm_read_trigger ON direct_messages;
CREATE TRIGGER dm_read_trigger
    BEFORE UPDATE ON direct_messages
    FOR EACH ROW EXECUTE FUNCTION mark_dm_read();

-- REALTIME SUBSCRIPTIONS
ALTER PUBLICATION supabase_realtime ADD TABLE social_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE social_follows;
ALTER PUBLICATION supabase_realtime ADD TABLE social_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE social_post_likes;

-- ============================================
-- DIGIGUARD v3 — MODERATION SYSTEM
-- ============================================

-- 9. PROFILE EXTENSIONS (trust score + account status)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 100;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active'
    CHECK (account_status IN ('active', 'shadowbanned', 'banned'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ;

-- 10. USER PUNISHMENTS (Strike history)
CREATE TABLE IF NOT EXISTS user_punishments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    strike_level INTEGER NOT NULL DEFAULT 1,
    reason TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_punishments_user ON user_punishments(user_id, created_at DESC);

ALTER TABLE user_punishments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own punishments" ON user_punishments
    FOR SELECT USING (user_id = auth.uid());

-- 11. SOCIAL REPORTS (Community flagging with weight)
CREATE TABLE IF NOT EXISTS social_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved_ban', 'resolved_ignored')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_post ON social_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON social_reports(status, created_at DESC);

ALTER TABLE social_reports ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can submit a report
CREATE POLICY "Users can insert reports" ON social_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Only reporter can view own reports
CREATE POLICY "Users can view own reports" ON social_reports
    FOR SELECT USING (reporter_id = auth.uid());

-- AUTO-HIDE: posts with 3+ reports get auto-hidden via DB function
CREATE OR REPLACE FUNCTION auto_hide_reported_post()
RETURNS TRIGGER AS $f$
DECLARE
    report_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO report_count
    FROM social_reports
    WHERE post_id = NEW.post_id AND status = 'pending';

    -- Auto-hide when 3 or more community reports
    IF report_count >= 3 THEN
        UPDATE social_posts
        SET visibility = 'followers'
        WHERE id = NEW.post_id AND author_id != NEW.reporter_id;
    END IF;

    RETURN NEW;
END;
$f$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_report ON social_reports;
CREATE TRIGGER on_new_report
    AFTER INSERT ON social_reports
    FOR EACH ROW EXECUTE FUNCTION auto_hide_reported_post();

-- 12. SUBSCRIPTIONS (Payment logs)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    gateway TEXT NOT NULL, -- 'stripe', 'payos', 'bank_transfer'
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'VND',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    provider_ref TEXT, -- Stripe PaymentIntent ID or PayOS Order ID
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);
