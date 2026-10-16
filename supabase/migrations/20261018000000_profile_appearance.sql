-- Appearance & behaviour preferences stored on the profile (owner-only via existing RLS).
alter table public.profiles
  add column if not exists accent text not null default 'teal'
    check (accent in ('teal','indigo','rose','amber','emerald','violet','slate')),
  add column if not exists density text not null default 'comfortable'
    check (density in ('comfortable','compact')),
  add column if not exists text_size text not null default 'md'
    check (text_size in ('sm','md','lg')),
  add column if not exists corners text not null default 'round'
    check (corners in ('sharp','round','pill')),
  add column if not exists time_format text not null default '12h'
    check (time_format in ('12h','24h')),
  add column if not exists calendar_view text not null default 'month'
    check (calendar_view in ('month','week','agenda'));
