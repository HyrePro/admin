# Jobs Table Component Architecture Documentation

## 1. Component Overview

The Jobs Table component is a comprehensive table-based UI component that displays job listings with filtering, sorting, pagination, and action capabilities. It's used in the main jobs page to display all jobs available to the authenticated user.

### Key Features:
- Search and filter capabilities
- Sorting by multiple columns
- Pagination with page navigation
- Loading states with skeleton UI
- Action buttons (copy link, view details)
- Responsive design
- Empty state handling
- Error state handling

## 2. Page-wise Component Breakdown and Structure

### 2.1 Main Jobs Page (`/src/app/(dashboard)/jobs/page.tsx`)
- **Component**: `JobsPage`
- **Purpose**: Main page that fetches job data and renders the JobsTable component
- **Structure**:
  - Header with title and "Create New Job Post" button
  - Container for JobsTable component
  - State management for jobs, loading, error, and total count
  - Authentication integration via `useAuth` hook

### 2.2 Jobs Table Component (`/src/components/jobs-table.tsx`)
- **Component**: `JobsTable`
- **Purpose**: Core table component with all UI and interaction logic
- **Structure**:
  - Search input field with debounced filtering
  - Status filter dropdown for job status filtering
  - Sortable table headers with sort indicators
  - Paginated job data rows with detailed information
  - Action buttons per row (copy link, view details)
  - Pagination controls with page navigation
  - Loading and empty states with skeleton components
  - Responsive design for different screen sizes

### 2.3 Job Detail Layout (`/src/app/(dashboard)/jobs/[jobId]/layout.tsx`)
- **Component**: `JobLayout`
- **Purpose**: Layout for individual job detail pages with navigation and context
- **Structure**:
  - Breadcrumb navigation from jobs list to specific job
  - Job title and status badge with color coding
  - Action buttons (edit, change status, share link)
  - Tab navigation (Overview, Candidates, Analytics)
  - Context provider for job data sharing across tabs
  - Error and loading state handling

### 2.4 Job Detail Pages
- **Candidates Page**: Displays job candidates using `JobCandidates` component with dynamic loading
- **Analytics Page**: Displays job analytics using `JobOverviewAnalytics` component
- **Application Detail Pages**: Individual application views with assessment, panelist review, etc.

### 2.5 Create Job Pages
- **Create Job Post**: Multi-step form for creating new job posts
- **Success Page**: Confirmation page after successful job creation

## 3. Complete API Call Mapping

### 3.1 Data Fetching APIs

#### `/api/jobs`
- **Method**: GET
- **Purpose**: Fetch paginated list of jobs with analytics
- **Parameters**:
  - `status`: Job status filter (ALL, OPEN, IN_PROGRESS, COMPLETED, SUSPENDED, PAUSED, APPEALED)
  - `startIndex`: Start index for pagination
  - `endIndex`: End index for pagination
- **Response**: Array of job objects with analytics data
- **Usage**: Called from `JobsPage` component during initial load and refresh

#### `/api/get-job-count`
- **Method**: GET
- **Purpose**: Get count of jobs based on filters
- **Parameters**:
  - `status`: Job status filter
  - `search`: Search query for filtering
- **Response**: Count of jobs matching criteria
- **Usage**: Called from `JobsTable` component via `getJobCount` function for dynamic count updates

#### `/api/get-total-job-count`
- **Method**: GET
- **Purpose**: Get total count of all jobs for the user's school
- **Response**: Total job count
- **Usage**: Called from `JobsPage` component for display in header

#### `/api/job-analytics`
- **Method**: GET
- **Purpose**: Get detailed analytics for a specific job
- **Parameters**:
  - `jobId`: ID of the job to fetch analytics for
  - `type`: Type of analytics (overview, funnel)
- **Response**: Detailed analytics data for the job
- **Usage**: Called from analytics pages to display performance metrics

#### `/api/create-job`
- **Method**: POST
- **Purpose**: Create a new job posting
- **Payload**: Complete job posting information including title, description, requirements, etc.
- **Response**: Created job ID and success message
- **Usage**: Called from create job form when publishing a new job

#### `/api/update-job`
- **Method**: PUT
- **Purpose**: Update existing job posting
- **Payload**: Job ID and fields to update
- **Response**: Updated job information
- **Usage**: Called when editing job details

