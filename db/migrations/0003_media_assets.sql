create table if not exists media_assets (
  id text primary key,
  storage_key text not null unique,
  file_name text not null,
  content_type text not null,
  size_bytes integer not null,
  created_by text,
  created_at text not null,
  updated_at text not null
);
