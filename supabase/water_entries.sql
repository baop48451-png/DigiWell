-- ============================================================================
-- WATER_ENTRIES TABLE
-- Lưu trữ chi tiết từng lần uống nước (thay vì chỉ tổng ml theo ngày)
-- ============================================================================

create table if not exists public.water_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null,                          -- Dung tích gốc (vd: 250ml)
  actual_ml integer not null,                      -- Dung tích thực sau factor (vd: 250ml)
  name text not null default 'Nước lọc',           -- Tên loại đồ uống
  timestamp timestamptz not null default timezone('utc', now()),
  day date not null,                               -- Ngày (để query nhanh)
  created_at timestamptz not null default timezone('utc', now())
);

-- Index để query nhanh theo user + day
create index if not exists water_entries_user_day_idx
  on public.water_entries (user_id, day, timestamp desc);

-- Index để sync realtime (theo dõi thay đổi)
create index if not exists water_entries_created_at_idx
  on public.water_entries (created_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.water_entries enable row level security;

-- Mọi user chỉ đọc được entries của chính mình
drop policy if exists "water_entries_select_own" on public.water_entries;
create policy "water_entries_select_own"
on public.water_entries
for select
to authenticated
using (auth.uid() = user_id);

-- Chỉ cho phép insert entries của chính mình
drop policy if exists "water_entries_insert_own" on public.water_entries;
create policy "water_entries_insert_own"
on public.water_entries
for insert
to authenticated
with check (auth.uid() = user_id);

-- Chỉ cho phép update entries của chính mình
drop policy if exists "water_entries_update_own" on public.water_entries;
create policy "water_entries_update_own"
on public.water_entries
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Chỉ cho phép delete entries của chính mình
drop policy if exists "water_entries_delete_own" on public.water_entries;
create policy "water_entries_delete_own"
on public.water_entries
for delete
to authenticated
using (auth.uid() = user_id);

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- Bật realtime cho phép đồng bộ tức thì giữa các thiết bị (như Messenger)
-- ============================================================================

-- Kích hoạt Realtime trên bảng water_entries
alter publication supabase_realtime add table public.water_entries;

-- ============================================================================
-- OPTIONAL: Trigger để tự động cập nhật water_logs.total khi có entry mới
-- (Giữ lại để tương thích ngược với code cũ)
-- ============================================================================

create or replace function public.update_water_logs_total()
returns trigger language plpgsql security definer as $$
declare
  v_total integer;
begin
  -- Tính tổng ml trong ngày
  select coalesce(sum(actual_ml), 0) into v_total
  from public.water_entries
  where user_id = NEW.user_id and day = NEW.day;

  -- Upsert vào water_logs
  insert into public.water_logs (user_id, day, intake_ml)
  values (NEW.user_id, NEW.day, v_total)
  on conflict (user_id, day)
  do update set intake_ml = v_total, updated_at = timezone('utc', now());

  return NEW;
end;
$$;

drop trigger if exists water_entries_after_insert on public.water_entries;
create trigger water_entries_after_insert
  after insert on public.water_entries
  for each row execute function public.update_water_logs_total();

-- Trigger cho delete
create or replace function public.update_water_logs_total_on_delete()
returns trigger language plpgsql security definer as $$
declare
  v_total integer;
begin
  select coalesce(sum(actual_ml), 0) into v_total
  from public.water_entries
  where user_id = OLD.user_id and day = OLD.day;

  update public.water_logs
  set intake_ml = v_total, updated_at = timezone('utc', now())
  where user_id = OLD.user_id and day = OLD.day;

  return OLD;
end;
$$;

drop trigger if exists water_entries_after_delete on public.water_entries;
create trigger water_entries_after_delete
  after delete on public.water_entries
  for each row execute function public.update_water_logs_total_on_delete();

-- ============================================================================
-- ĐẢM BẢO water_logs ĐÃ TỒN TẠI VÀ CÓ TRƯỜNG updated_at
-- ============================================================================

alter table public.water_logs drop column if exists updated_at;
alter table public.water_logs add column if not exists updated_at timestamptz default timezone('utc', now());
