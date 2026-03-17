create table if not exists public.user_settings (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.users (id) on delete cascade,
	timezone text,
	reminder_time time not null default '18:00'::time,
	weekly_summary_day text not null default 'monday',
	notify_recovery boolean not null default true,
	notify_goals boolean not null default true,
	notify_nutrition boolean not null default true,
	notify_summaries boolean not null default true,
	notify_devices boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint user_settings_user_id_key unique (user_id),
	constraint user_settings_weekly_summary_day_check check (
		weekly_summary_day in (
			'monday',
			'tuesday',
			'wednesday',
			'thursday',
			'friday',
			'saturday',
			'sunday'
		)
	)
);

create table if not exists public.daily_user_metrics (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.users (id) on delete cascade,
	metric_date date not null,
	timezone text not null default 'UTC',
	active_wearable_provider text,
	sync_freshness text not null default 'not_connected',
	sleep_hours numeric,
	sleep_score integer,
	readiness_score integer,
	steps integer,
	active_calories integer,
	workout_count integer not null default 0,
	workout_duration_minutes integer not null default 0,
	calories_logged integer not null default 0,
	protein_logged integer not null default 0,
	calorie_goal_met boolean not null default false,
	protein_goal_met boolean not null default false,
	challenge_tasks_completed integer not null default 0,
	challenge_tasks_target integer not null default 0,
	challenge_goal_met boolean not null default false,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint daily_user_metrics_user_date_key unique (user_id, metric_date),
	constraint daily_user_metrics_active_wearable_provider_check check (
		active_wearable_provider is null
		or active_wearable_provider in ('oura', 'whoop')
	),
	constraint daily_user_metrics_sync_freshness_check check (
		sync_freshness in (
			'not_connected',
			'syncing',
			'baseline_forming',
			'ready',
			'stale',
			'blocked'
		)
	)
);

create table if not exists public.user_notifications (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.users (id) on delete cascade,
	type text not null,
	title text not null,
	body text not null,
	cta_label text,
	cta_href text,
	dedupe_key text,
	is_read boolean not null default false,
	read_at timestamptz,
	expires_at timestamptz,
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint user_notifications_type_check check (
		type in (
			'sync_complete',
			'sync_stale',
			'baseline_ready',
			'goal_hit',
			'goal_missed_risk',
			'protein_gap',
			'workout_streak',
			'recovery_low',
			'weekly_summary'
		)
	)
);

create index if not exists idx_daily_user_metrics_user_date
	on public.daily_user_metrics (user_id, metric_date desc);

create index if not exists idx_user_notifications_user_created
	on public.user_notifications (user_id, created_at desc);

create unique index if not exists idx_user_notifications_user_dedupe
	on public.user_notifications (user_id, dedupe_key)
	where dedupe_key is not null;

alter table public.user_settings enable row level security;
alter table public.daily_user_metrics enable row level security;
alter table public.user_notifications enable row level security;

drop policy if exists "Users manage own user_settings" on public.user_settings;
create policy "Users manage own user_settings"
	on public.user_settings
	for all
	using (
		user_id in (
			select id
			from public.users
			where clerk_id = (auth.jwt() ->> 'sub')
		)
	)
	with check (
		user_id in (
			select id
			from public.users
			where clerk_id = (auth.jwt() ->> 'sub')
		)
	);

drop policy if exists "Users manage own daily_user_metrics" on public.daily_user_metrics;
create policy "Users manage own daily_user_metrics"
	on public.daily_user_metrics
	for all
	using (
		user_id in (
			select id
			from public.users
			where clerk_id = (auth.jwt() ->> 'sub')
		)
	)
	with check (
		user_id in (
			select id
			from public.users
			where clerk_id = (auth.jwt() ->> 'sub')
		)
	);

drop policy if exists "Users manage own user_notifications" on public.user_notifications;
create policy "Users manage own user_notifications"
	on public.user_notifications
	for all
	using (
		user_id in (
			select id
			from public.users
			where clerk_id = (auth.jwt() ->> 'sub')
		)
	)
	with check (
		user_id in (
			select id
			from public.users
			where clerk_id = (auth.jwt() ->> 'sub')
		)
	);

do $$
begin
	if not exists (
		select 1
		from pg_trigger
		where tgname = 'update_user_settings_updated_at'
	) then
		create trigger update_user_settings_updated_at
			before update on public.user_settings
			for each row
			execute function public.update_updated_at_column();
	end if;

	if not exists (
		select 1
		from pg_trigger
		where tgname = 'update_daily_user_metrics_updated_at'
	) then
		create trigger update_daily_user_metrics_updated_at
			before update on public.daily_user_metrics
			for each row
			execute function public.update_updated_at_column();
	end if;

	if not exists (
		select 1
		from pg_trigger
		where tgname = 'update_user_notifications_updated_at'
	) then
		create trigger update_user_notifications_updated_at
			before update on public.user_notifications
			for each row
			execute function public.update_updated_at_column();
	end if;
end
$$;
