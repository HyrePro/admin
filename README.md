# Admin Hyriki

This is a Next.js admin dashboard application for Hyriki.

## Features

- User authentication and signup
- Dashboard with analytics
- Job post creation and management
- Modern UI with Tailwind CSS
- School-level KPIs and analytics with filtering options

## Documentation

Detailed documentation for the KPI dashboard can be found in [docs/kpi-dashboard.md](docs/kpi-dashboard.md).

## New Admin User API

The application now includes an API endpoint to store admin user information in the `admin_user_info` table when users sign up.

### Environment Variables Required

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# For admin user operations (recommended to use service role key)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Database Schema

The API expects the following Supabase table structure:

```sql
CREATE TABLE public.admin_user_info (
  id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  first_name text NULL,
  last_name text NULL,
  school_id uuid NULL,
  email text NULL,
  phone_no text NULL,
  avatar text NULL,
  CONSTRAINT admin_user_info_pkey PRIMARY KEY (id),
  CONSTRAINT admin_user_info_school_id_fkey FOREIGN KEY (school_id) REFERENCES school_info (id)
);
```

### School KPIs Function

The application includes a PostgreSQL function to calculate school-level KPIs:

```sql
-- Function signature
get_school_kpis(school_id UUID, period TEXT DEFAULT 'all')
```

This function returns metrics including:
- Total Active Job Campaigns
- Total Successful Job Campaigns (closed with offers)
- Total Failed Job Campaigns (closed without offers)
- Overall Candidates - Assessment Stage
- Overall Candidates - Interview Stage
- Overall Candidates - Offered
- Average time to hire
- Offer Ratio - Extended vs Accepted
- Offer Ratio - Extended vs Declined
- Overall section-wise performance
- Overall candidates gender ratio

The function accepts a period parameter with values: 'day', 'week', 'month', or 'all'.

**Note:** This function requires the `jsonb` extension to be enabled in your Supabase database, which is enabled by default in most Supabase installations.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables as described above

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Endpoints

- `POST /api/admin-user` - Creates admin user information in the database
- `GET /api/school-kpis` - Retrieves school-level KPIs for analytics dashboard
  - Query parameters:
    - `schoolId` (required) - UUID of the school
    - `period` (optional) - Filter period: 'day', 'week', 'month', or 'all' (default)

## Data Layer Architecture (TanStack Query + SWR)

This project uses a **server-first** data flow:

1. **Server Components** resolve auth and prefetch data.
2. **TanStack Query** hydrates and owns client cache/state.
3. **SWR** is used only for manual refresh/polling triggers (`router.refresh()` + query invalidation).

### Core Files

- Query client (request-scoped + browser singleton):  
  `src/lib/query/query-client.ts`
- Top-level query provider + hydration boundary:  
  `src/components/providers/query-provider.tsx`
- Typed query keys:  
  `src/lib/query/query-keys.ts`
- Typed contracts/fetchers (dashboard/jobs/candidates/interviews + candidate funnel):  
  `src/lib/query/contracts/dashboard.ts`  
  `src/lib/query/contracts/jobs.ts`  
  `src/lib/query/contracts/candidates.ts`  
  `src/lib/query/contracts/interviews.ts`  
  `src/lib/query/fetchers/dashboard.ts`  
  `src/lib/query/fetchers/jobs.ts`  
  `src/lib/query/fetchers/candidates.ts`  
  `src/lib/query/fetchers/interviews.ts`  
  `src/lib/query/contracts/candidate-funnel.ts`  
  `src/lib/query/fetchers/candidate-funnel.ts`
- SWR refresh/polling utilities:  
  `src/hooks/use-swr-refresh.ts`  
  `src/components/data/swr-refresh-polling-controls.tsx`

### Full Hydrated Page Example

- Server prefetch + dehydrate:
  `src/app/(dashboard)/page.tsx`
  `src/app/(dashboard)/jobs/page.tsx`
  `src/app/(dashboard)/jobs/[jobId]/candidates/page.tsx`
  `src/app/(dashboard)/candidates/page.tsx`
  `src/app/(dashboard)/interviews/page.tsx`
  `src/app/(dashboard)/analytics/candidate-funnel/page.tsx`
- Client queries from hydrated cache:
  `src/components/pages/jobs-page-client.tsx`
  `src/components/pages/candidates-page-client.tsx`
  `src/components/pages/interviews-page-client.tsx`
  `src/components/analytics/candidate-funnel/candidate-funnel-page-client.tsx`

### Do / Don't

- **Do** prefetch protected data on the server whenever possible.
- **Do** use typed query key factories (`queryKeys.*`) for consistency.
- **Do** keep `useQuery` as the source of truth for UI data.
- **Do** use SWR only to trigger refresh loops, not to store domain data.
- **Don't** fetch auth/session in client components for protected APIs.
- **Don't** run parallel client fetches for data already prefetched server-side.
- **Don't** mix ad-hoc string query keys across features.

### Extension Guide

To add a new feature module:

1. Add typed request/response contracts in `src/lib/query/contracts/*`.
2. Add typed key factory entries in `src/lib/query/query-keys.ts`.
3. Add fetcher + query options in `src/lib/query/fetchers/*`.
4. Server page: prefetch with request-scoped QueryClient and `dehydrate`.
5. Client component: call `useQuery` with the same query options/key.
6. Add SWR refresh controls only if manual refresh or polling is needed.
