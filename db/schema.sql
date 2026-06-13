create table if not exists posts (
  id text primary key,
  slug text not null unique,
  title text not null,
  description text not null,
  body text not null,
  status text not null check (status in ('draft', 'published')),
  published_at text not null,
  updated_at text not null,
  tags_json text
);

create table if not exists works (
  id text primary key,
  slug text not null unique,
  title text not null,
  summary text not null,
  body text not null,
  status text not null check (status in ('draft', 'published')),
  published_at text not null,
  updated_at text not null,
  tags_json text,
  links_json text,
  featured integer not null default 0
);

create table if not exists site_settings (
  key text primary key,
  value_json text not null,
  updated_at text not null
);

create table if not exists inquiries (
  id text primary key,
  name text not null,
  email text not null,
  message text not null,
  status text not null check (status in ('new', 'in_progress', 'replied', 'archived')),
  source text not null,
  created_at text not null,
  updated_at text not null
);
