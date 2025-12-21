# Candidate Comments Feature Migration

This migration adds the candidate comments feature to the application.

## Files

1. `006_create_candidate_comments_table.sql` - Creates the candidate_comments table with proper indexes and RLS policies, plus functions for CRUD operations

## How to Apply

To apply this migration to your Supabase database:

1. Open the Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `006_create_candidate_comments_table.sql`
4. Run the SQL script
5. Verify the table and functions are created successfully

## Table Structure

### candidate_comments

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key with default gen_random_uuid() |
| user_id | UUID | References admin_user_info(id) |
| school_id | UUID | References schools(id) |
| application_id | UUID | References job_applications(id) |
| comment | TEXT | The comment content |
| mentioned_ids | TEXT[] | Array of user IDs mentioned in the comment |
| created_at | TIMESTAMP WITH TIME ZONE | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | Last update timestamp |

## Functions

1. `insert_candidate_comment` - Insert a new comment
2. `get_candidate_comments` - Retrieve comments for an application
3. `update_candidate_comment` - Update an existing comment
4. `delete_candidate_comment` - Delete a comment

## Security

Row Level Security (RLS) policies ensure:
- Users can only view comments for their school
- Users can only insert comments for their school
- Users can only update/delete their own comments