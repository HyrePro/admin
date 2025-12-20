// Simple test script to verify KPI functionality
// Run with: node scripts/test_kpis.js

const { createClient } = require('@supabase/supabase-js');

// Configuration - Update with your Supabase credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testKPIFunction() {
  try {
    // Get a sample school ID from the database
    const { data: schools, error: schoolError } = await supabase
      .from('school_info')
      .select('id')
      .limit(1);

    if (schoolError) {
      console.error('Error fetching school:', schoolError);
      return;
    }

    if (!schools || schools.length === 0) {
      console.log('No schools found in database');
      return;
    }

    const schoolId = schools[0].id;
    console.log(`Testing KPI function for school ID: ${schoolId}`);

    // Test the function with different periods
    const periods = ['all', 'month', 'week', 'day'];
    
    for (const period of periods) {
      console.log(`\n--- Testing period: ${period} ---`);
      
      const { data, error } = await supabase.rpc('get_school_kpis', {
        school_id: schoolId,
        period: period
      });

      if (error) {
        console.error(`Error for period ${period}:`, error);
      } else {
        console.log(`Success for period ${period}:`, JSON.stringify(data, null, 2));
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testKPIFunction();