# Supabase Database Schema

This document describes the current Supabase database schema for the Fitness Tracker App.

## Tables

### `public.users`

Stores user information synced from Clerk authentication.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `clerk_id` | `text` | NO | - | Clerk user ID (unique) |
| `email` | `text` | YES | - | User's email address |
| `first_name` | `text` | YES | - | User's first name |
| `last_name` | `text` | YES | - | User's last name |
| `created_at` | `timestamptz` | YES | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | YES | `now()` | Last update timestamp |

**Primary Key:** `id`

**Unique Constraints:**
- `clerk_id` (unique index: `users_clerk_id_key`)

**RLS Enabled:** Yes

---

### `public.oauth_connections`

Stores OAuth tokens and connection metadata for third-party integrations (e.g. WHOOP, Oura).

> Note: This table is intended to be accessed **server-side only** using the Supabase service role key.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `provider` | `text` | NO | - | Integration provider (`whoop`, `oura`) |
| `provider_user_id` | `text` | YES | - | Provider user identifier |
| `access_token` | `text` | NO | - | OAuth access token |
| `refresh_token` | `text` | YES | - | OAuth refresh token |
| `token_type` | `text` | YES | - | OAuth token type (e.g. `bearer`) |
| `scope` | `text` | YES | - | Granted scopes (space-separated) |
| `access_token_expires_at` | `timestamptz` | YES | - | Access token expiry timestamp |
| `refresh_token_expires_at` | `timestamptz` | YES | - | Refresh token expiry timestamp |
| `created_at` | `timestamptz` | YES | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | YES | `now()` | Last update timestamp |

**Primary Key:** `id`

**Check Constraints:**
- `provider IN ('whoop', 'oura')`

**Unique Constraints:**
- `(user_id, provider)` — `oauth_connections_user_provider_key`
- `(provider, provider_user_id)` where `provider_user_id IS NOT NULL` — `oauth_connections_provider_provider_user_id_key`

**RLS Enabled:** Yes (no policies; service role access only)

---

### `public.whoop_profile`

Stores the connected WHOOP member profile.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` (unique, one-to-one) |
| `whoop_user_id` | `text` | NO | - | WHOOP user identifier |
| `email` | `text` | NO | - | WHOOP account email |
| `first_name` | `text` | NO | - | First name |
| `last_name` | `text` | NO | - | Last name |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Primary Key:** `id`

**Unique Constraints:**
- `(user_id)` — `whoop_profile_user_id_key`
- `(whoop_user_id)` — `whoop_profile_whoop_user_id_key`

**Foreign Keys:**
- `user_id` -> `public.users.id` (ON DELETE CASCADE)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `whoop_profile_pkey` | UNIQUE | `id` |
| `whoop_profile_user_id_key` | UNIQUE | `user_id` |
| `whoop_profile_whoop_user_id_key` | UNIQUE | `whoop_user_id` |

**RLS Policies:**

| Policy Name | Permission | Roles | Command | Condition |
|-------------|------------|-------|---------|-----------|
| `whoop_profile_select_own` | PERMISSIVE | `authenticated` | SELECT | `EXISTS (SELECT 1 FROM public.users u WHERE u.id = whoop_profile.user_id AND u.clerk_id = (auth.jwt() ->> 'sub'))` |

**Triggers:**
- `update_whoop_profile_updated_at` — BEFORE UPDATE — `EXECUTE FUNCTION update_updated_at_column()`

**RLS Enabled:** Yes

---

### `public.whoop_body_measurement`

Stores the latest WHOOP body measurement snapshot.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` (unique, one-to-one) |
| `height_meter` | `numeric` | YES | - | Height in meters |
| `weight_kilogram` | `numeric` | YES | - | Weight in kilograms |
| `max_heart_rate` | `integer` | YES | - | WHOOP-calculated max heart rate |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Primary Key:** `id`

**Unique Constraints:** `(user_id)` — `whoop_body_measurement_user_id_key`

**Foreign Keys:**
- `user_id` -> `public.users.id` (ON DELETE CASCADE)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `whoop_body_measurement_pkey` | UNIQUE | `id` |
| `whoop_body_measurement_user_id_key` | UNIQUE | `user_id` |

**RLS Policies:**

| Policy Name | Permission | Roles | Command | Condition |
|-------------|------------|-------|---------|-----------|
| `whoop_body_measurement_select_own` | PERMISSIVE | `authenticated` | SELECT | `EXISTS (SELECT 1 FROM public.users u WHERE u.id = whoop_body_measurement.user_id AND u.clerk_id = (auth.jwt() ->> 'sub'))` |

**Triggers:**
- `update_whoop_body_measurement_updated_at` — BEFORE UPDATE — `EXECUTE FUNCTION update_updated_at_column()`

**RLS Enabled:** Yes

---

### `public.whoop_cycles`

Stores WHOOP physiological cycle records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `whoop_cycle_id` | `text` | NO | - | WHOOP cycle identifier |
| `whoop_user_id` | `text` | NO | - | WHOOP user identifier |
| `whoop_created_at` | `timestamptz` | NO | - | Provider record creation time |
| `whoop_updated_at` | `timestamptz` | NO | - | Provider record update time |
| `start_at` | `timestamptz` | NO | - | Cycle start time |
| `end_at` | `timestamptz` | YES | - | Cycle end time |
| `timezone_offset` | `text` | YES | - | Original timezone offset |
| `score_state` | `text` | YES | - | WHOOP score state |
| `strain` | `numeric` | YES | - | Cycle strain |
| `kilojoule` | `numeric` | YES | - | Energy expenditure in kilojoules |
| `average_heart_rate` | `integer` | YES | - | Average heart rate |
| `max_heart_rate` | `integer` | YES | - | Max heart rate |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Primary Key:** `id`

**Unique Constraints:** `(user_id, whoop_cycle_id)` — `whoop_cycles_user_cycle_key`

**Foreign Keys:**
- `user_id` -> `public.users.id` (ON DELETE CASCADE)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `whoop_cycles_pkey` | UNIQUE | `id` |
| `whoop_cycles_user_cycle_key` | UNIQUE | `user_id, whoop_cycle_id` |
| `whoop_cycles_user_start_idx` | BTREE | `user_id, start_at DESC` |
| `whoop_cycles_user_updated_idx` | BTREE | `user_id, whoop_updated_at DESC` |

**RLS Policies:**

| Policy Name | Permission | Roles | Command | Condition |
|-------------|------------|-------|---------|-----------|
| `whoop_cycles_select_own` | PERMISSIVE | `authenticated` | SELECT | `EXISTS (SELECT 1 FROM public.users u WHERE u.id = whoop_cycles.user_id AND u.clerk_id = (auth.jwt() ->> 'sub'))` |

**Triggers:**
- `update_whoop_cycles_updated_at` — BEFORE UPDATE — `EXECUTE FUNCTION update_updated_at_column()`

**RLS Enabled:** Yes

---

### `public.whoop_sleeps`

Stores WHOOP sleep activities.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `whoop_sleep_id` | `text` | NO | - | WHOOP sleep identifier |
| `whoop_v1_sleep_id` | `text` | YES | - | Legacy v1 sleep identifier |
| `whoop_cycle_id` | `text` | NO | - | Related WHOOP cycle identifier |
| `whoop_user_id` | `text` | NO | - | WHOOP user identifier |
| `whoop_created_at` | `timestamptz` | NO | - | Provider record creation time |
| `whoop_updated_at` | `timestamptz` | NO | - | Provider record update time |
| `start_at` | `timestamptz` | NO | - | Sleep start time |
| `end_at` | `timestamptz` | NO | - | Sleep end time |
| `timezone_offset` | `text` | YES | - | Original timezone offset |
| `is_nap` | `boolean` | YES | - | Nap flag |
| `score_state` | `text` | YES | - | WHOOP score state |
| `baseline_milli` | `integer` | YES | - | Baseline sleep need |
| `need_from_sleep_debt_milli` | `integer` | YES | - | Extra need from sleep debt |
| `need_from_recent_strain_milli` | `integer` | YES | - | Extra need from recent strain |
| `need_from_recent_nap_milli` | `integer` | YES | - | Sleep-need reduction from naps |
| `respiratory_rate` | `numeric` | YES | - | Respiratory rate |
| `sleep_performance_percentage` | `numeric` | YES | - | Sleep performance percentage |
| `sleep_consistency_percentage` | `numeric` | YES | - | Sleep consistency percentage |
| `sleep_efficiency_percentage` | `numeric` | YES | - | Sleep efficiency percentage |
| `total_in_bed_time_milli` | `integer` | YES | - | Total time in bed |
| `total_awake_time_milli` | `integer` | YES | - | Total awake time |
| `total_no_data_time_milli` | `integer` | YES | - | Total no-data time |
| `total_light_sleep_time_milli` | `integer` | YES | - | Light sleep duration |
| `total_slow_wave_sleep_time_milli` | `integer` | YES | - | Slow-wave sleep duration |
| `total_rem_sleep_time_milli` | `integer` | YES | - | REM sleep duration |
| `sleep_cycle_count` | `integer` | YES | - | Number of sleep cycles |
| `disturbance_count` | `integer` | YES | - | Disturbance count |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Primary Key:** `id`

