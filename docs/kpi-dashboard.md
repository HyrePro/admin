# KPI Dashboard Documentation

## Overview

The KPI Dashboard provides school administrators with comprehensive insights into their hiring process performance. It displays key metrics and visualizations to help track recruitment effectiveness.

## Features

### KPI Cards
- **Active Campaigns**: Number of currently open job positions
- **Successful Campaigns**: Number of positions that have been filled with offers
- **Failed Campaigns**: Number of closed positions without offers
- **Avg. Time to Hire**: Average number of days from job creation to offer acceptance

### Interactive Charts

1. **Campaign Status** (Pie Chart)
   - Distribution of job campaigns by status (Active, Successful, Failed)

2. **Candidate Pipeline** (Bar Chart)
   - Number of candidates at each stage (Assessment, Interview, Offered)

3. **Section-wise Performance** (Bar Chart)
   - Average performance across different assessment sections:
     - Pedagogy
     - Communication
     - Digital Literacy
     - Subject Knowledge

4. **Gender Distribution** (Pie Chart)
   - Distribution of candidates by gender (Male, Female, Other)

### Offer Ratios
- **Offer Acceptance Rate**: Percentage of offers that were accepted
- **Offer Decline Rate**: Percentage of offers that were declined

## Time Period Filtering

The dashboard includes a filter to view data for specific time periods:
- **Last 24 Hours**
- **Last Week**
- **Last Month**
- **All Time**

## Technical Implementation

### Backend
- PostgreSQL function `get_school_kpis(school_id, period)` that calculates all metrics
- REST API endpoint at `/api/school-kpis` to expose the data

### Frontend
- React component using Recharts for data visualization
- shadcn/ui components for UI elements
- Responsive design that works on all device sizes

## Data Sources

The KPIs are calculated using data from the following database tables:
- `jobs`: Job campaign information
- `job_applications`: Candidate applications and statuses
- `offer_letters`: Offer generation and acceptance
- `application_rejection`: Declined offers
- `applicant_info`: Candidate demographic information
- `application_questionnaires`: Assessment results

## Usage

To use the KPI dashboard:
1. Navigate to the Analytics section in the admin dashboard
2. The dashboard will automatically load data for your school
3. Use the time period filter to adjust the data range
4. Interact with charts to explore detailed information