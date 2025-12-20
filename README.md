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
