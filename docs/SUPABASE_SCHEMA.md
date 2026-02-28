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
| `refresh_token_expires_at` | `timestamptz` | YES | - | Refresh token expiry timestamp (if provided by provider) |
| `created_at` | `timestamptz` | YES | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | YES | `now()` | Last update timestamp |

**Primary Key:** `id`

**Unique Constraints:**
- `(user_id, provider)` (unique index: `oauth_connections_user_provider_key`)
- `(provider, provider_user_id)` where `provider_user_id` is not null (unique index: `oauth_connections_provider_provider_user_id_key`)

**RLS Enabled:** Yes

---

## Indexes

### `public.users`

| Index Name | Type | Columns | Definition |
|------------|------|---------|------------|
| `users_pkey` | UNIQUE | `id` | Primary key index |
| `users_clerk_id_key` | UNIQUE | `clerk_id` | Unique constraint index |
| `idx_users_clerk_id` | BTREE | `clerk_id` | Performance index for Clerk ID lookups |

---

### `public.oauth_connections`

| Index Name | Type | Columns | Definition |
|------------|------|---------|------------|
| `oauth_connections_pkey` | UNIQUE | `id` | Primary key index |
| `oauth_connections_user_provider_key` | UNIQUE | `user_id, provider` | Enforces 1 connection per provider per user |
| `oauth_connections_provider_provider_user_id_key` | UNIQUE | `provider, provider_user_id` | Prevents the same provider account being linked to multiple users |
| `oauth_connections_user_id_idx` | BTREE | `user_id` | Performance index for user lookups |

---

## Row Level Security (RLS) Policies

### `public.users`

| Policy Name | Permission | Roles | Command | Condition |
|-------------|------------|-------|---------|-----------|
| Users can read own data | PERMISSIVE | `authenticated` | SELECT | `clerk_id = (SELECT (auth.jwt() ->> 'sub'))` |
| Users can update own data | PERMISSIVE | `authenticated` | UPDATE | `clerk_id = (SELECT (auth.jwt() ->> 'sub'))` |

**Note:** Users can only read and update their own records. The policy uses the `sub` claim from the JWT token (Clerk user ID) to match against the `clerk_id` column.

---

### `public.oauth_connections`

| Policy Name | Permission | Roles | Command | Condition |
|-------------|------------|-------|---------|-----------|
| *(none)* | - | - | - | *(intentionally omitted; service role access only)* |

**Note:** No RLS policies are defined for this table. Access is intended to be server-side only using the Supabase service role key (which bypasses RLS).

---

## Functions

### `update_updated_at_column()`

Trigger function that automatically updates the `updated_at` column when a record is modified.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Returns:** `trigger`

---

## Triggers

### `public.users`

| Trigger Name | Event | Timing | Action |
|--------------|-------|--------|--------|
| `update_users_updated_at` | UPDATE | BEFORE | `EXECUTE FUNCTION update_updated_at_column()` |

---

### `public.oauth_connections`

| Trigger Name | Event | Timing | Action |
|--------------|-------|--------|--------|
| `update_oauth_connections_updated_at` | UPDATE | BEFORE | `EXECUTE FUNCTION update_updated_at_column()` |

---

## Migrations

| Version | Name | Description |
|---------|------|-------------|
| `20251128232910` | `create_users_table_with_rls` | Creates users table with RLS policies |
| `20251128233018` | `fix_function_search_path` | Fixes function search path security |
| `20260115063206` | `create_oauth_connections_table` | Creates OAuth connections table for WHOOP/Oura tokens |

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

## TypeScript Types

Generated types for use with `@supabase/supabase-js`:

```typescript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          clerk_id: string
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          clerk_id: string
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          clerk_id?: string
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      oauth_connections: {
        Row: {
          access_token: string
          access_token_expires_at: string | null
          created_at: string | null
          id: string
          provider: string
          provider_user_id: string | null
          refresh_token: string | null
          refresh_token_expires_at: string | null
          scope: string | null
          token_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          access_token_expires_at?: string | null
          created_at?: string | null
          id?: string
          provider: string
          provider_user_id?: string | null
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          access_token_expires_at?: string | null
          created_at?: string | null
          id?: string
          provider?: string
          provider_user_id?: string | null
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
```

---

## Usage Notes

### Authentication Integration

This schema is designed to work with **Clerk authentication**. The `clerk_id` column stores the Clerk user ID (`sub` claim from JWT), which is used for RLS policies.

### Adding New Tables

When creating new tables that need user association:

1. Add a foreign key reference to `users.id` or store `clerk_id` directly
2. Enable RLS on the table
3. Create appropriate policies using `auth.jwt() ->> 'sub'` for Clerk integration
4. Consider adding an `updated_at` trigger for audit trails

### Example RLS Policy for User-Owned Data

```sql
-- For tables with user_id foreign key
CREATE POLICY "Users can access own data" ON your_table
FOR ALL
TO authenticated
USING (
  user_id IN (
    SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')
  )
);

-- Or for tables with direct clerk_id column
CREATE POLICY "Users can access own data" ON your_table
FOR ALL
TO authenticated
USING (clerk_id = (auth.jwt() ->> 'sub'));
```