**Unique Constraints:** `(user_id, whoop_sleep_id)` — `whoop_sleeps_user_sleep_key`

**Foreign Keys:**
- `user_id` -> `public.users.id` (ON DELETE CASCADE)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `whoop_sleeps_pkey` | UNIQUE | `id` |
| `whoop_sleeps_user_sleep_key` | UNIQUE | `user_id, whoop_sleep_id` |
| `whoop_sleeps_user_start_idx` | BTREE | `user_id, start_at DESC` |
| `whoop_sleeps_user_cycle_idx` | BTREE | `user_id, whoop_cycle_id` |
| `whoop_sleeps_user_updated_idx` | BTREE | `user_id, whoop_updated_at DESC` |

**RLS Policies:**

| Policy Name | Permission | Roles | Command | Condition |
|-------------|------------|-------|---------|-----------|
| `whoop_sleeps_select_own` | PERMISSIVE | `authenticated` | SELECT | `EXISTS (SELECT 1 FROM public.users u WHERE u.id = whoop_sleeps.user_id AND u.clerk_id = (auth.jwt() ->> 'sub'))` |

**Triggers:**
- `update_whoop_sleeps_updated_at` — BEFORE UPDATE — `EXECUTE FUNCTION update_updated_at_column()`

**RLS Enabled:** Yes

---

### `public.whoop_recoveries`

Stores WHOOP recovery records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `whoop_cycle_id` | `text` | NO | - | Related WHOOP cycle identifier |
| `whoop_sleep_id` | `text` | YES | - | Related WHOOP sleep identifier |
| `whoop_user_id` | `text` | NO | - | WHOOP user identifier |
| `whoop_created_at` | `timestamptz` | NO | - | Provider record creation time |
| `whoop_updated_at` | `timestamptz` | NO | - | Provider record update time |
| `score_state` | `text` | YES | - | WHOOP score state |
| `user_calibrating` | `boolean` | YES | - | Calibration flag |
| `recovery_score` | `numeric` | YES | - | Recovery score |
| `resting_heart_rate` | `numeric` | YES | - | Resting heart rate |
| `hrv_rmssd_milli` | `numeric` | YES | - | RMSSD HRV |
| `spo2_percentage` | `numeric` | YES | - | SpO2 percentage |
| `skin_temp_celsius` | `numeric` | YES | - | Skin temperature in Celsius |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Primary Key:** `id`

**Unique Constraints:** `(user_id, whoop_cycle_id)` — `whoop_recoveries_user_cycle_key`

**Foreign Keys:**
- `user_id` -> `public.users.id` (ON DELETE CASCADE)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `whoop_recoveries_pkey` | UNIQUE | `id` |
| `whoop_recoveries_user_cycle_key` | UNIQUE | `user_id, whoop_cycle_id` |
| `whoop_recoveries_user_sleep_idx` | BTREE | `user_id, whoop_sleep_id` |
| `whoop_recoveries_user_updated_idx` | BTREE | `user_id, whoop_updated_at DESC` |

**RLS Policies:**

| Policy Name | Permission | Roles | Command | Condition |
|-------------|------------|-------|---------|-----------|
| `whoop_recoveries_select_own` | PERMISSIVE | `authenticated` | SELECT | `EXISTS (SELECT 1 FROM public.users u WHERE u.id = whoop_recoveries.user_id AND u.clerk_id = (auth.jwt() ->> 'sub'))` |

**Triggers:**
- `update_whoop_recoveries_updated_at` — BEFORE UPDATE — `EXECUTE FUNCTION update_updated_at_column()`

**RLS Enabled:** Yes

---

### `public.whoop_workouts`

Stores WHOOP workout activities.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `whoop_workout_id` | `text` | NO | - | WHOOP workout identifier |
| `whoop_v1_workout_id` | `text` | YES | - | Legacy v1 workout identifier |
| `whoop_user_id` | `text` | NO | - | WHOOP user identifier |
| `whoop_created_at` | `timestamptz` | NO | - | Provider record creation time |
| `whoop_updated_at` | `timestamptz` | NO | - | Provider record update time |
| `start_at` | `timestamptz` | NO | - | Workout start time |
| `end_at` | `timestamptz` | NO | - | Workout end time |
| `timezone_offset` | `text` | YES | - | Original timezone offset |
| `sport_name` | `text` | YES | - | WHOOP sport name |
| `sport_id` | `text` | YES | - | WHOOP sport identifier |
| `score_state` | `text` | YES | - | WHOOP score state |
| `strain` | `numeric` | YES | - | Workout strain |
| `average_heart_rate` | `integer` | YES | - | Average heart rate |
| `max_heart_rate` | `integer` | YES | - | Max heart rate |
| `kilojoule` | `numeric` | YES | - | Energy expenditure in kilojoules |
| `percent_recorded` | `numeric` | YES | - | Percent of HR recorded |
| `distance_meter` | `numeric` | YES | - | Distance in meters |
| `altitude_gain_meter` | `numeric` | YES | - | Altitude gain in meters |
| `altitude_change_meter` | `numeric` | YES | - | Net altitude change in meters |
| `zone_zero_milli` | `integer` | YES | - | Zone 0 duration |
| `zone_one_milli` | `integer` | YES | - | Zone 1 duration |
| `zone_two_milli` | `integer` | YES | - | Zone 2 duration |
| `zone_three_milli` | `integer` | YES | - | Zone 3 duration |
| `zone_four_milli` | `integer` | YES | - | Zone 4 duration |
| `zone_five_milli` | `integer` | YES | - | Zone 5 duration |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Primary Key:** `id`

**Unique Constraints:** `(user_id, whoop_workout_id)` — `whoop_workouts_user_workout_key`

**Foreign Keys:**
- `user_id` -> `public.users.id` (ON DELETE CASCADE)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `whoop_workouts_pkey` | UNIQUE | `id` |
| `whoop_workouts_user_workout_key` | UNIQUE | `user_id, whoop_workout_id` |
| `whoop_workouts_user_start_idx` | BTREE | `user_id, start_at DESC` |
| `whoop_workouts_user_updated_idx` | BTREE | `user_id, whoop_updated_at DESC` |

**RLS Policies:**

| Policy Name | Permission | Roles | Command | Condition |
|-------------|------------|-------|---------|-----------|
| `whoop_workouts_select_own` | PERMISSIVE | `authenticated` | SELECT | `EXISTS (SELECT 1 FROM public.users u WHERE u.id = whoop_workouts.user_id AND u.clerk_id = (auth.jwt() ->> 'sub'))` |

**Triggers:**
- `update_whoop_workouts_updated_at` — BEFORE UPDATE — `EXECUTE FUNCTION update_updated_at_column()`

**RLS Enabled:** Yes

---

### `public.oura_personal_info`

