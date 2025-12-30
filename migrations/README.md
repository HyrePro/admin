# Database Migrations

This directory contains all database migration files for the application.

## Migration Files

- `001_create_invite_codes_table.sql` - Creates the invite_codes table for invite code functionality
- `002_create_generate_invite_code_function.sql` - Creates the function to generate invite codes
- `003_create_cleanup_expired_invite_codes_function.sql` - Creates the function to cleanup expired invite codes
- `004_create_get_invite_data_function.sql` - Creates the function to retrieve invite data
- `005_create_delete_invite_data_function.sql` - Creates the function to delete invite data
- `006_create_candidate_comments_table.sql` - Creates the candidate comments table
- `007_verify_invite_code_function.sql` - Creates the function to verify invite codes
- `008_confirm_join_school_function.sql` - Creates the function to confirm joining a school
- `009_create_invitations_table.sql` - Creates the invitations table for email invitations
- `010_create_create_invitation_function.sql` - Creates the function to handle the entire invitation process