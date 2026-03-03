-- Table for tracking team members invited by employer admins
create table public.employer_team_members (
  id uuid not null default gen_random_uuid(),
  employer_id uuid not null,
  user_id uuid not null,
  first_name text null,
  last_name text null,
  phone text null,
  role text null default 'recruiter'::text,
  permissions text[] null,
  is_active boolean null default true,
  invited_by uuid null,
  joined_at timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  constraint employer_team_members_pkey primary key (id),
  constraint uq_employer_user unique (employer_id, user_id),
  constraint fk_team_member_employer foreign KEY (employer_id) references employers (id) on delete CASCADE,
  constraint fk_team_member_invited_by foreign KEY (invited_by) references users (id) on delete set null,
  constraint fk_team_member_user foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint employer_team_members_role_check check (
    (
      role = any (
        array[
          'admin'::text,
          'recruiter'::text,
          'hiring-manager'::text,
          'viewer'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_team_members_employer_id on public.employer_team_members using btree (employer_id) TABLESPACE pg_default;
create index IF not exists idx_team_members_user_id on public.employer_team_members using btree (user_id) TABLESPACE pg_default;

comment on table public.employer_team_members is 'Tracks which users belong to which employer and who invited them';