Stores Oura user profile data.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` (unique, one-to-one) |
| `oura_user_id` | `text` | NO | - | Oura's internal user ID |
| `age` | `integer` | YES | - | User age |
| `weight` | `numeric` | YES | - | Weight |
| `height` | `numeric` | YES | - | Height |
| `biological_sex` | `text` | YES | - | Biological sex |
| `email` | `text` | YES | - | Oura account email |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Unique Constraints:** `(user_id)` — `oura_personal_info_user_id_key`

---

### `public.oura_tags`

Stores Oura tag entries.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `oura_document_id` | `text` | NO | - | Oura document identifier |
| `day` | `date` | NO | - | Tag date |
| `text` | `text` | YES | - | Tag text |
| `timestamp` | `timestamp` | NO | - | Tag timestamp |
| `tags` | `jsonb` | NO | `'[]'` | Tag array |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Unique Constraints:** `(user_id, oura_document_id)` — `oura_tags_user_document_key`

---

### `public.oura_enhanced_tags`

Stores Oura enhanced tag entries.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `oura_document_id` | `text` | NO | - | Oura document identifier |
| `tag_type_code` | `text` | YES | - | Tag type code |
| `start_time` | `timestamp` | NO | - | Start time |
| `end_time` | `timestamp` | YES | - | End time |
| `start_day` | `date` | NO | - | Start date |
| `end_day` | `date` | YES | - | End date |
| `comment` | `text` | YES | - | Comment |
| `custom_name` | `text` | YES | - | Custom tag name |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Unique Constraints:** `(user_id, oura_document_id)` — `oura_enhanced_tags_user_document_key`

---

### `public.oura_workouts`

Stores Oura workout records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `oura_document_id` | `text` | NO | - | Oura document identifier |
| `activity` | `text` | NO | - | Activity type |
| `calories` | `numeric` | YES | - | Calories burned |
| `day` | `date` | NO | - | Workout date |
| `distance` | `numeric` | YES | - | Distance |
| `end_datetime` | `timestamptz` | NO | - | End timestamp |
| `intensity` | `text` | NO | - | Intensity level |
| `label` | `text` | YES | - | Label |
| `source` | `text` | NO | - | Data source |
| `start_datetime` | `timestamptz` | NO | - | Start timestamp |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Unique Constraints:** `(user_id, oura_document_id)` — `oura_workouts_user_document_key`

---

### `public.oura_sessions`

Stores Oura session records (meditation, breathing, etc.).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `oura_document_id` | `text` | NO | - | Oura document identifier |
| `day` | `date` | NO | - | Session date |
| `start_datetime` | `timestamp` | NO | - | Start timestamp |
| `end_datetime` | `timestamp` | NO | - | End timestamp |
| `type` | `text` | NO | - | Session type |
| `heart_rate` | `jsonb` | YES | - | Heart rate data |
| `heart_rate_variability` | `jsonb` | YES | - | HRV data |
| `mood` | `text` | YES | - | Mood |
| `motion_count` | `jsonb` | YES | - | Motion count data |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Unique Constraints:** `(user_id, oura_document_id)` — `oura_sessions_user_document_key`

---

### `public.oura_daily_activity`

Stores Oura daily activity summaries.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `oura_document_id` | `text` | NO | - | Oura document identifier |
| `class_5_min` | `text` | YES | - | 5-min activity classification string |
| `score` | `integer` | YES | - | Activity score |
| `active_calories` | `integer` | NO | - | Active calories burned |
| `average_met_minutes` | `numeric` | NO | - | Average MET minutes |
| `contributors` | `jsonb` | NO | `'{}'` | Score contributors |
| `equivalent_walking_distance` | `integer` | NO | - | Equivalent walking distance (m) |
| `high_activity_met_minutes` | `integer` | NO | - | High activity MET minutes |
| `high_activity_time` | `integer` | NO | - | High activity time (s) |
| `inactivity_alerts` | `integer` | NO | - | Inactivity alerts count |
| `low_activity_met_minutes` | `integer` | NO | - | Low activity MET minutes |
| `low_activity_time` | `integer` | NO | - | Low activity time (s) |
| `medium_activity_met_minutes` | `integer` | NO | - | Medium activity MET minutes |
| `medium_activity_time` | `integer` | NO | - | Medium activity time (s) |
| `met` | `jsonb` | NO | `'{}'` | MET samples |
| `meters_to_target` | `integer` | NO | - | Meters remaining to target |
| `non_wear_time` | `integer` | NO | - | Non-wear time (s) |
| `resting_time` | `integer` | NO | - | Resting time (s) |
| `sedentary_met_minutes` | `integer` | NO | - | Sedentary MET minutes |
| `sedentary_time` | `integer` | NO | - | Sedentary time (s) |
| `steps` | `integer` | NO | - | Step count |
| `target_calories` | `integer` | NO | - | Target calories |
| `target_meters` | `integer` | NO | - | Target meters |
| `total_calories` | `integer` | NO | - | Total calories |
| `day` | `date` | NO | - | Activity date |
| `timestamp` | `timestamp` | NO | - | Timestamp |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Unique Constraints:** `(user_id, oura_document_id)` — `oura_daily_activity_user_document_key`

---

### `public.oura_daily_sleep`

Stores Oura daily sleep summaries.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `oura_document_id` | `text` | NO | - | Oura document identifier |
| `contributors` | `jsonb` | NO | `'{}'` | Score contributors |
| `day` | `date` | NO | - | Sleep date |
| `score` | `integer` | YES | - | Sleep score |
| `timestamp` | `timestamp` | NO | - | Timestamp |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Unique Constraints:** `(user_id, oura_document_id)` — `oura_daily_sleep_user_document_key`

---

### `public.oura_daily_spo2`

Stores Oura daily SpO2 readings.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `oura_document_id` | `text` | NO | - | Oura document identifier |
| `day` | `date` | NO | - | Reading date |
| `spo2_percentage` | `jsonb` | YES | - | SpO2 percentage data |
| `breathing_disturbance_index` | `integer` | YES | - | Breathing disturbance index |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Unique Constraints:** `(user_id, oura_document_id)` — `oura_daily_spo2_user_document_key`

---

### `public.oura_daily_readiness`

Stores Oura daily readiness scores.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `oura_document_id` | `text` | NO | - | Oura document identifier |
| `contributors` | `jsonb` | NO | `'{}'` | Score contributors |
| `day` | `date` | NO | - | Readiness date |
| `score` | `integer` | YES | - | Readiness score |
| `temperature_deviation` | `numeric` | YES | - | Temperature deviation |
| `temperature_trend_deviation` | `numeric` | YES | - | Temperature trend deviation |
| `timestamp` | `timestamp` | NO | - | Timestamp |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Unique Constraints:** `(user_id, oura_document_id)` — `oura_daily_readiness_user_document_key`

---

### `public.oura_sleep`

Stores detailed Oura sleep period records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `oura_document_id` | `text` | NO | - | Oura document identifier |
| `average_breath` | `numeric` | YES | - | Average breaths per minute |
| `average_heart_rate` | `numeric` | YES | - | Average heart rate |
| `average_hrv` | `integer` | YES | - | Average HRV |
| `awake_time` | `integer` | YES | - | Awake time (s) |
| `bedtime_end` | `timestamp` | NO | - | Bedtime end |
| `bedtime_start` | `timestamp` | NO | - | Bedtime start |
| `day` | `date` | NO | - | Sleep date |
| `deep_sleep_duration` | `integer` | YES | - | Deep sleep duration (s) |
| `efficiency` | `integer` | YES | - | Sleep efficiency |
| `heart_rate` | `jsonb` | YES | - | Heart rate samples |
| `hrv` | `jsonb` | YES | - | HRV samples |
| `latency` | `integer` | YES | - | Sleep latency (s) |
| `light_sleep_duration` | `integer` | YES | - | Light sleep duration (s) |
| `low_battery_alert` | `boolean` | NO | - | Low battery alert flag |
| `lowest_heart_rate` | `integer` | YES | - | Lowest heart rate |
| `movement_30_sec` | `text` | YES | - | 30-second movement classification |
| `period` | `integer` | NO | - | Sleep period number |
| `readiness` | `jsonb` | YES | - | Readiness data |
| `readiness_score_delta` | `integer` | YES | - | Readiness score delta |
| `rem_sleep_duration` | `integer` | YES | - | REM sleep duration (s) |
| `restless_periods` | `integer` | YES | - | Restless periods count |
| `sleep_phase_5_min` | `text` | YES | - | 5-min sleep phase classification |
| `sleep_score_delta` | `integer` | YES | - | Sleep score delta |
| `sleep_algorithm_version` | `text` | YES | - | Algorithm version |
| `sleep_analysis_reason` | `text` | YES | - | Analysis reason |
| `time_in_bed` | `integer` | NO | - | Time in bed (s) |
| `total_sleep_duration` | `integer` | YES | - | Total sleep duration (s) |
| `type` | `text` | NO | - | Sleep type |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Unique Constraints:** `(user_id, oura_document_id)` — `oura_sleep_user_document_key`

---

### `public.oura_sleep_time`

Stores Oura sleep time recommendations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `oura_document_id` | `text` | NO | - | Oura document identifier |
| `day` | `date` | NO | - | Date |
| `optimal_bedtime` | `jsonb` | YES | - | Optimal bedtime window |
| `recommendation` | `text` | YES | - | Recommendation text |
| `status` | `text` | YES | - | Status |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Unique Constraints:** `(user_id, oura_document_id)` — `oura_sleep_time_user_document_key`

---

### `public.oura_rest_mode_periods`

Stores Oura rest mode period records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `oura_document_id` | `text` | NO | - | Oura document identifier |
| `end_day` | `date` | YES | - | End date |
| `end_time` | `timestamp` | YES | - | End time |
| `episodes` | `jsonb` | NO | `'[]'` | Episodes array |
| `start_day` | `date` | NO | - | Start date |
| `start_time` | `timestamp` | YES | - | Start time |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Unique Constraints:** `(user_id, oura_document_id)` — `oura_rest_mode_periods_user_document_key`

---

### `public.oura_ring_configurations`

Stores Oura ring hardware configurations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `oura_document_id` | `text` | NO | - | Oura document identifier |
| `color` | `text` | YES | - | Ring color |
| `design` | `text` | YES | - | Ring design |
| `firmware_version` | `text` | YES | - | Firmware version |
| `hardware_type` | `text` | YES | - | Hardware type |
| `set_up_at` | `timestamp` | YES | - | Setup timestamp |
| `size` | `integer` | YES | - | Ring size |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Unique Constraints:** `(user_id, oura_document_id)` — `oura_ring_configurations_user_document_key`

---

### `public.oura_daily_stress`

Stores Oura daily stress summaries.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `oura_document_id` | `text` | NO | - | Oura document identifier |
| `day` | `date` | NO | - | Stress date |
| `stress_high` | `integer` | YES | - | High stress duration |
| `recovery_high` | `integer` | YES | - | High recovery duration |
| `day_summary` | `text` | YES | - | Day summary label |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Unique Constraints:** `(user_id, oura_document_id)` — `oura_daily_stress_user_document_key`

---

### `public.oura_daily_resilience`

Stores Oura daily resilience scores.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `oura_document_id` | `text` | NO | - | Oura document identifier |
| `day` | `date` | NO | - | Resilience date |
| `contributors` | `jsonb` | NO | `'{}'` | Score contributors |
| `level` | `text` | NO | - | Resilience level |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Unique Constraints:** `(user_id, oura_document_id)` — `oura_daily_resilience_user_document_key`

---

### `public.oura_daily_cardiovascular_age`

Stores Oura daily cardiovascular/vascular age estimates.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `oura_document_id` | `text` | YES | - | Oura document identifier |
| `day` | `date` | NO | - | Date |
| `vascular_age` | `integer` | YES | - | Estimated vascular age |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Unique Constraints:**
- `(user_id, day)` — `oura_daily_cardiovascular_age_user_day_key`
- `(user_id, oura_document_id)` where `oura_document_id IS NOT NULL` — `oura_daily_cardiovascular_age_user_document_key`

---

### `public.oura_vo2_max`

Stores Oura VO2 max estimates.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `oura_document_id` | `text` | NO | - | Oura document identifier |
| `day` | `date` | NO | - | Date |
| `timestamp` | `timestamp` | NO | - | Measurement timestamp |
| `vo2_max` | `numeric` | YES | - | VO2 max value |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Unique Constraints:** `(user_id, oura_document_id)` — `oura_vo2_max_user_document_key`

---

### `public.oura_heart_rate`

Stores Oura heart rate samples (high-volume time series).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `bpm` | `integer` | NO | - | Beats per minute |
| `source` | `text` | NO | - | Data source |
| `timestamp` | `timestamp` | NO | - | Sample timestamp |
| `raw_payload` | `jsonb` | NO | `'{}'` | Full API response |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Unique Constraints:** `(user_id, timestamp, source)` — `oura_heart_rate_user_timestamp_source_key`

---

### `public.oura_webhook_subscriptions`

Stores active Oura webhook subscriptions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `provider_subscription_id` | `uuid` | NO | - | Oura subscription ID (unique) |
| `callback_url` | `text` | NO | - | Webhook callback URL |
| `event_type` | `oura_webhook_operation` | NO | - | Event type (`create`, `update`, `delete`) |
| `data_type` | `oura_data_type` | NO | - | Data type enum value |
| `expiration_time` | `timestamptz` | NO | - | Subscription expiry |
| `last_synced_at` | `timestamptz` | NO | `now()` | Last sync timestamp |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Unique Constraints:**
- `provider_subscription_id` (unique)
- `(event_type, data_type)` — `oura_webhook_subscriptions_event_type_data_type_key`

**RLS Enabled:** Yes (no policies; service role access only)

---

### `public.oura_webhook_events`

Stores incoming Oura webhook event payloads for audit/debugging.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | YES | - | FK to `public.users.id` (nullable until resolved) |
| `provider_user_id` | `text` | YES | - | Oura's user ID from the event |
| `event_type` | `text` | YES | - | Event type string |
| `data_type` | `text` | YES | - | Data type string |
| `object_id` | `text` | YES | - | Object ID from event |
| `event_time` | `timestamptz` | YES | - | Event timestamp |
| `signature` | `text` | YES | - | Webhook signature |
| `timestamp_header` | `text` | YES | - | Timestamp header |
| `payload` | `jsonb` | NO | `'{}'` | Raw webhook payload |
| `status` | `oura_webhook_event_status` | NO | - | Processing status |
| `error_text` | `text` | YES | - | Error message if failed |
| `created_at` | `timestamptz` | NO | `now()` | |

**RLS Enabled:** Yes (no policies; service role access only)

---

### `public.oura_sync_jobs`

Queue table for Oura data sync jobs (backfill, reconcile, webhook-triggered fetches).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `fingerprint` | `text` | NO | - | Deduplication fingerprint |
| `data_type` | `oura_data_type` | NO | - | Data type to sync |
| `sync_kind` | `oura_sync_kind` | NO | - | Kind of sync operation |
| `status` | `oura_sync_status` | NO | `'pending'` | Job status |
| `priority` | `integer` | NO | `10` | Priority (higher = more important) |
| `object_id` | `text` | YES | - | Specific object to sync |
| `start_date` | `date` | YES | - | Date range start |
| `end_date` | `date` | YES | - | Date range end |
| `start_datetime` | `timestamptz` | YES | - | Datetime range start |
| `end_datetime` | `timestamptz` | YES | - | Datetime range end |
| `next_token` | `text` | YES | - | Pagination token |
| `attempts` | `integer` | NO | `0` | Retry attempt count |
| `last_error` | `text` | YES | - | Last error message |
| `available_at` | `timestamptz` | NO | `now()` | When job becomes available |
| `locked_at` | `timestamptz` | YES | - | Lock timestamp |
| `locked_by` | `text` | YES | - | Lock owner identifier |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Check Constraints:**
- `priority >= 0`
- `attempts >= 0`

**Unique Constraints:** `(user_id, fingerprint)` — `oura_sync_jobs_user_fingerprint_key`

**RLS Enabled:** Yes (no policies; service role access only)

---

### `public.whoop_webhook_events`

Stores incoming WHOOP webhook event payloads for audit/debugging.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | YES | - | FK to `public.users.id` (nullable until resolved) |
| `provider_user_id` | `text` | YES | - | WHOOP user ID from the event |
| `event_type` | `text` | YES | - | Event type string |
| `object_id` | `text` | YES | - | Event object identifier |
| `trace_id` | `text` | YES | - | WHOOP trace ID |
| `signature` | `text` | YES | - | Webhook signature |
| `timestamp_header` | `text` | YES | - | Signature timestamp header |
| `payload` | `jsonb` | NO | `'{}'` | Raw webhook payload |
| `status` | `whoop_webhook_event_status` | NO | - | Processing status |
| `error_text` | `text` | YES | - | Error message if failed |
| `created_at` | `timestamptz` | NO | `now()` | |

**Primary Key:** `id`

**Foreign Keys:**
- `user_id` -> `public.users.id` (ON DELETE CASCADE)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `whoop_webhook_events_pkey` | UNIQUE | `id` |
| `whoop_webhook_events_user_created_idx` | BTREE | `user_id, created_at DESC` |
| `whoop_webhook_events_event_object_idx` | BTREE | `event_type, object_id, created_at DESC` |

**RLS Enabled:** Yes (no policies; service role access only)

---

### `public.whoop_sync_jobs`

Queue table for WHOOP data sync jobs (refresh, backfill, reconcile, webhook fetch/delete).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `fingerprint` | `text` | NO | - | Deduplication fingerprint |
| `data_type` | `whoop_data_type` | NO | - | WHOOP data type to sync |
| `sync_kind` | `whoop_sync_kind` | NO | - | Kind of sync operation |
| `status` | `whoop_sync_status` | NO | `'pending'` | Job status |
| `priority` | `integer` | NO | `10` | Priority (higher = more important) |
| `object_id` | `text` | YES | - | Specific object to sync/delete |
| `start_datetime` | `timestamptz` | YES | - | Datetime range start |
| `end_datetime` | `timestamptz` | YES | - | Datetime range end |
| `next_token` | `text` | YES | - | Pagination token |
| `attempts` | `integer` | NO | `0` | Retry attempt count |
| `last_error` | `text` | YES | - | Last error message |
| `available_at` | `timestamptz` | NO | `now()` | When job becomes available |
| `locked_at` | `timestamptz` | YES | - | Lock timestamp |
| `locked_by` | `text` | YES | - | Lock owner identifier |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Primary Key:** `id`

**Check Constraints:**
- `priority >= 0`
- `attempts >= 0`

**Unique Constraints:** `(user_id, fingerprint)` — `whoop_sync_jobs_user_fingerprint_key`

**Foreign Keys:**
- `user_id` -> `public.users.id` (ON DELETE CASCADE)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `whoop_sync_jobs_pkey` | UNIQUE | `id` |
| `whoop_sync_jobs_user_fingerprint_key` | UNIQUE | `user_id, fingerprint` |
| `whoop_sync_jobs_pending_idx` | BTREE | `status, available_at, priority DESC, created_at` |

**Triggers:**
- `update_whoop_sync_jobs_updated_at` — BEFORE UPDATE — `EXECUTE FUNCTION update_updated_at_column()`

**RLS Enabled:** Yes (no policies; service role access only)

---

### `public.nutrition_goals`

Daily calorie/protein goals per user.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `daily_calories` | `integer` | NO | `2000` | Daily calorie target |
| `daily_protein` | `integer` | NO | `150` | Daily protein target (grams) |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Primary Key:** `id`

**Unique Constraints:** `(user_id)` — one goal row per user

**Foreign Keys:**
- `user_id` -> `public.users.id` (ON DELETE CASCADE)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `nutrition_goals_pkey` | UNIQUE | `id` |
| `idx_nutrition_goals_user_id` | BTREE | `user_id` |

**RLS Policies:**

| Policy Name | Permission | Command | Condition |
|-------------|------------|---------|-----------|
| `Users manage own nutrition_goals` | PERMISSIVE | ALL | `user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt()->>'sub'))` |

**RLS Enabled:** Yes

---

### `public.meals`

Individual meal entries logged by users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `meal_date` | `date` | NO | - | Date of the meal |
| `name` | `text` | NO | - | Meal name/description |
| `calories` | `integer` | NO | - | Calorie count |
| `protein` | `integer` | NO | - | Protein in grams |
| `source` | `text` | NO | `'manual'` | Entry source (`ai` or `manual`) |
| `raw_input` | `text` | YES | - | Original text input (for AI-parsed meals) |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Primary Key:** `id`

**Check Constraints:**
- `source IN ('ai', 'manual')`

**Foreign Keys:**
- `user_id` -> `public.users.id` (ON DELETE CASCADE)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `meals_pkey` | UNIQUE | `id` |
| `idx_meals_user_date` | BTREE | `user_id, meal_date` |
| `idx_meals_user_date_range` | BTREE | `user_id, meal_date DESC` |

**RLS Policies:**

| Policy Name | Permission | Command | Condition |
|-------------|------------|---------|-----------|
| `Users manage own meals` | PERMISSIVE | ALL | `user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt()->>'sub'))` |

**RLS Enabled:** Yes

---

### `public.challenges`

User-defined challenges/goals with duration and status tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `name` | `text` | NO | - | Challenge name |
| `description` | `text` | YES | `''` | Challenge description |
| `duration` | `integer` | NO | - | Duration in days (1–365) |
| `start_date` | `date` | NO | - | Challenge start date |
| `timezone` | `text` | NO | `'UTC'` | User's timezone |
| `status` | `text` | NO | `'active'` | Challenge status |
| `template_id` | `text` | YES | - | Optional template identifier |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Primary Key:** `id`

**Check Constraints:**
- `duration >= 1 AND duration <= 365`
- `status IN ('active', 'paused', 'completed', 'abandoned')`

**Foreign Keys:**
- `user_id` -> `public.users.id` (ON DELETE CASCADE)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `challenges_pkey` | UNIQUE | `id` |
| `idx_challenges_user_id` | BTREE | `user_id` |
| `idx_challenges_user_status` | BTREE | `user_id, status` |

**RLS Policies:**

| Policy Name | Permission | Command | Condition |
|-------------|------------|---------|-----------|
| `Users manage own challenges` | PERMISSIVE | ALL | `user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt()->>'sub'))` |

**RLS Enabled:** Yes

---

### `public.challenge_tasks`

Individual tasks within a challenge.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `challenge_id` | `uuid` | NO | - | FK to `public.challenges.id` |
| `label` | `text` | NO | - | Task label |
| `sort_order` | `integer` | NO | `0` | Display order |
| `created_at` | `timestamptz` | NO | `now()` | |

**Primary Key:** `id`

**Foreign Keys:**
- `challenge_id` -> `public.challenges.id` (ON DELETE CASCADE)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `challenge_tasks_pkey` | UNIQUE | `id` |
| `idx_challenge_tasks_challenge_id` | BTREE | `challenge_id` |

**RLS Policies:**

| Policy Name | Permission | Command | Condition |
|-------------|------------|---------|-----------|
| `Users manage own challenge_tasks` | PERMISSIVE | ALL | `challenge_id IN (SELECT id FROM challenges WHERE user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt()->>'sub')))` |

**RLS Enabled:** Yes

---

### `public.daily_completions`

Tracks daily task completions within a challenge.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `challenge_id` | `uuid` | NO | - | FK to `public.challenges.id` |
| `task_id` | `uuid` | NO | - | FK to `public.challenge_tasks.id` |
| `completed_date` | `date` | NO | - | Date of completion |
| `completed_at` | `timestamptz` | NO | `now()` | Completion timestamp |

**Primary Key:** `id`

**Unique Constraints:** `(task_id, completed_date)` — one completion per task per day

**Foreign Keys:**
- `challenge_id` -> `public.challenges.id` (ON DELETE CASCADE)
- `task_id` -> `public.challenge_tasks.id` (ON DELETE CASCADE)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `daily_completions_pkey` | UNIQUE | `id` |
| `idx_daily_completions_challenge_date` | BTREE | `challenge_id, completed_date` |

**RLS Policies:**

| Policy Name | Permission | Command | Condition |
|-------------|------------|---------|-----------|
| `Users manage own daily_completions` | PERMISSIVE | ALL | `challenge_id IN (SELECT id FROM challenges WHERE user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt()->>'sub')))` |

**RLS Enabled:** Yes

---

### `public.exercises`

Exercise catalog containing system-defined (user_id IS NULL) and user-created exercises.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | YES | - | FK to `public.users.id` (NULL = system exercise) |
| `name` | `text` | NO | - | Exercise name |
| `muscle_group` | `text` | YES | - | Target muscle group |
| `equipment` | `text` | YES | - | Required equipment |
| `created_at` | `timestamptz` | NO | `now()` | |

**Primary Key:** `id`

**Foreign Keys:**
- `user_id` -> `public.users.id` (ON DELETE CASCADE)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `exercises_pkey` | UNIQUE | `id` |
| `idx_exercises_user_id` | BTREE | `user_id` |

**RLS Policies:**

| Policy Name | Permission | Command | Condition |
|-------------|------------|---------|-----------|
| `Users read system and own exercises` | PERMISSIVE | SELECT | `user_id IS NULL OR user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt()->>'sub'))` |
| `Users manage own exercises` | PERMISSIVE | ALL | `user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt()->>'sub'))` |

**Seed Data:** 48 system exercises across Chest, Back, Shoulders, Legs, Arms, and Core muscle groups.

**RLS Enabled:** Yes

---

### `public.workout_templates`

Reusable workout templates created by users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `name` | `text` | NO | - | Template name |
| `description` | `text` | YES | - | Template description |
| `color` | `text` | YES | `'#1d83ab'` | Display color |
| `sort_order` | `int` | NO | `0` | Display order |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Primary Key:** `id`

**Foreign Keys:**
- `user_id` -> `public.users.id` (ON DELETE CASCADE)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `workout_templates_pkey` | UNIQUE | `id` |
| `idx_workout_templates_user` | BTREE | `user_id` |

**RLS Policies:**

| Policy Name | Permission | Command | Condition |
|-------------|------------|---------|-----------|
| `Users manage own workout_templates` | PERMISSIVE | ALL | `user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt()->>'sub'))` |

**RLS Enabled:** Yes

---

### `public.template_exercises`

Exercises within a workout template.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `template_id` | `uuid` | NO | - | FK to `public.workout_templates.id` |
| `exercise_id` | `uuid` | NO | - | FK to `public.exercises.id` |
| `sort_order` | `int` | NO | `0` | Display order |
| `target_sets` | `int` | YES | - | Target number of sets |
| `target_reps` | `text` | YES | - | Target reps (e.g. "8-12") |
| `target_weight` | `numeric(7,2)` | YES | - | Target weight |
| `notes` | `text` | YES | - | Exercise notes |
| `rest_seconds` | `int` | YES | - | Rest time between sets |
| `created_at` | `timestamptz` | NO | `now()` | |

**Primary Key:** `id`

**Foreign Keys:**
- `template_id` -> `public.workout_templates.id` (ON DELETE CASCADE)
- `exercise_id` -> `public.exercises.id` (ON DELETE RESTRICT)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `template_exercises_pkey` | UNIQUE | `id` |
| `idx_template_exercises_template` | BTREE | `template_id` |

**RLS Policies:**

| Policy Name | Permission | Command | Condition |
|-------------|------------|---------|-----------|
| `Users manage own template_exercises` | PERMISSIVE | ALL | `template_id IN (SELECT id FROM workout_templates WHERE user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt()->>'sub')))` |

**RLS Enabled:** Yes

---

### `public.workouts`

Daily workout instances (can be created from a template or standalone).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `template_id` | `uuid` | YES | - | FK to `public.workout_templates.id` (optional) |
| `name` | `text` | NO | - | Workout name |
| `date` | `date` | NO | - | Workout date |
| `status` | `text` | NO | `'planned'` | Workout status |
| `started_at` | `timestamptz` | YES | - | When workout was started |
| `completed_at` | `timestamptz` | YES | - | When workout was completed |
| `notes` | `text` | YES | - | Workout notes |
| `duration_minutes` | `int` | YES | - | Total duration in minutes |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Primary Key:** `id`

**Check Constraints:**
- `status IN ('planned', 'in_progress', 'completed', 'skipped')`

**Foreign Keys:**
- `user_id` -> `public.users.id` (ON DELETE CASCADE)
- `template_id` -> `public.workout_templates.id` (ON DELETE SET NULL)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `workouts_pkey` | UNIQUE | `id` |
| `idx_workouts_user_date` | BTREE | `user_id, date` |

**RLS Policies:**

| Policy Name | Permission | Command | Condition |
|-------------|------------|---------|-----------|
| `Users manage own workouts` | PERMISSIVE | ALL | `user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt()->>'sub'))` |

**RLS Enabled:** Yes

---

### `public.workout_exercises`

Exercises within a workout instance.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `workout_id` | `uuid` | NO | - | FK to `public.workouts.id` |
| `exercise_id` | `uuid` | NO | - | FK to `public.exercises.id` |
| `sort_order` | `int` | NO | `0` | Display order |
| `is_completed` | `boolean` | NO | `false` | Whether exercise is completed |
| `notes` | `text` | YES | - | Exercise notes |
| `created_at` | `timestamptz` | NO | `now()` | |

**Primary Key:** `id`

**Foreign Keys:**
- `workout_id` -> `public.workouts.id` (ON DELETE CASCADE)
- `exercise_id` -> `public.exercises.id` (ON DELETE RESTRICT)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `workout_exercises_pkey` | UNIQUE | `id` |
| `idx_workout_exercises_workout` | BTREE | `workout_id` |

**RLS Policies:**

| Policy Name | Permission | Command | Condition |
|-------------|------------|---------|-----------|
| `Users manage own workout_exercises` | PERMISSIVE | ALL | `workout_id IN (SELECT id FROM workouts WHERE user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt()->>'sub')))` |

**RLS Enabled:** Yes

---

### `public.exercise_sets`

Individual sets per exercise within a workout.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `workout_exercise_id` | `uuid` | NO | - | FK to `public.workout_exercises.id` |
| `set_number` | `int` | NO | - | Set number within the exercise |
| `set_type` | `text` | NO | `'working'` | Set type |
| `weight` | `numeric(7,2)` | YES | - | Weight used |
| `reps` | `int` | YES | - | Number of reps |
| `rpe` | `numeric(3,1)` | YES | - | Rate of perceived exertion |
| `is_completed` | `boolean` | NO | `false` | Whether set is completed |
| `notes` | `text` | YES | - | Set notes |
| `created_at` | `timestamptz` | NO | `now()` | |

**Primary Key:** `id`

**Check Constraints:**
- `set_type IN ('warmup', 'working', 'dropset', 'failure')`

**Foreign Keys:**
- `workout_exercise_id` -> `public.workout_exercises.id` (ON DELETE CASCADE)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `exercise_sets_pkey` | UNIQUE | `id` |
| `idx_exercise_sets_workout_exercise` | BTREE | `workout_exercise_id` |

**RLS Policies:**

| Policy Name | Permission | Command | Condition |
|-------------|------------|---------|-----------|
| `Users manage own exercise_sets` | PERMISSIVE | ALL | `workout_exercise_id IN (SELECT id FROM workout_exercises WHERE workout_id IN (SELECT id FROM workouts WHERE user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt()->>'sub'))))` |

**RLS Enabled:** Yes

---

### `public.user_settings`

Stores per-user app preferences (timezone, notification toggles, weekly summary day).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` (unique, one-to-one) |
| `timezone` | `text` | YES | - | User's preferred timezone |
| `reminder_time` | `time` | NO | `'18:00'` | Daily reminder time |
| `weekly_summary_day` | `text` | NO | `'monday'` | Day for weekly summary |
| `notify_recovery` | `boolean` | NO | `true` | Recovery notification toggle |
| `notify_goals` | `boolean` | NO | `true` | Goals notification toggle |
| `notify_nutrition` | `boolean` | NO | `true` | Nutrition notification toggle |
| `notify_summaries` | `boolean` | NO | `true` | Summary notification toggle |
| `notify_devices` | `boolean` | NO | `true` | Device notification toggle |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Primary Key:** `id`

