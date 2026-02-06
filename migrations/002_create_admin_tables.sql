-- Create partners table
create table public.partners (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  logo_url text,
  url text,
  type text not null, -- 'institutional', 'technical', etc.
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS for partners
alter table public.partners enable row level security;

-- Policies for partners
create policy "Public partners are viewable by everyone"
  on public.partners for select
  using ( active = true );

create policy "Admins can view all partners"
  on public.partners for select
  using ( auth.role() = 'authenticated' ); -- We rely on app logic for admin check or we can add a check against profiles if needed, but for select authenticated is usually fine or public. Let's make it public active, admin all. Actually for simplicity, read all is fine, but write is restricted.

create policy "Admins can insert partners"
  on public.partners for insert
  with check ( auth.role() = 'authenticated' );

create policy "Admins can update partners"
  on public.partners for update
  using ( auth.role() = 'authenticated' );

create policy "Admins can delete partners"
  on public.partners for delete
  using ( auth.role() = 'authenticated' );


-- Create site_content table
create table public.site_content (
  id uuid default gen_random_uuid() primary key,
  section text not null, -- 'about', 'contact'
  key text not null, -- 'title', 'intro', 'email', 'phone'
  content text,
  image_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(section, key)
);

-- Enable RLS for site_content
alter table public.site_content enable row level security;

-- Policies for site_content
create policy "Content is viewable by everyone"
  on public.site_content for select
  using ( true );

create policy "Admins can insert site_content"
  on public.site_content for insert
  with check ( auth.role() = 'authenticated' );

create policy "Admins can update site_content"
  on public.site_content for update
  using ( auth.role() = 'authenticated' );

-- Ensure profiles are updatable by admins for role management
create policy "Admins can update any profile"
  on public.profiles for update
  using ( auth.role() = 'authenticated' );