#### `/api/job-interview-settings`
- **Method**: GET/POST
- **Purpose**: Get or update interview settings for a job
- **Parameters/Payload**: Job ID and interview settings
- **Response**: Interview settings data
- **Usage**: Used for configuring interview scheduling for specific jobs

## 4. Database Query Calls and Relationships

### 4.1 Core Tables
- **`jobs` table**: Main job listings table
  - Contains: id, title, status, job_type, mode, grade_levels, subjects, salary_range, openings, job_description, assessment_difficulty, created_at, school_id, etc.
- **`job_meeting_settings` table**: Stores interview settings for each job
- **`job_application_analytics` view**: Provides analytics data for each job

### 4.2 Related Tables
- **`admin_user_info`**: Contains school_id for user authentication
- **`job_applications`**: Stores applications for each job
- **`interview_schedules`**: Stores scheduled interviews
- **`schools`**: Contains school information

### 4.3 Supabase RPC Functions
- **`get_jobs_with_analytics`**: Retrieves jobs with associated analytics data
- **`get_job_with_analytics`**: Retrieves single job with analytics data
- **`get_job_analytics`**: Retrieves detailed analytics for a job
- **`get_job_count`**: Counts jobs based on criteria

## 5. Empty State UI Design and Implementation

### 5.1 Empty State Implementation
```jsx
{paginatedJobs.length === 0 ? (
  <TableRow>
    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
      No jobs found matching your criteria
    </TableCell>
  </TableRow>
) : ( ... )}
```

### 5.2 Empty State Characteristics
- Displayed when no jobs match current filters
- Shows centered message with appropriate styling
- Maintains table structure with colspan
- Uses subtle gray text for visual consistency
- Maintains responsive design across screen sizes

### 5.3 Empty State Scenarios
- **No Jobs Created**: When user has no jobs in the system
- **No Filter Matches**: When applied filters return no results
- **Search Results**: When search query returns no matches
- **Status Filter**: When specific status filter returns no results

## 6. Error State UI Handling

### 6.1 Error Handling Implementation
- **API Error Handling**: Errors caught in `JobsPage` component and displayed as toast notifications
- **Loading Error States**: Components display appropriate error messages
- **Network Error Handling**: Proper error boundaries and fallbacks
- **Authentication Errors**: Redirects or prompts for login when needed

### 6.2 Error State Characteristics
- **Toast Notifications**: User feedback for API errors
- **Error Boundaries**: Prevent component crashes
- **Graceful Degradation**: Fallback UI when errors occur
- **Clear Messaging**: Descriptive error messages to help users understand issues

### 6.3 Error Types Handled
- **Network Errors**: Connectivity issues, timeout errors
- **API Errors**: Server errors, invalid responses
- **Authentication Errors**: Session expired, unauthorized access
- **Validation Errors**: Invalid input data

## 7. Application State Management and Data Flow

### 7.1 State Management Structure

#### In `JobsPage` Component:
- `jobs`: Array of job objects
- `loading`: Boolean for loading state
- `totalJobsCount`: Number for total job count
- `error`: String for error messages
- `auth state`: User authentication information from context

#### In `JobsTable` Component:
- `searchQuery`: String for search input
- `statusFilter`: String for status filter
- `sortConfig`: Object for sorting configuration
- `currentPage`: Number for current page
- `pageSize`: Number for items per page
- `filteredJobs`: Array of filtered jobs
- `filteredJobCount`: Number of filtered jobs

### 7.2 Data Flow
1. **Data Fetching**: `JobsPage` fetches data from `/api/jobs`
2. **Data Processing**: `JobsTable` processes data with filters, sorting, and pagination
3. **User Interaction**: User actions update component state
4. **State Updates**: State changes trigger re-renders with updated data
5. **API Calls**: Filter/sort changes trigger new API calls for job counts
6. **Context Sharing**: Job data shared via context in detail views

### 7.3 Memoization Strategy
- `useMemo` for filtered jobs array
- `useMemo` for sorted jobs array
- `useMemo` for paginated jobs array
- Prevents unnecessary re-computations during renders

### 7.4 Performance Optimizations
- Client-side filtering and sorting for responsive UI
- Pagination to handle large datasets
- Skeleton loading states for better UX
- Debounced search for API efficiency
- Memoized components to prevent unnecessary renders

This architecture provides a scalable and maintainable structure for managing job listings with comprehensive UI and interaction capabilities.