**Check Constraints:**
- `weekly_summary_day IN ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')`

**Unique Constraints:**
- `(user_id)` — `user_settings_user_id_key`

**Foreign Keys:**
- `user_id` -> `public.users.id` (ON DELETE CASCADE)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `user_settings_pkey` | UNIQUE | `id` |
| `user_settings_user_id_key` | UNIQUE | `user_id` |

**RLS Policies:**

| Policy Name | Permission | Roles | Command | Condition |
|-------------|------------|-------|---------|-----------|
| `Users manage own user_settings` | PERMISSIVE | ALL | ALL | `user_id IN (SELECT id FROM public.users WHERE clerk_id = (auth.jwt() ->> 'sub'))` |

**Triggers:**
- `update_user_settings_updated_at` — BEFORE UPDATE — `EXECUTE FUNCTION update_updated_at_column()`

**RLS Enabled:** Yes

---

### `public.daily_user_metrics`

Stores aggregated daily metrics per user — wearable data, nutrition, challenges, and sync state.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `metric_date` | `date` | NO | - | Date of the metrics |
| `timezone` | `text` | NO | `'UTC'` | Timezone for the metric day |
| `active_wearable_provider` | `text` | YES | - | Active wearable provider |
| `sync_freshness` | `text` | NO | `'not_connected'` | Wearable sync state |
| `sleep_hours` | `numeric` | YES | - | Total sleep hours |
| `sleep_score` | `integer` | YES | - | Sleep score |
| `readiness_score` | `integer` | YES | - | Readiness/recovery score |
| `steps` | `integer` | YES | - | Step count |
| `active_calories` | `integer` | YES | - | Active calories burned |
| `workout_count` | `integer` | NO | `0` | Number of workouts |
| `workout_duration_minutes` | `integer` | NO | `0` | Total workout duration |
| `calories_logged` | `integer` | NO | `0` | Calories logged via nutrition |
| `protein_logged` | `integer` | NO | `0` | Protein logged via nutrition |
| `calorie_goal_met` | `boolean` | NO | `false` | Whether calorie goal was met |
| `protein_goal_met` | `boolean` | NO | `false` | Whether protein goal was met |
| `challenge_tasks_completed` | `integer` | NO | `0` | Challenge tasks completed |
| `challenge_tasks_target` | `integer` | NO | `0` | Challenge tasks target |
| `challenge_goal_met` | `boolean` | NO | `false` | Whether challenge goal was met |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Primary Key:** `id`

