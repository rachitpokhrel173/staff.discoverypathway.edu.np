-- ============================================================
-- DISCOVERY PATHWAY — STAFF MANAGEMENT SYSTEM
-- Supabase Database Setup
-- Run this ONCE in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. PROFILES TABLE ──────────────────────────────────────
-- Linked 1:1 to auth.users. Holds role + approval status + HR info.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  emp_id text unique,                     -- e.g. DP001 (assigned on approval)
  full_name text not null,
  email text not null,
  phone text,
  department text,
  job_title text,
  employment_type text default 'Full-Time',
  start_date date,
  emergency_contact text,
  emergency_phone text,
  address text,
  photo_url text,
  role text not null default 'staff' check (role in ('staff','admin')),
  status text not null default 'pending' check (status in ('pending','active','on_leave','resigned','terminated','rejected')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── 2. ATTENDANCE TABLE ────────────────────────────────────
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  work_date date not null default current_date,
  check_in timestamptz,
  check_out timestamptz,
  check_in_lat double precision,
  check_in_lng double precision,
  check_out_lat double precision,
  check_out_lng double precision,
  status text default 'present' check (status in ('present','absent','half_day','on_leave','holiday')),
  leave_type text check (leave_type in ('annual','sick','unpaid', null)),
  overtime_hours numeric default 0,
  notes text,
  edited_by_admin boolean default false,
  created_at timestamptz default now(),
  unique(user_id, work_date)
);

-- ── 3. SALARY / PAYSLIPS TABLE ─────────────────────────────
create table if not exists public.payslips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pay_month text not null,                -- e.g. "June 2025"
  pay_period_start date,
  pay_period_end date,
  basic_salary numeric not null default 0,
  allowances numeric not null default 0,
  bonus numeric not null default 0,
  tax_deduction numeric not null default 0,
  ssf_pf numeric not null default 0,
  other_deductions numeric not null default 0,
  gross_pay numeric generated always as (basic_salary + allowances + bonus) stored,
  net_pay numeric generated always as (basic_salary + allowances + bonus - tax_deduction - ssf_pf - other_deductions) stored,
  payment_date date,
  payment_method text default 'Bank Transfer',
  status text default 'paid' check (status in ('draft','paid','pending')),
  generated_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  unique(user_id, pay_month)
);

-- ── 4. PERFORMANCE REVIEWS TABLE ───────────────────────────
create table if not exists public.performance_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  review_period text not null,
  kpi_score int check (kpi_score between 1 and 5),
  punctuality_score int check (punctuality_score between 1 and 5),
  teamwork_score int check (teamwork_score between 1 and 5),
  quality_score int check (quality_score between 1 and 5),
  manager_notes text,
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- ── 5. AUTO-CREATE PROFILE ON SIGNUP ───────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.email,
    'staff',
    'pending'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 6. ENABLE ROW LEVEL SECURITY ───────────────────────────
alter table public.profiles enable row level security;
alter table public.attendance enable row level security;
alter table public.payslips enable row level security;
alter table public.performance_reviews enable row level security;

-- Helper function: is the current user an admin?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$ language sql security definer stable;

-- ── 7. POLICIES: PROFILES ──────────────────────────────────
drop policy if exists "view own or admin views all profiles" on public.profiles;
create policy "view own or admin views all profiles"
  on public.profiles for select
  using ( auth.uid() = id or public.is_admin() );

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update
  using ( auth.uid() = id or public.is_admin() );

drop policy if exists "admin can insert profiles" on public.profiles;
create policy "admin can insert profiles"
  on public.profiles for insert
  with check ( auth.uid() = id or public.is_admin() );

drop policy if exists "admin can delete profiles" on public.profiles;
create policy "admin can delete profiles"
  on public.profiles for delete
  using ( public.is_admin() );

-- ── 8. POLICIES: ATTENDANCE ────────────────────────────────
drop policy if exists "view own or admin views all attendance" on public.attendance;
create policy "view own or admin views all attendance"
  on public.attendance for select
  using ( auth.uid() = user_id or public.is_admin() );

drop policy if exists "staff insert own attendance" on public.attendance;
create policy "staff insert own attendance"
  on public.attendance for insert
  with check ( auth.uid() = user_id or public.is_admin() );

drop policy if exists "staff update own or admin updates any attendance" on public.attendance;
create policy "staff update own or admin updates any attendance"
  on public.attendance for update
  using ( auth.uid() = user_id or public.is_admin() );

drop policy if exists "admin deletes attendance" on public.attendance;
create policy "admin deletes attendance"
  on public.attendance for delete
  using ( public.is_admin() );

-- ── 9. POLICIES: PAYSLIPS ──────────────────────────────────
drop policy if exists "view own or admin views all payslips" on public.payslips;
create policy "view own or admin views all payslips"
  on public.payslips for select
  using ( auth.uid() = user_id or public.is_admin() );

drop policy if exists "admin manages payslips insert" on public.payslips;
create policy "admin manages payslips insert"
  on public.payslips for insert
  with check ( public.is_admin() );

drop policy if exists "admin manages payslips update" on public.payslips;
create policy "admin manages payslips update"
  on public.payslips for update
  using ( public.is_admin() );

drop policy if exists "admin manages payslips delete" on public.payslips;
create policy "admin manages payslips delete"
  on public.payslips for delete
  using ( public.is_admin() );

-- ── 10. POLICIES: PERFORMANCE REVIEWS ──────────────────────
drop policy if exists "view own or admin views all reviews" on public.performance_reviews;
create policy "view own or admin views all reviews"
  on public.performance_reviews for select
  using ( auth.uid() = user_id or public.is_admin() );

drop policy if exists "admin manages reviews insert" on public.performance_reviews;
create policy "admin manages reviews insert"
  on public.performance_reviews for insert
  with check ( public.is_admin() );

drop policy if exists "admin manages reviews update" on public.performance_reviews;
create policy "admin manages reviews update"
  on public.performance_reviews for update
  using ( public.is_admin() );

drop policy if exists "admin manages reviews delete" on public.performance_reviews;
create policy "admin manages reviews delete"
  on public.performance_reviews for delete
  using ( public.is_admin() );

-- ============================================================
-- 11. ADVANCED PROFILE FIELDS (migration — safe to re-run)
-- ============================================================
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists date_of_birth date;
alter table public.profiles add column if not exists blood_group text;
alter table public.profiles add column if not exists marital_status text;
alter table public.profiles add column if not exists nationality text default 'Nepali';
alter table public.profiles add column if not exists citizenship_no text;
alter table public.profiles add column if not exists pan_no text;
alter table public.profiles add column if not exists education text;
alter table public.profiles add column if not exists bank_name text;
alter table public.profiles add column if not exists bank_account_no text;
alter table public.profiles add column if not exists bank_branch text;
alter table public.profiles add column if not exists family_members jsonb default '[]'::jsonb;

-- ============================================================
-- DONE. Next step: make yourself admin.
-- 1. Sign up through the app first (creates your profile as 'pending' staff)
-- 2. Then run this (replace with YOUR email):
--
--    update public.profiles
--    set role = 'admin', status = 'active', emp_id = 'DP001'
--    where email = 'your-email@example.com';
--
-- ============================================================
