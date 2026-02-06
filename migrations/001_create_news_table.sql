-- Create news table
create table public.news (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  summary text not null,
  content text not null,
  image_url text,
  active boolean default true,
  published_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.news enable row level security;

-- Create policies
create policy "Public items are viewable by everyone"
  on public.news for select
  using ( true );

create policy "Admins can insert news"
  on public.news for insert
  with check ( auth.role() = 'authenticated' );

create policy "Admins can update news"
  on public.news for update
  using ( auth.role() = 'authenticated' );

create policy "Admins can delete news"
  on public.news for delete
  using ( auth.role() = 'authenticated' );