**Check Constraints:**
- `active_wearable_provider IN ('oura', 'whoop')`
- `sync_freshness IN ('not_connected', 'syncing', 'baseline_forming', 'ready', 'stale', 'blocked')`

**Unique Constraints:**
- `(user_id, metric_date)` — `daily_user_metrics_user_date_key`

**Foreign Keys:**
- `user_id` -> `public.users.id` (ON DELETE CASCADE)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `daily_user_metrics_pkey` | UNIQUE | `id` |
| `daily_user_metrics_user_date_key` | UNIQUE | `user_id, metric_date` |
| `idx_daily_user_metrics_user_date` | BTREE | `user_id, metric_date DESC` |

**RLS Policies:**

| Policy Name | Permission | Roles | Command | Condition |
|-------------|------------|-------|---------|-----------|
| `Users manage own daily_user_metrics` | PERMISSIVE | ALL | ALL | `user_id IN (SELECT id FROM public.users WHERE clerk_id = (auth.jwt() ->> 'sub'))` |

**Triggers:**
- `update_daily_user_metrics_updated_at` — BEFORE UPDATE — `EXECUTE FUNCTION update_updated_at_column()`

**RLS Enabled:** Yes

---

### `public.user_notifications`

Stores in-app notifications with deduplication, read tracking, and expiry support.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | FK to `public.users.id` |
| `type` | `text` | NO | - | Notification type |
| `title` | `text` | NO | - | Notification title |
| `body` | `text` | NO | - | Notification body |
| `cta_label` | `text` | YES | - | Call-to-action button label |
| `cta_href` | `text` | YES | - | Call-to-action link |
| `dedupe_key` | `text` | YES | - | Deduplication key |
| `is_read` | `boolean` | NO | `false` | Read status |
| `read_at` | `timestamptz` | YES | - | When notification was read |
| `expires_at` | `timestamptz` | YES | - | Expiry timestamp |
| `metadata` | `jsonb` | NO | `'{}'` | Additional metadata |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**Primary Key:** `id`

