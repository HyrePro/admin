// Test script for candidate comments functionality
// Run with: node scripts/test_candidate_comments.js

const { createClient } = require('@supabase/supabase-js');

// Configuration - Update with your Supabase credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testCandidateComments() {
  try {
    console.log('Testing candidate comments functionality...');
    
    // Get a sample application ID from the database
    const { data: applications, error: appError } = await supabase
      .from('job_applications')
      .select('id')
      .limit(1);

    if (appError) {
      console.error('Error fetching application:', appError);
      return;
    }

    if (!applications || applications.length === 0) {
      console.log('No applications found in database');
      return;
    }

    const applicationId = applications[0].id;
    console.log(`Testing with application ID: ${applicationId}`);
    
    // Test inserting a comment
    console.log('\n1. Testing insert_candidate_comment function...');
    const { data: insertData, error: insertError } = await supabase.rpc('insert_candidate_comment', {
      p_user_id: '00000000-0000-0000-0000-000000000000', // Sample user ID
      p_school_id: '00000000-0000-0000-0000-000000000000', // Sample school ID
      p_application_id: applicationId,
      p_comment: 'This is a test comment',
      p_mentioned_ids: ['user1', 'user2']
    });
    
    if (insertError) {
      console.error('Error inserting comment:', insertError);
      return;
    }
    
    console.log('Insert successful. Comment ID:', insertData);
    
    // Test fetching comments
    console.log('\n2. Testing get_candidate_comments function...');
    const { data: comments, error: fetchError } = await supabase.rpc('get_candidate_comments', {
      p_application_id: applicationId
    });
    
    if (fetchError) {
      console.error('Error fetching comments:', fetchError);
      return;
    }
    
    console.log('Fetched comments:', comments);
    
    // Test updating a comment (if we have one)
    if (comments && comments.length > 0) {
      const commentId = comments[0].id;
      console.log('\n3. Testing update_candidate_comment function...');
      const { data: updateData, error: updateError } = await supabase.rpc('update_candidate_comment', {
        p_comment_id: commentId,
        p_comment: 'This is an updated test comment',
        p_mentioned_ids: ['user1', 'user3']
      });
      
      if (updateError) {
        console.error('Error updating comment:', updateError);
      } else {
        console.log('Update successful:', updateData);
      }
      
      // Test deleting the comment
      console.log('\n4. Testing delete_candidate_comment function...');
      const { data: deleteData, error: deleteError } = await supabase.rpc('delete_candidate_comment', {
        p_comment_id: commentId
      });
      
      if (deleteError) {
        console.error('Error deleting comment:', deleteError);
      } else {
        console.log('Delete successful:', deleteData);
      }
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testCandidateComments();