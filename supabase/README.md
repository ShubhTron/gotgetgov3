# Supabase Setup

This folder contains the Supabase configuration, migrations, and functions for the GotGetGo application.

## Structure

```
supabase/
├── config.toml          # Supabase configuration
├── migrations/          # Database migrations (SQL files)
├── functions/           # Edge functions
└── apply_connection_requests.sql  # Helper SQL script
```

## Local Development

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Start local Supabase:
   ```bash
   supabase start
   ```

3. Apply migrations:
   ```bash
   supabase db reset
   ```

4. Generate TypeScript types:
   ```bash
   npm run types:generate
   ```

## Migrations

Migrations are numbered and should be applied in order. They define the database schema including:
- Tables (profiles, clubs, matches, challenges, etc.)
- Enums (sport_type, challenge_status, etc.)
- RLS policies
- Functions and triggers
- Indexes for performance

## Production

To push migrations to production:
```bash
supabase db push
```

To generate types from production:
```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```
