create extension if not exists pgcrypto;

comment on schema public is 'Default application schema used by DigiWell.';

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.ai_conversations is 'Lightweight AI conversation history owned by each authenticated DigiWell user.';
comment on column public.ai_conversations.user_id is 'Owner of the conversation. Mirrors auth.users via public.profiles(id).';
comment on column public.ai_conversations.title is 'Optional short title shown in future UI lists.';
comment on column public.ai_conversations.context is 'Optional JSON snapshot for lightweight AI memory, such as hydration context.';
comment on column public.ai_conversations.created_at is 'UTC timestamp when the conversation was created.';

create index if not exists ai_conversations_user_created_idx
  on public.ai_conversations (user_id, created_at desc);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null
    check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.ai_messages is 'Message-level history for DigiWell AI chat and future memory features.';
comment on column public.ai_messages.conversation_id is 'Parent conversation for grouping chat history.';
comment on column public.ai_messages.user_id is 'Owner of the message. Must match the authenticated user.';
comment on column public.ai_messages.role is 'Message speaker role. Limited to user, assistant, or system.';
comment on column public.ai_messages.content is 'Plain text AI or user message content.';
comment on column public.ai_messages.metadata is 'Optional structured JSON such as tool-call results, hydration actions, or image-scan info.';
comment on column public.ai_messages.created_at is 'UTC timestamp when the message was stored.';

create index if not exists ai_messages_conversation_created_idx
  on public.ai_messages (conversation_id, created_at asc);

create index if not exists ai_messages_user_created_idx
  on public.ai_messages (user_id, created_at desc);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

drop policy if exists "ai_conversations_select_own" on public.ai_conversations;
create policy "ai_conversations_select_own"
on public.ai_conversations
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "ai_conversations_insert_own" on public.ai_conversations;
create policy "ai_conversations_insert_own"
on public.ai_conversations
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "ai_conversations_update_own" on public.ai_conversations;
create policy "ai_conversations_update_own"
on public.ai_conversations
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "ai_conversations_delete_own" on public.ai_conversations;
create policy "ai_conversations_delete_own"
on public.ai_conversations
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "ai_messages_select_own" on public.ai_messages;
create policy "ai_messages_select_own"
on public.ai_messages
for select
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.ai_conversations
    where ai_conversations.id = ai_messages.conversation_id
      and ai_conversations.user_id = auth.uid()
  )
);

drop policy if exists "ai_messages_insert_own" on public.ai_messages;
create policy "ai_messages_insert_own"
on public.ai_messages
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.ai_conversations
    where ai_conversations.id = ai_messages.conversation_id
      and ai_conversations.user_id = auth.uid()
  )
);

drop policy if exists "ai_messages_update_own" on public.ai_messages;
create policy "ai_messages_update_own"
on public.ai_messages
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.ai_conversations
    where ai_conversations.id = ai_messages.conversation_id
      and ai_conversations.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.ai_conversations
    where ai_conversations.id = ai_messages.conversation_id
      and ai_conversations.user_id = auth.uid()
  )
);

drop policy if exists "ai_messages_delete_own" on public.ai_messages;
create policy "ai_messages_delete_own"
on public.ai_messages
for delete
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.ai_conversations
    where ai_conversations.id = ai_messages.conversation_id
      and ai_conversations.user_id = auth.uid()
  )
);