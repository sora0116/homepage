alter table posts add column visibility text not null default 'public' check (visibility in ('public', 'private'));

update posts set visibility = 'public' where visibility is null or visibility = '';
