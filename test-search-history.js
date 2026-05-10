const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testSearchHistory() {
  try {
    console.log('🔐 Step 1: Login as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@wisata.com',
      password: 'admin123',
    });

    const token = loginResponse.data.data.access_token;
    const userId = loginResponse.data.data.user.id;
    console.log(`✅ Login successful!`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Token: ${token.substring(0, 20)}...`);

    console.log('\n🔍 Step 2: Perform search WITH token...');
    const searchResponse = await axios.post(
      `${BASE_URL}/search`,
      {
        query: 'wisata keluarga murah di bukittinggi',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(`✅ Search successful!`);
    console.log(`   Results: ${searchResponse.data.length || 0} destinations`);

    console.log('\n📋 Step 3: Check search history...');
    const historyResponse = await axios.get(`${BASE_URL}/search/history`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(`✅ History retrieved!`);
    console.log(`   Total entries: ${historyResponse.data.data.length}`);
    
    if (historyResponse.data.data.length > 0) {
      console.log('\n📝 Recent searches:');
      historyResponse.data.data.slice(0, 5).forEach((entry, index) => {
        console.log(`   ${index + 1}. "${entry.keyword}" - ${new Date(entry.createdAt).toLocaleString()}`);
      });
    } else {
      console.log('\n⚠️  No search history found!');
      console.log('   This means the search history was not saved.');
      console.log('   Check server logs for debugging information.');
    }

    console.log('\n🔍 Step 4: Perform another search...');
    await axios.post(
      `${BASE_URL}/search`,
      {
        query: 'pantai indah di padang',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(`✅ Second search completed!`);

    console.log('\n📋 Step 5: Check history again...');
    const historyResponse2 = await axios.get(`${BASE_URL}/search/history`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(`✅ History retrieved!`);
    console.log(`   Total entries: ${historyResponse2.data.data.length}`);
    
    if (historyResponse2.data.data.length > 0) {
      console.log('\n📝 Recent searches:');
      historyResponse2.data.data.slice(0, 5).forEach((entry, index) => {
        console.log(`   ${index + 1}. "${entry.keyword}" - ${new Date(entry.createdAt).toLocaleString()}`);
      });
      console.log('\n✅ SUCCESS! Search history is working correctly!');
    } else {
      console.log('\n❌ FAILED! Search history is still not being saved.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testSearchHistory();
