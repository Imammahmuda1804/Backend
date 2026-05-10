require('dotenv').config();
const axios = require('axios');

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8001';

async function testConnection() {
  console.log('🔍 Testing NLP Service Connection...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 URL: ${FASTAPI_URL}`);
  console.log('');

  // Test 1: Health Check
  console.log('1️⃣  Testing Health Endpoint...');
  try {
    const response = await axios.get(`${FASTAPI_URL}/health`, { timeout: 5000 });
    console.log('   ✅ Health check successful!');
    console.log('   Response:', response.data);
  } catch (error) {
    console.log('   ❌ Health check failed!');
    if (error.code === 'ECONNREFUSED') {
      console.log('   💡 FastAPI service is not running');
      console.log('   💡 Please start the FastAPI service first');
    } else {
      console.log('   Error:', error.message);
    }
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📝 How to start FastAPI service:');
    console.log('');
    console.log('   1. Navigate to NLP service directory');
    console.log('   2. Install dependencies:');
    console.log('      pip install -r requirements.txt');
    console.log('');
    console.log('   3. Start the service:');
    console.log('      uvicorn main:app --host 0.0.0.0 --port 8001');
    console.log('');
    console.log('   4. Or with reload (development):');
    console.log('      uvicorn main:app --host 0.0.0.0 --port 8001 --reload');
    console.log('');
    return;
  }

  console.log('');

  // Test 2: Root Endpoint
  console.log('2️⃣  Testing Root Endpoint...');
  try {
    const response = await axios.get(`${FASTAPI_URL}/`, { timeout: 5000 });
    console.log('   ✅ Root endpoint accessible!');
    console.log('   Response:', response.data);
  } catch (error) {
    console.log('   ⚠️  Root endpoint failed:', error.message);
  }

  console.log('');

  // Test 3: Docs Endpoint
  console.log('3️⃣  Testing Docs Endpoint...');
  try {
    const response = await axios.get(`${FASTAPI_URL}/docs`, { timeout: 5000 });
    console.log('   ✅ Docs endpoint accessible!');
    console.log('   📚 Open in browser: ' + FASTAPI_URL + '/docs');
  } catch (error) {
    console.log('   ⚠️  Docs endpoint failed:', error.message);
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('✅ NLP Service is running and accessible!');
  console.log('');
  console.log('📍 Available endpoints:');
  console.log(`   - Health: ${FASTAPI_URL}/health`);
  console.log(`   - Docs: ${FASTAPI_URL}/docs`);
  console.log(`   - Pipeline: ${FASTAPI_URL}/pipeline/process`);
  console.log(`   - Embed: ${FASTAPI_URL}/embed`);
  console.log('');
}

testConnection();
