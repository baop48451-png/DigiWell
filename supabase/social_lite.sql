create extension if not exists pgcrypto;

create table if not exists public.social_follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (follower_id, following_id),
  constraint social_follows_no_self_follow check (follower_id <> following_id)
);

create index if not exists social_follows_following_idx
  on public.social_follows (following_id);

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

create table if not exists public.social_post_likes (
  post_id uuid not null references public.social_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

create index if not exists social_post_likes_user_idx
  on public.social_post_likes (user_id);

alter table public.social_follows enable row level security;
alter table public.social_posts enable row level security;
alter table public.social_post_likes enable row level security;

drop policy if exists "social_follows_select_authenticated" on public.social_follows;
create policy "social_follows_select_authenticated"
on public.social_follows
for select
to authenticated
using (true);

drop policy if exists "social_follows_insert_own" on public.social_follows;
create policy "social_follows_insert_own"
on public.social_follows
for insert
to authenticated
with check (auth.uid() = follower_id);

drop policy if exists "social_follows_delete_own" on public.social_follows;
create policy "social_follows_delete_own"
on public.social_follows
for delete
to authenticated
using (auth.uid() = follower_id);

drop policy if exists "social_posts_select_visible" on public.social_posts;
create policy "social_posts_select_visible"
on public.social_posts
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

drop policy if exists "social_posts_insert_own" on public.social_posts;
create policy "social_posts_insert_own"
on public.social_posts
for insert
to authenticated
with check (auth.uid() = author_id);

drop policy if exists "social_posts_update_own" on public.social_posts;
create policy "social_posts_update_own"
on public.social_posts
for update
to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

drop policy if exists "social_posts_delete_own" on public.social_posts;
create policy "social_posts_delete_own"
on public.social_posts
for delete
to authenticated
using (auth.uid() = author_id);

drop policy if exists "social_post_likes_select_authenticated" on public.social_post_likes;
create policy "social_post_likes_select_authenticated"
on public.social_post_likes
for select
to authenticated
using (true);

drop policy if exists "social_post_likes_insert_own" on public.social_post_likes;
create policy "social_post_likes_insert_own"
on public.social_post_likes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "social_post_likes_delete_own" on public.social_post_likes;
create policy "social_post_likes_delete_own"
on public.social_post_likes
for delete
to authenticated
using (auth.uid() = user_id);

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
