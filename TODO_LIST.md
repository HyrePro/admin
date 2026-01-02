# Hyriki Admin Project - Comprehensive TODO List

## Table of Contents
- [Red Flags from Architecture Documentation](#red-flags-from-architecture-documentation)
- [Empty State Handling Issues](#empty-state-handling-issues)
- [Error State Handling Issues](#error-state-handling-issues)
- [Direct Supabase Table Access (Non-RPC)](#direct-supabase-table-access-non-rpc)
- [Business Logic in Components/Pages](#business-logic-in-componentspages)
- [Unnecessary Re-renders](#unnecessary-re-renders)
- [Priority Summary](#priority-summary)

---

## Red Flags from Architecture Documentation

### Security Red Flags

- [ ] **CRITICAL**: Open Redirect Vulnerability - Login redirect parameter validation may be insufficient
  - **File**: `src/app/login/LoginForm.tsx:193-206`
  - **Priority**: Critical
  - **Category**: Security
  - **Description**: The redirect URL validation in login form may not be sufficient to prevent open redirect attacks
  - **Solution**: Implement stricter URL validation to ensure redirects only go to allowed domains/paths

- [ ] **CRITICAL**: Email Mismatch Warning - Users can accept invitations for different emails without proper validation
  - **File**: `src/app/invite/[token]/InvitationClient.tsx:62-70`
  - **Priority**: Critical
  - **Category**: Security
  - **Description**: When authenticated user accesses invitation for different email, only a toast notification is shown
  - **Solution**: Implement proper logout flow or email verification before allowing invitation acceptance

- [ ] **HIGH**: Insufficient Input Sanitization - Potential for injection attacks in form inputs
  - **File**: Various form components (signup, job creation, etc.)
  - **Priority**: High
  - **Category**: Security
  - **Description**: Input validation may not be comprehensive across all form submissions
  - **Solution**: Implement comprehensive input sanitization and validation on both client and server

- [ ] **MEDIUM**: Session Management - No explicit session timeout configuration
  - **File**: `middleware.ts`, `src/context/auth-context.tsx`
  - **Priority**: Medium
  - **Category**: Security
  - **Description**: Session timeout configuration not explicitly defined
  - **Solution**: Configure explicit session timeout values and implement proper session cleanup

### Architecture Red Flags

- [ ] **HIGH**: Tightly Coupled Components - Some components may be too dependent on specific data structures
  - **File**: Various components in `src/components/`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Components directly access Supabase tables creating tight coupling
  - **Solution**: Abstract data access to service layer

- [ ] **MEDIUM**: Inconsistent Error Handling - Error handling patterns vary across components
  - **File**: Multiple components (interview-candidates-list.tsx, job-candidates.tsx, etc.)
  - **Priority**: Medium
  - **Category**: Architecture
  - **Description**: Different components use different error handling approaches
  - **Solution**: Create consistent error handling patterns and utilities

- [ ] **HIGH**: Large Component Files - Some components exceed recommended size limits (>500 lines)
  - **File**: `src/components/screening-settings.tsx`, `src/components/interview-settings-sheet.tsx`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Components are too large and should be broken down
  - **Solution**: Break down large components into smaller, more manageable pieces

- [ ] **MEDIUM**: Missing Type Safety - Some API responses may not be fully typed
  - **File**: Various API route files in `src/app/api/`
  - **Priority**: Medium
  - **Category**: Architecture
  - **Description**: API responses may not have proper type definitions
  - **Solution**: Add comprehensive type definitions for all API responses

### Performance Red Flags

- [ ] **HIGH**: N+1 Query Problem - Potential for multiple database queries in loops
  - **File**: `src/components/interview-candidates-list.tsx`, various dashboard components
  - **Priority**: High
  - **Category**: Performance
  - **Description**: Multiple individual queries instead of batch queries
  - **Solution**: Use joins or batch queries where possible

- [ ] **MEDIUM**: Unoptimized Data Fetching - Server components may fetch more data than needed
  - **File**: `src/app/(dashboard)/page.tsx`, other server components
  - **Priority**: Medium
  - **Category**: Performance
  - **Description**: Server components may fetch more data than needed for initial render
  - **Solution**: Optimize data fetching to only retrieve necessary data

- [ ] **MEDIUM**: Memory Leaks - Event listeners and subscriptions may not be properly cleaned up
  - **File**: `src/components/schedule-interview-dialog.tsx:371-374`, `src/components/interview-candidates-list.tsx:129-131`
  - **Priority**: Medium
  - **Category**: Performance
  - **Description**: Event listeners and Supabase channels may not be properly unsubscribed
  - **Solution**: Ensure all event listeners and subscriptions are properly cleaned up in useEffect cleanup functions

### Maintenance Red Flags

- [ ] **MEDIUM**: Inconsistent Naming - Variable and function naming conventions may vary
  - **File**: Various files throughout the codebase
  - **Priority**: Medium
  - **Category**: Maintainability
  - **Description**: Inconsistent naming conventions across files
  - **Solution**: Establish and enforce consistent naming conventions

- [ ] **HIGH**: Duplicated Logic - Similar logic exists across multiple components
  - **File**: Auth logic in multiple places, data fetching patterns
  - **Priority**: High
  - **Category**: Maintainability
  - **Description**: Authentication and data fetching logic duplicated across components
  - **Solution**: Create reusable hooks and services for common logic

- [ ] **MEDIUM**: Hardcoded Values - Magic numbers and strings scattered throughout codebase
  - **File**: Various component files
  - **Priority**: Medium
  - **Category**: Maintainability
  - **Description**: Magic numbers and strings used instead of constants
  - **Solution**: Extract hardcoded values to constants or configuration files

### Scalability Red Flags

- [ ] **HIGH**: Database Bottlenecks - Complex RPC functions may not scale well
  - **File**: Various RPC functions in database
  - **Priority**: High
  - **Category**: Scalability
  - **Description**: Complex RPC functions could become performance bottlenecks
  - **Solution**: Optimize database queries and consider caching strategies

- [ ] **MEDIUM**: State Management - Global state may become unwieldy as app grows
  - **File**: `src/store/auth-store.ts`, context files
  - **Priority**: Medium
  - **Category**: Scalability
  - **Description**: Multiple state management solutions could become complex
  - **Solution**: Standardize on one state management approach and optimize

---

## Empty State Handling Issues

- [ ] **MEDIUM**: Missing empty state in admin tasks table
  - **File**: `src/components/admin-tasks-table.tsx`
  - **Priority**: Medium
  - **Category**: UX
  - **Description**: No empty state handling when no tasks are available
  - **Solution**: Add empty state component when tasks array is empty

- [ ] **MEDIUM**: Missing empty state in job funnel visualizations
  - **File**: `src/components/job-funnel-visualizations.tsx`
  - **Priority**: Medium
  - **Category**: UX
  - **Description**: No empty state handling when no funnel data is available
  - **Solution**: Add empty state visualization when no data exists

- [ ] **MEDIUM**: Missing empty state in assessment analytics
  - **File**: `src/components/assessment-analytics.tsx`
  - **Priority**: Medium
  - **Category**: UX
  - **Description**: No empty state handling when no assessment data is available
  - **Solution**: Add empty state visualization when no assessment data exists

- [ ] **MEDIUM**: Missing empty state in interview analytics
  - **File**: `src/components/interview-analytics.tsx`
  - **Priority**: Medium
  - **Category**: UX
  - **Description**: While some empty state exists, it may not cover all scenarios
  - **Solution**: Ensure comprehensive empty state handling for all data absence scenarios

- [ ] **MEDIUM**: Missing empty state in candidate info component
  - **File**: `src/components/candidate-info.tsx`
  - **Priority**: Medium
  - **Category**: UX
  - **Description**: No empty state handling when no candidate data is available
  - **Solution**: Add empty state component when no candidate data exists

- [ ] **MEDIUM**: Missing empty state in MCQ components
  - **File**: `src/components/mcq-assessment.tsx`, `src/components/mcq-overview.tsx`, `src/components/mcq-questions.tsx`
  - **Priority**: Medium
  - **Category**: UX
  - **Description**: No empty state handling when no MCQ data is available
  - **Solution**: Add empty state components for MCQ sections

- [ ] **MEDIUM**: Missing empty state in video assessment
  - **File**: `src/components/video-assessment.tsx`
  - **Priority**: Medium
  - **Category**: UX
  - **Description**: No empty state handling when no video assessment data is available
  - **Solution**: Add empty state component when no video assessment data exists

- [ ] **MEDIUM**: Missing empty state in panelist review
  - **File**: `src/components/panelist-review.tsx`
  - **Priority**: Medium
  - **Category**: UX
  - **Description**: No empty state handling when no panelist review data is available
  - **Solution**: Add empty state component when no panelist review data exists

- [ ] **MEDIUM**: Missing empty state in job overview analytics
  - **File**: `src/components/job-overview-analytics.tsx`
  - **Priority**: Medium
  - **Category**: UX
  - **Description**: No empty state handling when no job overview analytics data is available
  - **Solution**: Add empty state component when no job overview analytics data exists

---

## Error State Handling Issues

- [ ] **HIGH**: Inconsistent error handling in API routes
  - **File**: Multiple files in `src/app/api/`
  - **Priority**: High
  - **Category**: UX
  - **Description**: Error responses vary in format and content across API routes
  - **Solution**: Standardize error response format across all API routes

- [ ] **MEDIUM**: Missing error boundaries in dashboard components
  - **File**: `src/app/(dashboard)/layout.tsx`, dashboard page components
  - **Priority**: Medium
  - **Category**: UX
  - **Description**: No error boundaries to catch unexpected errors in dashboard
  - **Solution**: Add error boundaries to catch and gracefully handle component errors

- [ ] **MEDIUM**: Insufficient error handling in job creation flow
  - **File**: `src/app/(dashboard)/jobs/create-job-post/page.tsx`, `src/components/basic-job-information.tsx`, `src/components/screening-settings.tsx`, `src/components/review-and-publish.tsx`
  - **Priority**: Medium
  - **Category**: UX
  - **Description**: Error states not comprehensively handled in job creation flow
  - **Solution**: Add comprehensive error handling throughout job creation flow

- [ ] **MEDIUM**: Missing error state in analytics components
  - **File**: `src/components/assessment-analytics.tsx`, `src/components/interview-analytics.tsx`, `src/components/job-analytics.tsx`
  - **Priority**: Medium
  - **Category**: UX
  - **Description**: No error state handling when analytics data fetch fails
  - **Solution**: Add error state components for analytics when data fetch fails

- [ ] **MEDIUM**: Missing error state in candidate components
  - **File**: `src/components/candidate-info.tsx`, `src/components/job-candidates.tsx`
  - **Priority**: Medium
  - **Category**: UX
  - **Description**: No error state handling when candidate data fetch fails
  - **Solution**: Add error state components for candidate sections when data fetch fails

- [ ] **MEDIUM**: Missing error state in interview components
  - **File**: `src/components/interview-candidates-list.tsx`, `src/components/schedule-interview-dialog.tsx`
  - **Priority**: Medium
  - **Category**: UX
  - **Description**: No error state handling when interview data fetch fails
  - **Solution**: Add error state components for interview sections when data fetch fails

- [ ] **MEDIUM**: Missing error state in MCQ components
  - **File**: `src/components/mcq-assessment.tsx`, `src/components/mcq-overview.tsx`, `src/components/mcq-questions.tsx`
  - **Priority**: Medium
  - **Category**: UX
  - **Description**: No error state handling when MCQ data fetch fails
  - **Solution**: Add error state components for MCQ sections when data fetch fails

- [ ] **MEDIUM**: Missing error state in video assessment
  - **File**: `src/components/video-assessment.tsx`
  - **Priority**: Medium
  - **Category**: UX
  - **Description**: No error state handling when video assessment data fetch fails
  - **Solution**: Add error state component for video assessment when data fetch fails

- [ ] **MEDIUM**: Missing error state in panelist review
  - **File**: `src/components/panelist-review.tsx`
  - **Priority**: Medium
  - **Category**: UX
  - **Description**: No error state handling when panelist review data fetch fails
  - **Solution**: Add error state component for panelist review when data fetch fails

---

## Direct Supabase Table Access (Non-RPC)

### API Routes

- [ ] **HIGH**: Direct table access in check-user-info API
  - **File**: `src/app/api/check-user-info/route.ts:17-21`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Direct access to `admin_user_info` table instead of using RPC
  - **Solution**: Create an RPC function to encapsulate this query logic

- [ ] **MEDIUM**: Direct table access in application distribution API
  - **File**: `src/app/api/application-distribution/route.ts:17-21`
  - **Priority**: Medium
  - **Category**: Architecture
  - **Description**: Direct access to `admin_user_info` table to get school_id
  - **Solution**: Consider using an RPC function to get user school information

### Components and Pages

- [ ] **HIGH**: Direct table access in auth guard
  - **File**: `src/components/auth-guard.tsx:29-33`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Direct access to `admin_user_info` table for school_id check
  - **Solution**: Create an RPC function to check user school association

- [ ] **HIGH**: Direct table access in dashboard layout
  - **File**: `src/app/(dashboard)/layout.tsx:76-80`, `src/app/(dashboard)/layout.tsx:101-105`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Direct access to `school_info` and `admin_user_info` tables
  - **Solution**: Create RPC functions to get school and user information

- [ ] **HIGH**: Direct table access in dashboard page
  - **File**: `src/app/(dashboard)/page.tsx:99-103`, `src/app/(dashboard)/page.tsx:114-117`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Direct access to `admin_user_info` and `jobs` tables
  - **Solution**: Create RPC functions to get dashboard data

- [ ] **HIGH**: Direct table access in analytics page
  - **File**: `src/app/(dashboard)/analytics/page.tsx:53-56`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Direct access to `admin_user_info` table
  - **Solution**: Create an RPC function to get analytics data with proper access controls

- [ ] **HIGH**: Direct table access in candidates page
  - **File**: `src/app/(dashboard)/candidates/page.tsx:83-86`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Direct access to `admin_user_info` table
  - **Solution**: Create an RPC function to get candidate data

- [ ] **HIGH**: Direct table access in job application layout
  - **File**: `src/app/(dashboard)/jobs/[jobId]/[applicationId]/layout.tsx:196-199`, `src/app/(dashboard)/jobs/[jobId]/[applicationId]/layout.tsx:271-274`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Direct access to `application_ai_evaluations` and `jobs` tables
  - **Solution**: Create RPC functions to get application and job data

- [ ] **HIGH**: Direct table access in job layout
  - **File**: `src/app/(dashboard)/jobs/[jobId]/layout.tsx:127-130`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Direct access to `jobs` table
  - **Solution**: Create an RPC function to get job data

- [ ] **HIGH**: Direct table access in job creation page
  - **File**: `src/app/(dashboard)/jobs/create-job-post/page.tsx:211-214`, `src/app/(dashboard)/jobs/create-job-post/page.tsx:517-520`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Direct access to `admin_user_info` and `job_meeting_settings` tables
  - **Solution**: Create RPC functions to get user and meeting settings data

- [ ] **HIGH**: Direct table access in account settings
  - **File**: `src/app/(dashboard)/settings/account/page.tsx:30-33`, `src/app/(dashboard)/settings/account/page.tsx:115-118`, `src/app/(dashboard)/settings/account/page.tsx:135-138`, `src/app/(dashboard)/settings/account/page.tsx:144-147`, `src/app/(dashboard)/settings/account/page.tsx:149-152`, `src/app/(dashboard)/settings/account/page.tsx:159-162`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Direct access to `admin_user_info` and `profiles` tables
  - **Solution**: Create RPC functions to handle account data operations

- [ ] **HIGH**: Direct table access in interview settings
  - **File**: `src/app/(dashboard)/settings/interviews/page.tsx:60-63`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Direct access to `admin_user_info` table
  - **Solution**: Create an RPC function to get interview settings data

- [ ] **HIGH**: Direct table access in notification settings
  - **File**: `src/app/(dashboard)/settings/notifications/page.tsx:57-60`, `src/app/(dashboard)/settings/notifications/page.tsx:90-93`, `src/app/(dashboard)/settings/notifications/page.tsx:133-136`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Direct access to `admin_user_info` and `school_info` tables
  - **Solution**: Create RPC functions to handle notification settings data

- [ ] **HIGH**: Direct table access in school information settings
  - **File**: `src/app/(dashboard)/settings/school-information/page.tsx:27-30`, `src/app/(dashboard)/settings/school-information/page.tsx:43-46`, `src/app/(dashboard)/settings/school-information/page.tsx:214-217`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Direct access to `admin_user_info` and `school_info` tables
  - **Solution**: Create RPC functions to handle school information data

- [ ] **HIGH**: Direct table access in interview candidates list
  - **File**: `src/components/interview-candidates-list.tsx:35-38`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Direct access to `admin_user_info` table
  - **Solution**: Create an RPC function to get interview candidate data

- [ ] **HIGH**: Direct table access in dashboard table
  - **File**: `src/components/dashboard-table.tsx:83-86`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Direct access to `jobs` table for count
  - **Solution**: Create an RPC function to get job count data

- [ ] **HIGH**: Direct table access in various utility functions
  - **File**: `src/lib/supabase/api/get-job-application-scores.ts:36-42`, `src/lib/supabase/api/get-mcq-details.ts:58-62`, `src/lib/supabase/api/get-mcq-details.ts:72-76`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Direct access to `job_applications` and `job_questionnaires` tables
  - **Solution**: Create RPC functions to encapsulate these data access patterns

---

## Business Logic in Components/Pages

### Pages

- [ ] **HIGH**: Business logic in dashboard layout
  - **File**: `src/app/(dashboard)/layout.tsx:94-138`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: School ID checking and fetching logic mixed with UI rendering
  - **Solution**: Move school ID checking logic to a custom hook or service

- [ ] **HIGH**: Business logic in dashboard page
  - **File**: `src/app/(dashboard)/page.tsx:139-167`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Data fetching and validation logic mixed with UI rendering
  - **Solution**: Move data fetching logic to custom hooks or services

- [ ] **HIGH**: Business logic in job application layout
  - **File**: `src/app/(dashboard)/jobs/[jobId]/[applicationId]/layout.tsx:182-218`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Application data fetching and processing logic in component
  - **Solution**: Move application data logic to a custom hook or service

- [ ] **HIGH**: Business logic in job layout
  - **File**: `src/app/(dashboard)/jobs/[jobId]/layout.tsx:104-153`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Job details fetching and processing logic in component
  - **Solution**: Move job details logic to a custom hook or service

- [ ] **HIGH**: Business logic in job candidates component
  - **File**: `src/components/job-candidates.tsx:90-130`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Application fetching and validation logic in component
  - **Solution**: Move application logic to a custom hook or service

### Components

- [ ] **HIGH**: Business logic in auth guard
  - **File**: `src/components/auth-guard.tsx:18-44`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Authentication and authorization logic mixed with UI concerns
  - **Solution**: Move auth logic to a custom hook or service

- [ ] **HIGH**: Business logic in interview candidates list
  - **File**: `src/components/interview-candidates-list.tsx:44-141`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Application fetching and infinite scrolling logic in component
  - **Solution**: Move data fetching and scrolling logic to a custom hook

- [ ] **HIGH**: Business logic in schedule interview dialog
  - **File**: `src/components/schedule-interview-dialog.tsx:377-398`
  - **Priority**: High
  - **Category**: Architecture
  - **Description**: Scroll and resize handling logic mixed with UI concerns
  - **Solution**: Move event handling logic to a custom hook

- [ ] **MEDIUM**: Business logic in login form
  - **File**: `src/app/login/LoginForm.tsx:60-67`
  - **Priority**: Medium
  - **Category**: Architecture
  - **Description**: User redirect logic mixed with form rendering
  - **Solution**: Move redirect logic to a custom hook

- [ ] **MEDIUM**: Business logic in signup form
  - **File**: `src/components/signup-form.tsx:107-109`
  - **Priority**: Medium
  - **Category**: Architecture
  - **Description**: Redirect URL construction logic mixed with form rendering
  - **Solution**: Move redirect logic to a custom hook

---

## Unnecessary Re-renders

### Components with Potential Performance Issues

- [x] **MEDIUM**: Potential unnecessary re-renders in dashboard layout - FIXED
  - **File**: `src/app/(dashboard)/layout.tsx:140-142`
  - **Priority**: Medium
  - **Category**: Performance
  - **Description**: Effect hook dependency on useCallback function that might cause re-renders
  - **Solution**: Optimized effect dependencies by replacing checkSchoolId dependency with its individual dependencies (user, loading, initialAuthCheckDone)

- [x] **MEDIUM**: Potential unnecessary re-renders in login form - FIXED
  - **File**: `src/app/login/LoginForm.tsx:60-67`
  - **Priority**: Medium
  - **Category**: Performance
  - **Description**: Effect hook with multiple dependencies that might cause frequent re-renders
  - **Solution**: Optimized effect dependencies by removing stable `router` from dependency array

- [ ] **MEDIUM**: Potential unnecessary re-renders in interview candidates list
  - **File**: `src/components/interview-candidates-list.tsx:105-105`
  - **Priority**: Medium
  - **Category**: Performance
  - **Description**: Effect hook with dependencies that might cause unnecessary updates
  - **Solution**: Use useCallback for functions and optimize dependencies

- [ ] **MEDIUM**: Real-time listener causing potential re-renders
  - **File**: `src/components/interview-candidates-list.tsx:108-132`
  - **Priority**: Medium
  - **Category**: Performance
  - **Description**: Real-time listener causing frequent re-fetches and re-renders
  - **Solution**: Implement debouncing/throttling for real-time updates

- [ ] **MEDIUM**: Scroll and resize handlers causing re-renders
  - **File**: `src/components/schedule-interview-dialog.tsx:377-398`
  - **Priority**: Medium
  - **Category**: Performance
  - **Description**: Event handlers in effect causing potential performance issues
  - **Solution**: Memoize event handlers and optimize update frequency

### General Performance Improvements

- [ ] **LOW**: Component memoization opportunities
  - **File**: Various components throughout the codebase
  - **Priority**: Low
  - **Category**: Performance
  - **Description**: Components that could benefit from React.memo to prevent unnecessary re-renders
  - **Solution**: Apply React.memo to components with stable props

- [ ] **LOW**: Callback memoization opportunities
  - **File**: Various components throughout the codebase
  - **Priority**: Low
  - **Category**: Performance
  - **Description**: Functions that could benefit from useCallback to prevent unnecessary re-renders
  - **Solution**: Apply useCallback to functions passed as props to child components

---

## Priority Summary

### Critical Priority (Address Immediately)
- Open Redirect Vulnerability in login redirect validation
- Email mismatch warning for invitations
- Direct table access in auth guard and dashboard layout
- Business logic in dashboard layout and page components

### High Priority (Address Soon)
- Insufficient input sanitization
- Tightly coupled components
- Large component files
- N+1 query problems
- Duplicated logic
- Database bottlenecks
- Direct table access in multiple locations
- Business logic in components/pages

### Medium Priority (Address in Next Iteration)
- Inconsistent error handling
- Missing empty/error states in various components
- Session management configuration
- Memory leaks in event listeners
- Inconsistent naming conventions
- Hardcoded values
- State management complexity
- Unnecessary re-renders in components
- Scroll/resize handler optimizations

### Low Priority (Address Later)
- Component memoization opportunities
- Callback memoization opportunities
- Minor UI/UX improvements