**Check Constraints:**
- `type IN ('sync_complete', 'sync_stale', 'baseline_ready', 'goal_hit', 'goal_missed_risk', 'protein_gap', 'workout_streak', 'recovery_low', 'weekly_summary')`

**Foreign Keys:**
- `user_id` -> `public.users.id` (ON DELETE CASCADE)

**Indexes:**

| Index Name | Type | Columns |
|------------|------|---------|
| `user_notifications_pkey` | UNIQUE | `id` |
| `idx_user_notifications_user_created` | BTREE | `user_id, created_at DESC` |
| `idx_user_notifications_user_dedupe` | UNIQUE (partial) | `user_id, dedupe_key` WHERE `dedupe_key IS NOT NULL` |

**RLS Policies:**

| Policy Name | Permission | Roles | Command | Condition |
|-------------|------------|-------|---------|-----------|
| `Users manage own user_notifications` | PERMISSIVE | ALL | ALL | `user_id IN (SELECT id FROM public.users WHERE clerk_id = (auth.jwt() ->> 'sub'))` |

**Triggers:**
- `update_user_notifications_updated_at` — BEFORE UPDATE — `EXECUTE FUNCTION update_updated_at_column()`

**RLS Enabled:** Yes

---

## Enums

### `oura_data_type`

```
personal_info | tag | enhanced_tag | workout | session | daily_activity |
daily_sleep | daily_spo2 | daily_readiness | sleep | sleep_time |
rest_mode_period | ring_configuration | daily_stress | daily_resilience |
daily_cardiovascular_age | vo2_max | heartrate
```

