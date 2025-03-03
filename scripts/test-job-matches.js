// Test script for job matches API
const jobId = process.argv[2] || 'c1bfa8c9-ae16-40cf-8a14-8aec5e4c618d'; // Default job ID or use command line argument

// Use environment variable for API URL with fallback to localhost
const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function testJobMatches() {
  try {
    console.log(`Testing job matches API for job ID: ${jobId}`);
    console.log(`Using API URL: ${API_URL}`);
    
    // Test 1: Get job matches
    console.log('\nTest 1: Get job matches');
    const matchesResponse = await fetch(`${API_URL}/api/jobs/${jobId}/matches?exclude_fields=embedding`);
    
    if (!matchesResponse.ok) {
      console.error(`Error: ${matchesResponse.status} ${matchesResponse.statusText}`);
      return;
    }
    
    const matchesData = await matchesResponse.json();
    console.log(`Found ${matchesData.documents?.length || 0} matches`);
    
    // Test 2: Update processed data
    console.log('\nTest 2: Update processed data');
    const updateResponse = await fetch(`${API_URL}/api/jobs/${jobId}/matches?update_stats=true&size=1`);
    
    if (!updateResponse.ok) {
      console.error(`Error: ${updateResponse.status} ${updateResponse.statusText}`);
      return;
    }
    
    console.log('Successfully updated processed data');
    
    // Test 3: Get job details
    console.log('\nTest 3: Get job details');
    const jobResponse = await fetch(`${API_URL}/api/jobs/${jobId}`);
    
    if (!jobResponse.ok) {
      console.error(`Error: ${jobResponse.status} ${jobResponse.statusText}`);
      return;
    }
    
    const jobData = await jobResponse.json();
    console.log('Job processed data:', jobData.processed);
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

testJobMatches(); 