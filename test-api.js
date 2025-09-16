// test-api.js - Run this with Node.js to test your API endpoints
// Usage: node test-api.js

const BASE_URL = 'http://localhost:4000/api';

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    console.log(`\n${options.method || 'GET'} ${endpoint}`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { response, data };
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error.message);
    return { error };
  }
}

async function runTests() {
  console.log('🧪 Starting API Tests...\n');
  console.log('Make sure your Express server is running on port 4000!');

  // Test 1: Health check
  console.log('\n' + '='.repeat(50));
  console.log('TEST 1: Health Check');
  console.log('='.repeat(50));
  await apiRequest('/ping');

  // Test 2: Get all genres
  console.log('\n' + '='.repeat(50));
  console.log('TEST 2: Get All Genres');
  console.log('='.repeat(50));
  const { data: initialGenres } = await apiRequest('/genres');

  // Test 3: Get single genre
  console.log('\n' + '='.repeat(50));
  console.log('TEST 3: Get Single Genre');
  console.log('='.repeat(50));
  if (initialGenres?.data?.[0]?.id || initialGenres?.[0]?.id) {
    const genreId = initialGenres.data?.[0]?.id || initialGenres[0].id;
    await apiRequest(`/genres/${genreId}`);
  }

  // Test 4: Create new genre
  console.log('\n' + '='.repeat(50));
  console.log('TEST 4: Create New Genre');
  console.log('='.repeat(50));
  const newGenre = {
    name: 'Horror',
    description: 'Scary and suspenseful films that thrill audiences',
    image: '/images/horror.jpg'
  };
  
  const { data: createdGenre } = await apiRequest('/genres', {
    method: 'POST',
    body: JSON.stringify(newGenre)
  });

  let createdId = createdGenre?.data?.id;

  // Test 5: Update genre (PUT)
  console.log('\n' + '='.repeat(50));
  console.log('TEST 5: Update Genre (Full Update)');
  console.log('='.repeat(50));
  if (createdId) {
    const updatedGenre = {
      name: 'Horror',
      description: 'Spine-chilling films designed to frighten and create suspense',
      image: '/images/horror-updated.jpg'
    };
    
    await apiRequest(`/genres/${createdId}`, {
      method: 'PUT',
      body: JSON.stringify(updatedGenre)
    });
  }

  // Test 6: Partial update (PATCH)
  console.log('\n' + '='.repeat(50));
  console.log('TEST 6: Partial Update Genre (PATCH)');
  console.log('='.repeat(50));
  if (createdId) {
    const partialUpdate = {
      description: 'Movies that make you sleep with the lights on'
    };
    
    await apiRequest(`/genres/${createdId}`, {
      method: 'PATCH',
      body: JSON.stringify(partialUpdate)
    });
  }

  // Test 7: Search genres
  console.log('\n' + '='.repeat(50));
  console.log('TEST 7: Search Genres');
  console.log('='.repeat(50));
  await apiRequest('/genres?search=action');

  // Test 8: Sort genres
  console.log('\n' + '='.repeat(50));
  console.log('TEST 8: Sort Genres');
  console.log('='.repeat(50));
  await apiRequest('/genres?sort=name&order=desc');

  // Test 9: Create another genre for bulk delete test
  console.log('\n' + '='.repeat(50));
  console.log('TEST 9: Create Another Genre');
  console.log('='.repeat(50));
  const anotherGenre = {
    name: 'Romance',
    description: 'Love stories and romantic comedies'
  };
  
  const { data: anotherCreatedGenre } = await apiRequest('/genres', {
    method: 'POST',
    body: JSON.stringify(anotherGenre)
  });

  let anotherId = anotherCreatedGenre?.data?.id;

  // Test 10: Bulk delete
  console.log('\n' + '='.repeat(50));
  console.log('TEST 10: Bulk Delete Genres');
  console.log('='.repeat(50));
  if (createdId && anotherId) {
    await apiRequest('/genres', {
      method: 'DELETE',
      body: JSON.stringify({ ids: [createdId, anotherId] })
    });
  }

  // Test 11: Error handling - Get non-existent genre
  console.log('\n' + '='.repeat(50));
  console.log('TEST 11: Error Handling - Get Non-existent Genre');
  console.log('='.repeat(50));
  await apiRequest('/genres/999');

  // Test 12: Error handling - Invalid data
  console.log('\n' + '='.repeat(50));
  console.log('TEST 12: Error Handling - Invalid Data');
  console.log('='.repeat(50));
  const invalidGenre = {
    name: '', // Empty name should trigger validation error
    description: 'Test'
  };
  
  await apiRequest('/genres', {
    method: 'POST',
    body: JSON.stringify(invalidGenre)
  });

  // Test 13: Final state - Get all genres
  console.log('\n' + '='.repeat(50));
  console.log('TEST 13: Final State - Get All Genres');
  console.log('='.repeat(50));
  await apiRequest('/genres');

  console.log('\n' + '='.repeat(50));
  console.log('✅ API Tests Completed!');
  console.log('='.repeat(50));
  console.log('\nIf you see this message, your API is working correctly!');
  console.log('You can now use the Vue.js frontend to interact with your API.');
}

// Run the tests
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  global.fetch = fetch;
  runTests().catch(console.error);
} else {
  // Browser environment
  console.log('Run this script in Node.js with: node test-api.js');
}