### `oura_webhook_operation`

```
create | update | delete
```

### `oura_sync_kind`

```
backfill | reconcile | webhook_fetch | webhook_delete
```

### `oura_sync_status`

```
pending | processing | completed | failed
```

### `oura_webhook_event_status`

```
queued | ignored | rejected | failed
```

### `whoop_data_type`

```
profile | body_measurement | cycle | sleep | recovery | workout
```

### `whoop_sync_kind`

```
refresh | backfill | reconcile | webhook_fetch | webhook_delete
```

### `whoop_sync_status`

```
pending | processing | completed | failed
```

### `whoop_webhook_event_status`

```
queued | ignored | rejected | failed
```

---

## Indexes

### `public.users`

| Index Name | Type | Columns |
|------------|------|---------|
| `users_pkey` | UNIQUE | `id` |
| `users_clerk_id_key` | UNIQUE | `clerk_id` |
| `idx_users_clerk_id` | BTREE | `clerk_id` |

### `public.oauth_connections`

| Index Name | Type | Columns |
|------------|------|---------|
| `oauth_connections_pkey` | UNIQUE | `id` |
| `oauth_connections_user_provider_key` | UNIQUE | `user_id, provider` |
| `oauth_connections_provider_provider_user_id_key` | UNIQUE (partial) | `provider, provider_user_id` WHERE `provider_user_id IS NOT NULL` |
| `oauth_connections_user_id_idx` | BTREE | `user_id` |

### `public.whoop_profile`

| Index Name | Type | Columns |
|------------|------|---------|
| `whoop_profile_pkey` | UNIQUE | `id` |
| `whoop_profile_user_id_key` | UNIQUE | `user_id` |
| `whoop_profile_whoop_user_id_key` | UNIQUE | `whoop_user_id` |

### `public.whoop_body_measurement`

| Index Name | Type | Columns |
|------------|------|---------|
| `whoop_body_measurement_pkey` | UNIQUE | `id` |
| `whoop_body_measurement_user_id_key` | UNIQUE | `user_id` |

### `public.whoop_cycles`

| Index Name | Type | Columns |
|------------|------|---------|
| `whoop_cycles_pkey` | UNIQUE | `id` |
| `whoop_cycles_user_cycle_key` | UNIQUE | `user_id, whoop_cycle_id` |
| `whoop_cycles_user_start_idx` | BTREE | `user_id, start_at DESC` |
| `whoop_cycles_user_updated_idx` | BTREE | `user_id, whoop_updated_at DESC` |

### `public.whoop_sleeps`

| Index Name | Type | Columns |
|------------|------|---------|
| `whoop_sleeps_pkey` | UNIQUE | `id` |
| `whoop_sleeps_user_sleep_key` | UNIQUE | `user_id, whoop_sleep_id` |
| `whoop_sleeps_user_start_idx` | BTREE | `user_id, start_at DESC` |
| `whoop_sleeps_user_cycle_idx` | BTREE | `user_id, whoop_cycle_id` |
| `whoop_sleeps_user_updated_idx` | BTREE | `user_id, whoop_updated_at DESC` |

### `public.whoop_recoveries`

| Index Name | Type | Columns |
|------------|------|---------|
| `whoop_recoveries_pkey` | UNIQUE | `id` |
| `whoop_recoveries_user_cycle_key` | UNIQUE | `user_id, whoop_cycle_id` |
| `whoop_recoveries_user_sleep_idx` | BTREE | `user_id, whoop_sleep_id` |
| `whoop_recoveries_user_updated_idx` | BTREE | `user_id, whoop_updated_at DESC` |

### `public.whoop_workouts`

| Index Name | Type | Columns |
|------------|------|---------|
| `whoop_workouts_pkey` | UNIQUE | `id` |
| `whoop_workouts_user_workout_key` | UNIQUE | `user_id, whoop_workout_id` |
| `whoop_workouts_user_start_idx` | BTREE | `user_id, start_at DESC` |
| `whoop_workouts_user_updated_idx` | BTREE | `user_id, whoop_updated_at DESC` |

### Oura data tables (common pattern)

Each Oura data table has:
- Primary key index on `id`
- Unique constraint index on `(user_id, oura_document_id)`
- Query index on `(user_id, day DESC)` (or `start_day`, `set_up_at`, `timestamp` as appropriate)

### `public.oura_heart_rate`

| Index Name | Type | Columns |
|------------|------|---------|
| `oura_heart_rate_pkey` | UNIQUE | `id` |
| `oura_heart_rate_user_timestamp_source_key` | UNIQUE | `user_id, timestamp, source` |
| `oura_heart_rate_user_timestamp_idx` | BTREE | `user_id, timestamp DESC` |

### `public.oura_webhook_subscriptions`

| Index Name | Type | Columns |
|------------|------|---------|
| `oura_webhook_subscriptions_pkey` | UNIQUE | `id` |
| `oura_webhook_subscriptions_provider_subscription_id_key` | UNIQUE | `provider_subscription_id` |
| `oura_webhook_subscriptions_event_type_data_type_key` | UNIQUE | `event_type, data_type` |
| `oura_webhook_subscriptions_expiration_idx` | BTREE | `expiration_time` |

### `public.oura_webhook_events`

| Index Name | Type | Columns |
|------------|------|---------|
| `oura_webhook_events_pkey` | UNIQUE | `id` |
| `oura_webhook_events_user_created_idx` | BTREE | `user_id, created_at DESC` |
| `oura_webhook_events_data_object_idx` | BTREE | `data_type, object_id, created_at DESC` |

### `public.oura_sync_jobs`

| Index Name | Type | Columns |
|------------|------|---------|
| `oura_sync_jobs_pkey` | UNIQUE | `id` |
| `oura_sync_jobs_user_fingerprint_key` | UNIQUE | `user_id, fingerprint` |
| `oura_sync_jobs_pending_idx` | BTREE | `status, available_at, priority DESC, created_at` |

### `public.whoop_webhook_events`

| Index Name | Type | Columns |
|------------|------|---------|
| `whoop_webhook_events_pkey` | UNIQUE | `id` |
| `whoop_webhook_events_user_created_idx` | BTREE | `user_id, created_at DESC` |
| `whoop_webhook_events_event_object_idx` | BTREE | `event_type, object_id, created_at DESC` |

### `public.whoop_sync_jobs`

| Index Name | Type | Columns |
|------------|------|---------|
| `whoop_sync_jobs_pkey` | UNIQUE | `id` |
| `whoop_sync_jobs_user_fingerprint_key` | UNIQUE | `user_id, fingerprint` |
| `whoop_sync_jobs_pending_idx` | BTREE | `status, available_at, priority DESC, created_at` |

### `public.nutrition_goals`

| Index Name | Type | Columns |
|------------|------|---------|
| `nutrition_goals_pkey` | UNIQUE | `id` |
| `idx_nutrition_goals_user_id` | BTREE | `user_id` |

### `public.meals`

| Index Name | Type | Columns |
|------------|------|---------|
| `meals_pkey` | UNIQUE | `id` |
| `idx_meals_user_date` | BTREE | `user_id, meal_date` |
| `idx_meals_user_date_range` | BTREE | `user_id, meal_date DESC` |

### `public.challenges`

| Index Name | Type | Columns |
|------------|------|---------|
| `challenges_pkey` | UNIQUE | `id` |
| `idx_challenges_user_id` | BTREE | `user_id` |
| `idx_challenges_user_status` | BTREE | `user_id, status` |

### `public.challenge_tasks`

| Index Name | Type | Columns |
|------------|------|---------|
| `challenge_tasks_pkey` | UNIQUE | `id` |
| `idx_challenge_tasks_challenge_id` | BTREE | `challenge_id` |

### `public.daily_completions`

| Index Name | Type | Columns |
|------------|------|---------|
| `daily_completions_pkey` | UNIQUE | `id` |
| `daily_completions_task_id_completed_date_key` | UNIQUE | `task_id, completed_date` |
| `idx_daily_completions_challenge_date` | BTREE | `challenge_id, completed_date` |

### `public.exercises`

| Index Name | Type | Columns |
|------------|------|---------|
| `exercises_pkey` | UNIQUE | `id` |
| `idx_exercises_user_id` | BTREE | `user_id` |

### `public.workout_templates`

| Index Name | Type | Columns |
|------------|------|---------|
| `workout_templates_pkey` | UNIQUE | `id` |
| `idx_workout_templates_user` | BTREE | `user_id` |

### `public.template_exercises`

