-- ============================================================================
-- AI HEALTH RECORDS — COMPLETE SUPABASE DATABASE & PRIVATE STORAGE SETUP
-- Safe to run multiple times (idempotent with IF NOT EXISTS)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade default auth.uid(),
  name text,
  email text,
  phone text,
  date_of_birth date,
  blood_group text,
  city text,
  height text,
  weight text,
  emergency_contact_name text,
  emergency_contact_phone text,
  allergies jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure user_id column exists if table was previously created without it
alter table public.profiles add column if not exists user_id uuid references auth.users (id) on delete cascade default auth.uid();
update public.profiles set user_id = id where user_id is null;

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id or auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id or auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id or auth.uid() = user_id)
  with check (auth.uid() = id or auth.uid() = user_id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles for delete to authenticated
  using (auth.uid() = id or auth.uid() = user_id);

-- Auto-create profile trigger on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, user_id, name, email)
  values (
    new.id,
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'name', '')), ''),
    new.email
  )
  on conflict (id) do update
  set email = excluded.email,
      user_id = excluded.id,
      name = coalesce(public.profiles.name, excluded.name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. HEALTH RECORDS (REPORTS) TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.health_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  title text not null,
  category text default 'Other',
  hospital text,
  record_date date default current_date,
  file_url text,
  file_size bigint default 0,
  status text default 'ready',
  summary_url text,
  extracted_text text,
  created_at timestamptz default now()
);

-- Ensure all columns exist if table was previously partially created
alter table public.health_records add column if not exists file_url text;
alter table public.health_records add column if not exists file_size bigint default 0;
alter table public.health_records add column if not exists status text default 'ready';
alter table public.health_records add column if not exists summary_url text;
alter table public.health_records add column if not exists extracted_text text;

alter table public.health_records enable row level security;

drop policy if exists "Users can view own health records" on public.health_records;
create policy "Users can view own health records"
  on public.health_records for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own health records" on public.health_records;
create policy "Users can insert own health records"
  on public.health_records for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own health records" on public.health_records;
create policy "Users can update own health records"
  on public.health_records for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own health records" on public.health_records;
create policy "Users can delete own health records"
  on public.health_records for delete to authenticated
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. AI EXPLANATIONS TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.ai_explanations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  record_id uuid not null references public.health_records (id) on delete cascade,
  overview text,
  simple_explanation text,
  disclaimer text default 'This explanation is for informational purposes only. Always consult a qualified healthcare professional.',
  created_at timestamptz default now()
);

alter table public.ai_explanations enable row level security;

drop policy if exists "Users can view own ai explanations" on public.ai_explanations;
create policy "Users can view own ai explanations"
  on public.ai_explanations for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own ai explanations" on public.ai_explanations;
create policy "Users can insert own ai explanations"
  on public.ai_explanations for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own ai explanations" on public.ai_explanations;
create policy "Users can update own ai explanations"
  on public.ai_explanations for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own ai explanations" on public.ai_explanations;
create policy "Users can delete own ai explanations"
  on public.ai_explanations for delete to authenticated
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. MEDICINE REMINDERS TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.medicine_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  dosage text,
  frequency text,
  period text default 'Morning',
  time text,
  meal_instruction text,
  purpose text,
  active boolean default true,
  taken_today boolean default false,
  last_taken_date date,
  created_at timestamptz default now()
);

alter table public.medicine_reminders enable row level security;

drop policy if exists "Users can view own medicine reminders" on public.medicine_reminders;
create policy "Users can view own medicine reminders"
  on public.medicine_reminders for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own medicine reminders" on public.medicine_reminders;
create policy "Users can insert own medicine reminders"
  on public.medicine_reminders for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own medicine reminders" on public.medicine_reminders;
create policy "Users can update own medicine reminders"
  on public.medicine_reminders for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own medicine reminders" on public.medicine_reminders;
create policy "Users can delete own medicine reminders"
  on public.medicine_reminders for delete to authenticated
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5. HEALTHCARE INQUIRIES TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.healthcare_inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  related_record_id uuid references public.health_records (id) on delete set null,
  subject text not null,
  category text,
  reference_provider text,
  message text not null,
  status text default 'Pending',
  response_text text,
  response_date timestamptz,
  created_at timestamptz default now()
);

alter table public.healthcare_inquiries enable row level security;

drop policy if exists "Users can view own healthcare inquiries" on public.healthcare_inquiries;
create policy "Users can view own healthcare inquiries"
  on public.healthcare_inquiries for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own healthcare inquiries" on public.healthcare_inquiries;
create policy "Users can insert own healthcare inquiries"
  on public.healthcare_inquiries for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own healthcare inquiries" on public.healthcare_inquiries;
create policy "Users can update own healthcare inquiries"
  on public.healthcare_inquiries for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own healthcare inquiries" on public.healthcare_inquiries;
create policy "Users can delete own healthcare inquiries"
  on public.healthcare_inquiries for delete to authenticated
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6. PRIVATE STORAGE BUCKET FOR PATIENT MEDICAL REPORT PDFS
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('health_reports', 'health_reports', false, 10485760, array['application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf'];

-- Clean up any obsolete public or broad policies
drop policy if exists "Public read health reports" on storage.objects;
drop policy if exists "Authenticated users can upload health reports" on storage.objects;
drop policy if exists "Authenticated users can read health reports" on storage.objects;
drop policy if exists "Authenticated users can delete own health reports" on storage.objects;
drop policy if exists "Users can view own storage objects" on storage.objects;
drop policy if exists "Users can upload own storage objects" on storage.objects;
drop policy if exists "Users can update own storage objects" on storage.objects;
drop policy if exists "Users can delete own storage objects" on storage.objects;

-- Strict user-isolated policies: each user can access only their own files
create policy "Users can view own storage objects"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'health_reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can upload own storage objects"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'health_reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own storage objects"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'health_reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'health_reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own storage objects"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'health_reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
