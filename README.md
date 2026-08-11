# Scootery Dashboard Admin

Private admin portal for [scootery_dashboard](https://github.com/cojovi/scootery_dashboard) digital signage.

Staff can log in to manage menu items (add / edit / delete / enable / reorder / feature / upload images). The public TV signage reads the same Supabase data and refreshes about every 60 seconds.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase Auth (email/password)
- Supabase Postgres (`menu_items`) + Storage (`menu-images`)

## Setup

### 1. Create a Supabase project

The Cursor-linked project URL previously returned NXDOMAIN, so create a **new** Supabase project (or reconnect a valid one), then:

1. Open **SQL Editor** and run:
   - [`supabase/migrations/20260811120000_create_menu_items.sql`](supabase/migrations/20260811120000_create_menu_items.sql)
2. (Optional) seed the current sundae menu:
   - SQL: [`supabase/seed/menu_items.sql`](supabase/seed/menu_items.sql)
   - or `npm run seed` after env is set (uses service role)
3. **Authentication → Providers**: Email enabled
4. **Authentication → Settings**: disable public sign-ups (invite-only)
5. **Authentication → Users**: create the first admin user (email + password)

### 2. Configure env

```bash
cp .env.example .env.local
```

Fill in from Supabase **Project Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (seed script only; never ship to the browser)

### 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in.

### 4. Wire the public signage

In `scootery_dashboard` / `index.html`, set:

```js
const CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
  supabaseAnonKey: 'your_anon_key',
  pollIntervalMs: 60000,
  cacheKey: 'scootery_menu_cache_v1'
};
```

Until those are set, the TV uses the embedded fallback menu (same catalog as before).

## Deploy

Deploy this app to Vercel (or similar). Add the same `NEXT_PUBLIC_*` env vars. Point a private hostname such as `admin.…` at it. Do **not** link admin from the public signage URL.

## Product decisions

See [DETAIL.md](DETAIL.md) for the architecture conversation that defines this build.
