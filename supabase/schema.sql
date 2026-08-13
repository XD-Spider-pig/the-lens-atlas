-- LensAtlas production database schema for Supabase/Postgres
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  bio text default '',
  avatar_url text default '',
  city text default '',
  created_at timestamptz default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text default '',
  location_name text not null,
  city text default '',
  latitude double precision not null,
  longitude double precision not null,
  image_url text not null,
  camera text,
  lens text,
  shutter_speed text,
  aperture text,
  iso integer,
  conditions text,
  tags text[] default '{}',
  location_precision text not null default 'exact' check (location_precision in ('exact','approximate','hidden')),
  status text not null default 'published' check (status in ('published','hidden','removed')),
  created_at timestamptz default now()
);

create table if not exists public.famous_photos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  photographer text not null,
  year integer,
  location_name text not null,
  city text default '',
  latitude double precision not null,
  longitude double precision not null,
  image_url text not null,
  story text default '',
  source_url text,
  rights_note text default '',
  created_at timestamptz default now()
);

create table if not exists public.likes (
  user_id uuid references public.profiles(id) on delete cascade,
  photo_id uuid references public.photos(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, photo_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  photo_id uuid references public.photos(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1200),
  created_at timestamptz default now()
);

create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.saved_spots (
  user_id uuid references public.profiles(id) on delete cascade,
  photo_id uuid references public.photos(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, photo_id)
);

create table if not exists public.shoot_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  description text default '',
  created_at timestamptz default now()
);

create table if not exists public.shoot_list_items (
  shoot_list_id uuid references public.shoot_lists(id) on delete cascade,
  photo_id uuid references public.photos(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (shoot_list_id, photo_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  photo_id uuid references public.photos(id) on delete cascade,
  reason text not null,
  details text default '',
  created_at timestamptz default now()
);

-- Helper view for the map and photo cards.
create or replace view public.photos_view as
select
  p.*, 
  coalesce(pr.display_name, 'Anonymous photographer') as photographer,
  coalesce(pr.username, 'anonymous') as profile_name,
  coalesce((select count(*) from public.likes l where l.photo_id=p.id),0)::int as likes,
  coalesce((select count(*) from public.comments c where c.photo_id=p.id),0)::int as comments,
  'community'::text as type
from public.photos p
left join public.profiles pr on pr.id=p.user_id
where p.status='published';

create or replace function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    regexp_replace(lower(coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1))), '[^a-z0-9_]+', '', 'g') || substr(replace(new.id::text,'-',''),1,5),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1), 'LensAtlas photographer')
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.photos enable row level security;
alter table public.famous_photos enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.saved_spots enable row level security;
alter table public.shoot_lists enable row level security;
alter table public.shoot_list_items enable row level security;
alter table public.reports enable row level security;

create policy "profiles are public" on public.profiles for select using (true);
create policy "users manage own profile" on public.profiles for update using (auth.uid()=id);
create policy "photos are public" on public.photos for select using (status='published' or auth.uid()=user_id);
create policy "users create own photos" on public.photos for insert with check (auth.uid()=user_id);
create policy "users update own photos" on public.photos for update using (auth.uid()=user_id);
create policy "users delete own photos" on public.photos for delete using (auth.uid()=user_id);
create policy "famous photos are public" on public.famous_photos for select using (true);
create policy "likes are public" on public.likes for select using (true);
create policy "users manage own likes" on public.likes for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "comments are public" on public.comments for select using (true);
create policy "users create comments" on public.comments for insert with check (auth.uid()=user_id);
create policy "users delete own comments" on public.comments for delete using (auth.uid()=user_id);
create policy "follows are public" on public.follows for select using (true);
create policy "users manage own follows" on public.follows for all using (auth.uid()=follower_id) with check (auth.uid()=follower_id);
create policy "users manage own saves" on public.saved_spots for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "users manage own lists" on public.shoot_lists for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "list items through own lists" on public.shoot_list_items for all using (exists(select 1 from public.shoot_lists s where s.id=shoot_list_id and s.user_id=auth.uid()));
create policy "users create reports" on public.reports for insert with check (auth.uid()=reporter_id);

-- Storage bucket for public photo delivery. Create the bucket in Dashboard if your project doesn't allow SQL bucket creation.
insert into storage.buckets (id,name,public) values ('photos','photos',true) on conflict (id) do nothing;
create policy "public photo read" on storage.objects for select using (bucket_id='photos');
create policy "user photo uploads" on storage.objects for insert with check (bucket_id='photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "user photo updates" on storage.objects for update using (bucket_id='photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "user photo deletes" on storage.objects for delete using (bucket_id='photos' and auth.uid()::text = (storage.foldername(name))[1]);
