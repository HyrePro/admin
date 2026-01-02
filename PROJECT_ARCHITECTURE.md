# Hyriki Admin Project Architecture Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Application Architecture](#application-architecture)
5. [Authentication & Authorization](#authentication--authorization)
6. [Data Flow](#data-flow)
7. [API Endpoints](#api-endpoints)
8. [Component Architecture](#component-architecture)
9. [State Management](#state-management)
10. [Security Considerations](#security-considerations)
11. [Notes](#notes)
12. [Red Flags](#red-flags)

## Project Overview

The Hyriki Admin project is a comprehensive Next.js 15 application built with TypeScript, designed as an admin dashboard for managing job postings, candidate applications, and school hiring processes. The application uses Supabase for backend services including authentication, database, and real-time features.

**Project Name**: Admin Hyriki  
**Version**: 0.1.0  
**Framework**: Next.js 15.4.8 with Turbopack  
**Language**: TypeScript

## Technology Stack

### Core Technologies
- **Framework**: Next.js 15.4.8 (with Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Tailwind UI
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: Zustand + SWR
- **Form Handling**: Formik + Yup
- **Animations**: Framer Motion
- **Date Handling**: Day.js (optimized over Moment.js)

### Backend Services
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Real-time

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Formatting**: Prettier (implied)
- **Type Checking**: TypeScript

## Directory Structure

```
admin-hyrepro/
├── docs/
├── migrations/
├── scripts/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── analytics/
│   │   │   ├── candidates/
│   │   │   ├── help/
│   │   │   ├── interviews/
│   │   │   ├── jobs/
│   │   │   ├── settings/
│   │   │   └── ...
│   │   ├── api/
│   │   ├── auth/
│   │   ├── create-school/
│   │   ├── evaluate/
│   │   ├── invite/[token]/
│   │   ├── join-school/
│   │   ├── login/
│   │   ├── select-organization/
│   │   └── signup/
│   ├── components/
│   │   ├── analytics/
│   │   ├── job-post-success/
│   │   ├── ui/
│   │   ├── user-management/
│   │   └── ...
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   │   └── supabase/
│   ├── store/
│   └── styles/
├── types/
├── utils/
├── public/
└── ...
```

## Application Architecture

### Architecture Pattern
The application follows a modern Next.js 13+ App Router pattern with:
- **Server Components**: For data fetching and initial rendering
- **Client Components**: For interactive UI and state management
- **Route Groups**: Using parentheses to organize dashboard routes
- **Middleware**: For authentication and authorization

### Folder Organization
- **`(dashboard)`**: Protected routes requiring authentication
- **`api/`**: API routes for server-side operations
- **`auth/`**: Authentication-related pages (login, signup, callbacks)
- **`components/`**: Reusable UI components
- **`lib/`**: Utility functions and external integrations
- **`context/`**: React context providers
- **`store/`**: Global state management (Zustand)

## Authentication & Authorization

### Authentication Flow
1. **Supabase Auth**: Primary authentication system
2. **OAuth**: Google authentication supported
3. **Email/Password**: Traditional login system
4. **Email Verification**: Required for account activation

### Authorization Strategy
1. **Middleware Protection**: Routes protected at the middleware level
2. **Server-side Checks**: User permissions validated on the server
3. **School-based Access**: Users must belong to a school to access dashboard
4. **Role-based Access**: Different permissions based on user roles

### Key Components
- **[auth-context](file:///Users/rahuljain/hyrePro-Repo/admin-hyrepro/src/context/auth-context.tsx#L63-L69)**: Provides authentication state throughout the app
- **[AuthGuard](file:///Users/rahuljain/hyrePro-Repo/admin-hyrepro/src/components/auth-guard.tsx#L12-L99)**: Component wrapper for protected routes
- **[middleware.ts](file:///Users/rahuljain/hyrePro-Repo/admin-hyrepro/middleware.ts#L4-L102)**: Global authentication protection

## Data Flow

### Client-Server Communication
```
Client Component → API Route → Database → Response → Client Component
```

### Data Fetching Strategy
- **Server Components**: For initial data loading and SEO
- **Client Components**: For interactive data fetching with SWR
- **Server Actions**: For mutations and form submissions
- **Real-time**: For live updates (where implemented)

### Database Integration
- **Supabase Client**: Used for database operations
- **RPC Functions**: Complex queries implemented as database functions
- **Row Level Security**: Database-level security policies
- **Migrations**: SQL-based schema management

## API Endpoints

### Authentication APIs
- `POST /api/auth/callback` - OAuth callback handler
- `POST /api/validate-token` - Token validation
- `POST /api/check-user-info` - User information verification

### Job Management APIs
- `POST /api/create-job` - Create new job posting
- `POST /api/update-job` - Update existing job
- `GET /api/jobs` - Fetch job listings
- `GET /api/job-analytics` - Job performance analytics

### Interview APIs
- `POST /api/interview/confirm` - Interview confirmation
- `GET /api/interview-analytics` - Interview analytics
- `POST /api/respond-invitation` - Invitation response handling

### School Management APIs
- `POST /api/school` - School information management
- `GET /api/school-kpis` - School KPIs and metrics
- `GET /api/application-distribution` - Application distribution analytics

### Invitation System APIs
- `POST /api/create-invitation` - Create new invitations
- `GET /api/get-invitation` - Fetch invitation details
- `POST /api/respond-invitation` - Handle invitation responses

## Component Architecture

### Component Categories

#### UI Components
- **Primitive Components**: Buttons, inputs, dialogs from Radix UI
- **Compound Components**: Complex UI elements built from primitives
- **Layout Components**: Sidebar, header, navigation structures

#### Business Components
- **Job Components**: Job creation, editing, and display
- **Interview Components**: Interview scheduling and management
- **Analytics Components**: Charts and data visualization
- **User Management**: Profile and account management

#### Layout Components
- **Sidebar**: Navigation sidebar with collapsible sections
- **Header**: Top navigation with user profile and notifications
- **Dashboard Layout**: Main dashboard structure and routing

### Component Reusability
- **Dumb Components**: Presentational components without business logic
- **Smart Components**: Container components with data fetching
- **Higher-Order Components**: Reusable logic wrappers
- **Custom Hooks**: Shared logic across components

## State Management

### Global State
- **Zustand**: For global application state (user, preferences)
- **React Context**: For authentication state propagation

### Client-side State
- **React Hooks**: useState, useEffect, useCallback for component state
- **SWR**: Client-side data fetching, caching, and synchronization
- **Form State**: Formik for complex form management

### Server-side State
- **Next.js Server Actions**: For server-side mutations
- **Supabase Sessions**: Server-side authentication state
- **Cookies**: For session persistence

## Security Considerations

### Authentication Security
- **OAuth 2.0**: Secure third-party authentication
- **JWT Tokens**: Secure session management
- **Email Verification**: Account activation requirement
- **Password Policies**: Secure password requirements

### Data Security
- **Row Level Security**: Database-level access controls
- **Input Validation**: Client and server-side validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Proper output encoding

### Authorization Security
- **Route Protection**: Middleware-based route protection
- **API Protection**: Server-side permission checks
- **Rate Limiting**: API request limiting
- **Session Management**: Secure session handling

## Notes

### Development Notes
- **Turbopack**: Project uses Turbopack for faster development builds
- **Dynamic Imports**: Heavy components are dynamically imported to reduce bundle size
- **Server Actions**: Body size limit set to 10MB for large file uploads
- **Production Optimizations**: Console removal in production builds

### Architecture Notes
- **Server Components**: Data fetching happens on the server for performance
- **Client Components**: Interactive elements handled on the client
- **Caching Strategy**: SWR used for client-side caching with revalidation
- **Error Boundaries**: Error handling at component and page levels

### Performance Notes
- **Image Optimization**: Remote patterns configured for Supabase storage
- **Bundle Optimization**: Moment.js replaced with Day.js for smaller bundle
- **Code Splitting**: Dynamic imports used for non-critical components
- **Loading States**: Skeleton screens and loading indicators implemented

### Integration Notes
- **Supabase Integration**: Both client and server-side Supabase clients
- **Environment Variables**: Properly configured for different environments
- **Real-time Features**: Supabase real-time functionality available
- **Storage Integration**: File upload/download through Supabase storage

## Red Flags

### Security Red Flags
- ❌ **Open Redirect Vulnerability**: Login redirect parameter validation may be insufficient
- ❌ **Email Mismatch Warning**: Users can accept invitations for different emails without proper validation
- ❌ **Insufficient Input Sanitization**: Potential for injection attacks in form inputs
- ❌ **Session Management**: No explicit session timeout configuration

### Architecture Red Flags
- ❌ **Tightly Coupled Components**: Some components may be too dependent on specific data structures
- ❌ **Inconsistent Error Handling**: Error handling patterns vary across components
- ❌ **Large Component Files**: Some components exceed recommended size limits (>500 lines)
- ❌ **Missing Type Safety**: Some API responses may not be fully typed

### Performance Red Flags
- ❌ **N+1 Query Problem**: Potential for multiple database queries in loops
- ❌ **Unoptimized Data Fetching**: Server components may fetch more data than needed
- ❌ **Memory Leaks**: Event listeners and subscriptions may not be properly cleaned up
- ❌ **Bundle Size**: Large dependency tree may impact initial load times

### Maintenance Red Flags
- ❌ **Inconsistent Naming**: Variable and function naming conventions may vary
- ❌ **Duplicated Logic**: Similar logic exists across multiple components
- ❌ **Hardcoded Values**: Magic numbers and strings scattered throughout codebase
- ❌ **Insufficient Testing**: No visible test suite or testing strategy

### Scalability Red Flags
- ❌ **Database Bottlenecks**: Complex RPC functions may not scale well
- ❌ **State Management**: Global state may become unwieldy as app grows
- ❌ **Caching Strategy**: Limited server-side caching implementation
- ❌ **Resource Limits**: No clear handling of rate limits or resource constraints

### Documentation Red Flags
- ❌ **Missing API Documentation**: API endpoints lack proper documentation
- ❌ **Unclear Component Responsibilities**: Component boundaries may be unclear
- ❌ **Inconsistent Comments**: Code comments are sparse or inconsistent
- ❌ **Architecture Decisions**: No documentation of key architectural decisions
