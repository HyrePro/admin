# Database Migrations

This directory contains SQL migration files for setting up the database schema and functions.

## Migration Files

1. `001_create_invite_codes_table.sql` - Creates the invite_codes table with proper indexes and RLS policies
2. `002_create_generate_invite_code_function.sql` - Creates the PostgreSQL function for generating unique invite codes
3. `003_create_cleanup_expired_invite_codes_function.sql` - Creates the PostgreSQL function for cleaning up expired invite codes
4. `004_create_get_invite_data_function.sql` - Creates the PostgreSQL function for retrieving invite data
5. `005_create_delete_invite_data_function.sql` - Creates the PostgreSQL function for deleting invite data

## How to Apply Migrations

To apply these migrations to your Supabase database:

1. Open the Supabase dashboard
2. Go to the SQL Editor
3. Run each migration file in numerical order
4. Verify the tables and functions are created successfully

## Table Structure

### invite_codes
- `id` (UUID) - Primary key
- `code` (TEXT) - Unique 6-character alphanumeric code
- `school_id` (UUID) - Foreign key to schools table
- `created_by` (UUID) - Foreign key to admin_user_info table
- `role` (TEXT) - Role assigned to users who use this code
- `expires_at` (TIMESTAMP) - Expiration timestamp
- `created_at` (TIMESTAMP) - Creation timestamp

## Functions

### generate_invite_code
Generates a unique 6-character alphanumeric invite code and inserts it into the invite_codes table.

Parameters:
- `p_school_id` (UUID) - School ID
- `p_user_id` (UUID) - User ID of creator
- `p_role` (TEXT) - Role to assign
- `p_expires_at` (TIMESTAMP) - Expiration timestamp

Returns:
- `code` (TEXT) - The generated invite code

### cleanup_expired_invite_codes
Automatically removes all expired invite codes from the database.

Parameters:
- None

Returns:
- `deleted_count` (INTEGER) - The number of expired records that were deleted

### get_invite_data
Retrieves all invite codes and invited users for a specific school.

Parameters:
- `p_school_id` (UUID) - School ID

Returns:
- Structured data containing both invite codes and invited users

### delete_invite_data
Safely deletes individual invite codes or invited users.

Parameters:
- `p_school_id` (UUID) - School ID
- `p_item_id` (UUID) - ID of the item to delete
- `p_item_type` (TEXT) - Type of item ('code' or 'user')

Returns:
- `BOOLEAN` - True if deletion was successful