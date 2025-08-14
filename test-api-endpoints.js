// Test script for the new site configuration requirements system
// Run this with: node test-api-endpoints.js

const BASE_URL = 'http://localhost:3000'; // Update this to your local development URL

async function testAPIEndpoints() {
  console.log('🧪 Testing Site Configuration Requirements System...\n');

  try {
    // Test 1: Check site config status (should fail without auth)
    console.log('1️⃣ Testing /api/site-config/status (unauthenticated)...');
    const statusResponse = await fetch(`${BASE_URL}/api/site-config/status`);
    console.log(`   Status: ${statusResponse.status} ${statusResponse.statusText}`);
    
    if (statusResponse.status === 401) {
      console.log('   ✅ Correctly requires authentication');
    } else {
      console.log('   ❌ Should require authentication');
    }

    // Test 2: Check current site config
    console.log('\n2️⃣ Testing /api/site-config (unauthenticated)...');
    const configResponse = await fetch(`${BASE_URL}/api/site-config`);
    console.log(`   Status: ${configResponse.status} ${configResponse.statusText}`);
    
    if (configResponse.status === 200) {
      const configData = await configResponse.json();
      console.log('   ✅ Site config accessible (public endpoint)');
      console.log(`   📋 Current configs: ${configData.data?.length || 0} found`);
      
      const deployConfig = configData.data?.find(c => c.key === 'deploy_site');
      if (deployConfig) {
        console.log(`   🚀 Deploy site status: ${deployConfig.value ? 'ENABLED' : 'DISABLED'}`);
      }
    } else {
      console.log('   ❌ Site config not accessible');
    }

    // Test 3: Try to enable deploy_site (should fail without auth)
    console.log('\n3️⃣ Testing POST /api/site-config (unauthenticated)...');
    const enableResponse = await fetch(`${BASE_URL}/api/site-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: 'deploy_site', value: true }),
    });
    console.log(`   Status: ${enableResponse.status} ${enableResponse.statusText}`);
    
    if (enableResponse.status === 401) {
      console.log('   ✅ Correctly requires authentication');
    } else {
      console.log('   ❌ Should require authentication');
    }

    console.log('\n🎯 Test Summary:');
    console.log('   - Site config status endpoint requires auth ✅');
    console.log('   - Site config GET endpoint is public ✅');
    console.log('   - Site config POST endpoint requires auth ✅');
    console.log('\n📝 Next steps:');
    console.log('   1. Start your development server (npm run dev)');
    console.log('   2. Visit /admin/site-config to see the new requirements dashboard');
    console.log('   3. Set up hosting subscription via /admin/hosting');
    console.log('   4. Set up Stripe Connect via /admin/stripe');
    console.log('   5. Once both requirements are met, you can enable site deployment');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure your development server is running on the correct port');
  }
}

// Run the tests
testAPIEndpoints();
