const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function checkNlpResults() {
  try {
    console.log('🔐 Step 1: Login as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@wisata.com',
      password: 'admin123',
    });

    const token = loginResponse.data.data.access_token;
    console.log('✅ Login successful!\n');

    // Check scraping jobs
    console.log('📋 Step 2: Check scraping jobs...');
    const jobsResponse = await axios.get(`${BASE_URL}/scraper/jobs`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const jobs = jobsResponse.data.data;
    console.log(`Found ${jobs.length} jobs:\n`);

    // Show last 3 jobs
    const recentJobs = jobs.slice(0, 3);
    for (const job of recentJobs) {
      console.log(`Job #${job.id}:`);
      console.log(`  Status: ${job.status}`);
      console.log(`  Total Reviews: ${job.totalReviews}`);
      console.log(`  Destination ID: ${job.destinationId}`);
      console.log(`  Created: ${new Date(job.createdAt).toLocaleString()}`);
      console.log('');
    }

    // Get the latest job
    const latestJob = jobs[0];
    if (!latestJob) {
      console.log('❌ No jobs found');
      return;
    }

    console.log(`\n🔍 Step 3: Check reviews for Job #${latestJob.id}...`);
    
    // Get destination details to see reviews
    const destResponse = await axios.get(
      `${BASE_URL}/destinations/${latestJob.destinationId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const destination = destResponse.data.data;
    console.log(`\n📍 Destination: ${destination.name}`);
    console.log(`   Positive Ratio: ${destination.positiveRatio}`);
    console.log(`   Recommendation Score: ${destination.recommendationScore}`);
    console.log(`   User Rating: ${destination.userRating}`);
    console.log(`   User Review Count: ${destination.userReviewCount}`);

    // Check if we can get reviews (might need a separate endpoint)
    console.log('\n📝 Checking reviews with NLP data...');
    console.log('   (You can check database directly for detailed review data)');
    
    // Check topics
    console.log('\n🏷️  Step 4: Check topics...');
    const topicsResponse = await axios.get(`${BASE_URL}/topics`);
    const topics = topicsResponse.data.data;
    
    if (topics.length > 0) {
      console.log(`✅ Found ${topics.length} topics:`);
      topics.slice(0, 5).forEach(topic => {
        console.log(`   - Topic #${topic.id}: ${topic.topicName}`);
        console.log(`     Keywords: ${topic.keywords.slice(0, 5).join(', ')}`);
      });
    } else {
      console.log('⚠️  No topics found yet');
    }

    // Check analytics
    console.log('\n📊 Step 5: Check analytics...');
    const analyticsResponse = await axios.get(
      `${BASE_URL}/analytics/destinations/${latestJob.destinationId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const analytics = analyticsResponse.data.data;
    console.log('Analytics Summary:');
    console.log(`   Total Reviews: ${analytics.totalReviews}`);
    console.log(`   Average Rating: ${analytics.averageRating}`);
    console.log(`   Positive Ratio: ${analytics.positiveRatio}`);
    console.log(`   Recommendation Score: ${analytics.recommendationScore}`);
    
    if (analytics.sentimentDistribution) {
      console.log('\nSentiment Distribution:');
      console.log(`   Positive: ${analytics.sentimentDistribution.positive || 0}`);
      console.log(`   Negative: ${analytics.sentimentDistribution.negative || 0}`);
      console.log(`   Neutral: ${analytics.sentimentDistribution.neutral || 0}`);
    }

    if (analytics.topTopics && analytics.topTopics.length > 0) {
      console.log('\nTop Topics:');
      analytics.topTopics.slice(0, 3).forEach(topic => {
        console.log(`   - ${topic.topicName}: ${topic.reviewCount} reviews`);
      });
    }

    console.log('\n✅ All checks completed!');
    console.log('\n💡 Tips:');
    console.log('   - Check NestJS server logs for FastAPI call details');
    console.log('   - Check database for detailed review data with sentiment and topics');
    console.log('   - Use Swagger UI at http://localhost:3000/api/docs for more endpoints');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

checkNlpResults();
