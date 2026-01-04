# Jobs Table Component User Manual

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Features and Functionality](#features-and-functionality)
4. [Navigation and Interaction](#navigation-and-interaction)
5. [Common Use Cases](#common-use-cases)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

## Introduction

The Jobs Table Component is a comprehensive tool that allows administrators to manage job postings within the HyrePro platform. This component provides a centralized view of all job listings, enabling users to view, filter, sort, and manage job posts efficiently.

### Purpose
- Display all job listings in a tabular format
- Enable efficient management of job posts
- Provide quick access to job details and analytics
- Allow sharing and management of job listings

### Target Users
- School administrators
- HR personnel
- Recruitment managers
- Job posting coordinators

## Getting Started

### Prerequisites
- Valid login credentials to the HyrePro platform
- Administrative access to job management features
- Stable internet connection

### First-Time User Setup
1. **Log in to the platform**
   - Navigate to the login page
   - Enter your credentials
   - Complete any additional authentication steps

2. **Access the Jobs section**
   - Navigate to the dashboard
   - Click on "Jobs" in the main navigation menu
   - The jobs table will load with all available job listings

3. **Initial view**
   - The table will display all jobs by default
   - Pagination controls will show the total number of jobs
   - You can begin filtering, sorting, or viewing job details immediately

## Features and Functionality

### 1. Job Display
- **Job Title**: Shows the title of the job post
- **Applications**: Displays the number of applications received
- **Status**: Shows the current status of the job (Open, In Progress, Completed, etc.)
- **Created**: Shows the date the job was created
- **Grade Levels**: Lists the grade levels for the position
- **Hiring Manager**: Shows the name of the hiring manager with avatar
- **Actions**: Provides buttons to copy the job link or view details

### 2. Search Functionality
- **Search Bar**: Located at the top of the table
- **Purpose**: Filter jobs by title or grade levels
- **Usage**: Type keywords in the search box to filter results in real-time
- **Results**: Only jobs matching the search criteria will be displayed

### 3. Filtering
- **Status Filter**: Dropdown menu to filter jobs by status
- **Available Statuses**: ALL, OPEN, IN_PROGRESS, COMPLETED, SUSPENDED, PAUSED, APPEALED
- **Functionality**: Select a status to view only jobs with that status

### 4. Sorting
- **Sortable Columns**: Job Title, Applications, Status, Created, Grade Levels, Hiring Manager
- **Sort Indicators**: Up/down arrows indicate sort direction
- **Usage**: Click on column headers to sort by that column
- **Toggle Direction**: Click again to reverse sort order

### 5. Pagination
- **Page Navigation**: Previous/Next buttons to navigate between pages
- **Page Info**: Shows current page and total pages
- **Item Count**: Displays range of jobs shown and total count
- **Page Size**: Fixed at 10 jobs per page

### 6. Action Buttons
- **Copy Link**: Copies the public job application link to clipboard with toast confirmation
- **View Job**: Navigates to the detailed job view page
- **Share Functionality**: Enables easy sharing of job posts with candidates

## Navigation and Interaction

### Basic Navigation
1. **Accessing the Jobs Table**
   - Click on "Jobs" in the main navigation sidebar
   - The jobs table will load automatically

2. **Creating New Jobs**
   - Click the "Create New Job Post" button at the top right
   - This opens the job creation wizard with multiple steps

3. **Viewing Job Details**
   - Click the "View" button in the actions column for a specific job
   - This opens the job detail page with tabs for overview, candidates, and analytics

### Advanced Interactions

#### Filtering Jobs
1. **By Status**:
   - Click the status dropdown (currently showing "All Jobs")
   - Select the desired status from the list
   - The table will update to show only jobs with the selected status

2. **By Search**:
   - Type keywords in the search bar at the top
   - The table will filter in real-time as you type
   - Results will match job titles or grade levels

#### Sorting Jobs
1. **Single Column Sort**:
   - Click on any sortable column header
   - The table will sort by that column in ascending order
   - Click again to sort in descending order

2. **Multi-column Consideration**:
   - Only one column can be sorted at a time
   - Sorting resets when filters are applied

#### Managing Pagination
1. **Navigating Pages**:
   - Use "Previous" and "Next" buttons to move between pages
   - The current page and total pages are displayed
   - Page numbers update automatically

2. **Understanding Counts**:
   - "Showing X to Y of Z jobs" indicates the current view
   - Total count updates when filters are applied

### Job Actions

#### Copying Job Links
1. **Purpose**: Share job postings with candidates
2. **Process**:
   - Find the job in the table
   - Click the copy icon in the actions column
   - A success message will confirm the link has been copied
   - The link can now be pasted and shared

#### Viewing Job Details
1. **Purpose**: Access detailed job information and management tools
2. **Process**:
   - Find the job in the table
   - Click the eye icon in the actions column
   - The job detail page will open with tabs for:
     - Overview: Basic job information and status management
     - Candidates: List of applicants with status and progress
     - Analytics: Job performance metrics and conversion rates

## Common Use Cases

### 1. Daily Job Management
**Scenario**: Review all open job postings
1. Navigate to the Jobs section
2. Apply "OPEN" status filter
3. Review the list of open positions
4. Use the "View" button to check details of specific jobs

### 2. Finding Specific Jobs
**Scenario**: Locate a job by title or grade level
1. Use the search bar to enter keywords
2. The table will filter to show matching results
3. Click "View" to access job details

### 3. Sharing Job Postings
**Scenario**: Distribute a job posting to potential candidates
1. Find the job in the table
2. Click the copy icon in the actions column
3. Share the copied link via email, social media, or other channels

### 4. Monitoring Job Performance
**Scenario**: Check how many applications a job has received
1. Look at the "Applications" column for each job
2. Sort by applications to see highest-performing jobs
3. Click "View" to access detailed analytics

### 5. Bulk Status Review
**Scenario**: Review all jobs of a specific status
1. Use the status filter dropdown
2. Select the desired status
3. Review all jobs with that status
4. Use pagination to navigate through multiple pages if needed

### 6. Creating New Job Postings
**Scenario**: Add a new job to the system
1. Click "Create New Job Post" button
2. Complete the multi-step form:
   - Basic Job Information
   - Screening & Assessment settings
   - Review & Publish
3. Publish the job to make it available to candidates

## Troubleshooting

### Common Issues and Solutions

#### Issue: Jobs not loading
**Symptoms**: Loading spinner shows indefinitely or error message appears
**Solutions**:
1. Check internet connection
2. Refresh the page
3. Verify login status
4. Contact support if the issue persists

#### Issue: Search not working
**Symptoms**: Search results don't update or show incorrect results
**Solutions**:
1. Verify the search term is correct
2. Clear the search and try again
3. Check if special characters are causing issues
4. Ensure sufficient permissions to view jobs

#### Issue: Sorting not functioning
**Symptoms**: Clicking column headers doesn't sort the data
**Solutions**:
1. Refresh the page
2. Check if any filters are interfering
3. Try sorting by a different column
4. Clear all filters and try again

#### Issue: Copy link not working
**Symptoms**: Clicking copy icon doesn't copy the link
**Solutions**:
1. Check browser permissions for clipboard access
2. Try right-clicking and selecting "Copy link address"
3. Use a different browser
4. Ensure JavaScript is enabled

#### Issue: Pagination errors
**Symptoms**: Incorrect page counts or navigation issues
**Solutions**:
1. Refresh the page to reset pagination
2. Clear any active filters
3. Try navigating to the first page, then back to desired page

### Error Messages

#### "Please log in to view jobs"
**Cause**: Session expired or not properly authenticated
**Solution**: Log out and log back in to refresh authentication

#### "No jobs found matching your criteria"
**Cause**: Filters are too restrictive or no jobs match current criteria
**Solution**: Clear filters or adjust search criteria

#### "Failed to copy job link"
**Cause**: Browser security settings preventing clipboard access
**Solution**: Manually copy the link from the job details page

### When to Contact Support
- Persistent loading issues after multiple refreshes
- Authentication problems that don't resolve after re-login
- Data inconsistencies or missing jobs
- Repeated API errors
- Any security-related concerns

## Best Practices

### Efficient Job Management
1. **Use Filters Proactively**: Apply relevant filters before searching to narrow down results
2. **Sort Strategically**: Sort by most relevant column (e.g., applications for popularity, date for recency)
3. **Batch Operations**: Review multiple jobs during single sessions to maximize efficiency
4. **Regular Monitoring**: Check job performance regularly to identify trends

### Data Accuracy
1. **Verify Information**: Always double-check job details before sharing
2. **Keep Information Updated**: Ensure job information remains current
3. **Monitor Application Counts**: Regularly check application numbers for performance insights
4. **Review Statuses**: Keep job statuses updated to reflect current state

### Sharing Best Practices
1. **Verify Links**: Test job links before widespread distribution
2. **Use Analytics**: Monitor job performance through analytics
3. **Strategic Sharing**: Share job links through appropriate channels
4. **Track Results**: Use analytics to understand which sharing methods are most effective

### Security Considerations
1. **Protect Access**: Only share job management access with authorized personnel
2. **Verify Permissions**: Ensure users have appropriate permissions before granting access
3. **Monitor Activity**: Regularly review who has access to job management features
4. **Secure Sharing**: Be cautious when sharing job links externally

### Performance Optimization
1. **Clear Filters When Done**: Remove filters when no longer needed to see all jobs
2. **Use Search Efficiently**: Use specific keywords to find jobs quickly
3. **Manage Page Size**: Be aware of pagination when reviewing large numbers of jobs
4. **Regular Cleanup**: Remove or archive old job listings that are no longer relevant

### Collaboration Tips
1. **Share Relevant Links**: Use the copy link feature to share specific job posts with team members
2. **Document Changes**: Keep track of status changes and important updates
3. **Communicate Updates**: Inform team members of significant changes to job listings
4. **Use Analytics for Team Reporting**: Share performance metrics with relevant stakeholders

This user manual provides comprehensive guidance for effectively using the Jobs Table Component. Regular use of these features will help maximize efficiency in job management tasks.