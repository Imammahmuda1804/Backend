const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
  try {
    console.log('🔐 Step 1: Login as admin...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@wisata.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.access_token;
    console.log('✅ Login successful!');
    console.log('🎫 Token:', token.substring(0, 50) + '...\n');

    console.log('📋 Step 2: Get destinations...');
    const destResponse = await axios.get('http://localhost:3000/api/admin/destinations', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Response structure:', JSON.stringify(destResponse.data, null, 2));
    
    const destinations = destResponse.data.data?.destinations || destResponse.data.data || [];
    if (destinations.length === 0) {
      console.log('❌ No destinations found. Please create a destination first.');
      return;
    }
    
    const destinationId = destinations[0].id;
    console.log(`✅ Found destination: ${destinations[0].name} (ID: ${destinationId})\n`);

    console.log('📤 Step 3: Upload CSV file...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream('sample-reviews-indonesian.csv'));

    const uploadResponse = await axios.post(
      `http://localhost:3000/api/admin/destinations/${destinationId}/upload-reviews`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log('✅ Upload successful!');
    console.log('📊 Response:', JSON.stringify(uploadResponse.data, null, 2));
    console.log('\n🔍 Check NestJS logs to see if FastAPI endpoint was called!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testUpload();