| Index Name | Type | Columns |
|------------|------|---------|
| `template_exercises_pkey` | UNIQUE | `id` |
| `idx_template_exercises_template` | BTREE | `template_id` |

### `public.workouts`

| Index Name | Type | Columns |
|------------|------|---------|
| `workouts_pkey` | UNIQUE | `id` |
| `idx_workouts_user_date` | BTREE | `user_id, date` |

### `public.workout_exercises`

| Index Name | Type | Columns |
|------------|------|---------|
| `workout_exercises_pkey` | UNIQUE | `id` |
| `idx_workout_exercises_workout` | BTREE | `workout_id` |

### `public.exercise_sets`

| Index Name | Type | Columns |
|------------|------|---------|
| `exercise_sets_pkey` | UNIQUE | `id` |
| `idx_exercise_sets_workout_exercise` | BTREE | `workout_exercise_id` |

### `public.user_settings`

| Index Name | Type | Columns |
|------------|------|---------|
| `user_settings_pkey` | UNIQUE | `id` |
| `user_settings_user_id_key` | UNIQUE | `user_id` |

### `public.daily_user_metrics`

| Index Name | Type | Columns |
|------------|------|---------|
| `daily_user_metrics_pkey` | UNIQUE | `id` |
| `daily_user_metrics_user_date_key` | UNIQUE | `user_id, metric_date` |
| `idx_daily_user_metrics_user_date` | BTREE | `user_id, metric_date DESC` |

### `public.user_notifications`

| Index Name | Type | Columns |
|------------|------|---------|
| `user_notifications_pkey` | UNIQUE | `id` |
| `idx_user_notifications_user_created` | BTREE | `user_id, created_at DESC` |
| `idx_user_notifications_user_dedupe` | UNIQUE (partial) | `user_id, dedupe_key` WHERE `dedupe_key IS NOT NULL` |

---

## Row Level Security (RLS) Policies

All tables have RLS enabled. Policies are defined as follows:

### `public.users`

| Policy Name | Permission | Roles | Command | Condition |
|-------------|------------|-------|---------|-----------|
| Users can read own data | PERMISSIVE | `authenticated` | SELECT | `clerk_id = (auth.jwt() ->> 'sub')` |
| Users can update own data | PERMISSIVE | `authenticated` | UPDATE | `clerk_id = (auth.jwt() ->> 'sub')` |

### Oura data tables (18 tables)

Each Oura data table (`oura_personal_info`, `oura_tags`, `oura_enhanced_tags`, `oura_workouts`, `oura_sessions`, `oura_daily_activity`, `oura_daily_sleep`, `oura_daily_spo2`, `oura_daily_readiness`, `oura_sleep`, `oura_sleep_time`, `oura_rest_mode_periods`, `oura_ring_configurations`, `oura_daily_stress`, `oura_daily_resilience`, `oura_daily_cardiovascular_age`, `oura_vo2_max`, `oura_heart_rate`) has:

| Policy Name | Permission | Roles | Command | Condition |
|-------------|------------|-------|---------|-----------|
| `{table_name}_select_own` | PERMISSIVE | `authenticated` | SELECT | `EXISTS (SELECT 1 FROM public.users u WHERE u.id = {table}.user_id AND u.clerk_id = (auth.jwt() ->> 'sub'))` |

### Whoop data tables (6 tables)

Each Whoop data table (`whoop_profile`, `whoop_body_measurement`, `whoop_cycles`, `whoop_sleeps`, `whoop_recoveries`, `whoop_workouts`) has:

| Policy Name | Permission | Roles | Command | Condition |
|-------------|------------|-------|---------|-----------|
| `{table_name}_select_own` | PERMISSIVE | `authenticated` | SELECT | `EXISTS (SELECT 1 FROM public.users u WHERE u.id = {table}.user_id AND u.clerk_id = (auth.jwt() ->> 'sub'))` |

### Nutrition, Challenges & Workout tables (11 tables)

`nutrition_goals`, `meals`, `challenges`, `workout_templates`, `workouts` use a direct user_id ownership check:

| Policy Name | Permission | Command | Condition |
|-------------|------------|---------|-----------|
| `Users manage own {table}` | PERMISSIVE | ALL | `user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt()->>'sub'))` |

`challenge_tasks`, `daily_completions`, `template_exercises`, `workout_exercises`, `exercise_sets` use cascading ownership checks through their parent tables.

`exercises` has two policies: a SELECT policy allowing system exercises (`user_id IS NULL`) plus user-owned, and an ALL policy for user-owned exercises only.

### App cohesion tables (3 tables)

`user_settings`, `daily_user_metrics`, `user_notifications` use a direct user_id ownership check:

| Policy Name | Permission | Command | Condition |
|-------------|------------|---------|-----------|
| `Users manage own {table}` | PERMISSIVE | ALL | `user_id IN (SELECT id FROM users WHERE clerk_id = (auth.jwt()->>'sub'))` |

### Server-only tables

`oauth_connections`, `oura_webhook_subscriptions`, `oura_webhook_events`, `oura_sync_jobs`, `whoop_webhook_events`, `whoop_sync_jobs` have RLS enabled but **no policies** — access is via the Supabase service role key only.

---

## Functions

### `update_updated_at_column()`

Trigger function that automatically updates the `updated_at` column when a record is modified.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
```

---

## Triggers

All tables with an `updated_at` column have a `BEFORE UPDATE` trigger that calls `update_updated_at_column()`:

`users`, `oauth_connections`, `whoop_profile`, `whoop_body_measurement`, `whoop_cycles`, `whoop_sleeps`, `whoop_recoveries`, `whoop_workouts`, `whoop_sync_jobs`, `oura_personal_info`, `oura_tags`, `oura_enhanced_tags`, `oura_workouts`, `oura_sessions`, `oura_daily_activity`, `oura_daily_sleep`, `oura_daily_spo2`, `oura_daily_readiness`, `oura_sleep`, `oura_sleep_time`, `oura_rest_mode_periods`, `oura_ring_configurations`, `oura_daily_stress`, `oura_daily_resilience`, `oura_daily_cardiovascular_age`, `oura_vo2_max`, `oura_heart_rate`, `oura_webhook_subscriptions`, `oura_sync_jobs`, `nutrition_goals`, `meals`, `challenges`, `workout_templates`, `workouts`

Trigger name pattern: `update_{table_name}_updated_at`

---

## Migrations

| Version | Name | Description |
|---------|------|-------------|
| `20251128232910` | `create_users_table_with_rls` | Creates users table with RLS policies |
| `20251128233018` | `fix_function_search_path` | Fixes function search path security |
| `20260115063206` | `create_oauth_connections_table` | Creates OAuth connections table |
| `20260310220000` | `create_whoop_user_tables` | Creates WHOOP user data tables |
| `20260310220100` | `create_whoop_sync_tables` | Creates WHOOP enums, webhook events, and sync jobs |
| `20260310220200` | `create_whoop_indexes_policies_and_triggers` | Creates WHOOP indexes, RLS policies, and update triggers |
| `20260310214946` | `create_core_and_oura_user_tables` | Creates all Oura data tables and oauth_connections |
| `20260310215004` | `create_oura_sync_tables` | Creates enums, webhook subscriptions/events, sync jobs |
| `20260310215101` | `create_oura_indexes_policies_and_triggers` | Creates indexes, RLS policies, and update triggers |
| `20260317000000` | `all_features_nutrition_goals_challenges_workouts` | Creates nutrition, challenges, workouts tables with RLS, indexes, and seed exercises |

---

## Installed Extensions

| Extension | Schema | Version | Description |
|-----------|--------|---------|-------------|
| `plpgsql` | `pg_catalog` | 1.0 | PL/pgSQL procedural language |
| `pg_graphql` | `graphql` | 1.5.11 | GraphQL support |
| `uuid-ossp` | `extensions` | 1.1 | Generate UUIDs |
| `pgcrypto` | `extensions` | 1.3 | Cryptographic functions |
| `pg_stat_statements` | `extensions` | 1.11 | Track SQL execution statistics |
| `supabase_vault` | `vault` | 0.3.1 | Supabase Vault Extension |
| `wrappers` | `extensions` | 0.5.6 | Foreign data wrappers |

---

## Usage Notes

### Authentication Integration

This schema is designed to work with **Clerk authentication**. The `clerk_id` column stores the Clerk user ID (`sub` claim from JWT), which is used for RLS policies.

### Foreign Key Pattern

All Oura and Whoop data tables reference `public.users(id)` with `ON DELETE CASCADE`. Deleting a user removes all their associated provider data.

### Adding New Tables

When creating new tables that need user association:

1. Add a `user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE`
2. Enable RLS on the table
3. Create a `_select_own` policy using the user join pattern
4. Add an `updated_at` trigger
5. Add appropriate indexes (typically `(user_id, day DESC)`)

### Example RLS Policy for User-Owned Data

```sql
CREATE POLICY "your_table_select_own" ON your_table
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = your_table.user_id
    AND u.clerk_id = (auth.jwt() ->> 'sub')
  )
);
```
