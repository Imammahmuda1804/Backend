const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

// Setup connection pool
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Create Prisma client with adapter
const prisma = new PrismaClient({ adapter });

async function checkDatabaseResults() {
  try {
    console.log('🔍 Checking NLP Processing Results in Database...\n');

    // 1. Check latest scraping job
    console.log('📋 Step 1: Latest Scraping Jobs');
    const jobs = await prisma.scrapingJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        destination: {
          select: { name: true }
        }
      }
    });

    for (const job of jobs) {
      console.log(`\nJob #${job.id}:`);
      console.log(`  Destination: ${job.destination.name}`);
      console.log(`  Status: ${job.status}`);
      console.log(`  Total Reviews: ${job.totalReviews}`);
      console.log(`  Created: ${job.createdAt.toLocaleString()}`);
    }

    if (jobs.length === 0) {
      console.log('❌ No jobs found');
      await prisma.$disconnect();
      return;
    }

    const latestJob = jobs[0];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Detailed Analysis for Job #${latestJob.id}`);
    console.log('='.repeat(60));

    // 2. Check reviews with NLP data
    console.log('\n📝 Step 2: Reviews with NLP Data');
    const reviews = await prisma.review.findMany({
      where: { scrapingJobId: latestJob.id },
      select: {
        id: true,
        reviewText: true,
        cleanedText: true,
        sentiment: true,
        topicId: true,
        rating: true,
        topic: {
          select: {
            topicName: true,
            keywords: true
          }
        }
      },
      take: 5
    });

    console.log(`Found ${reviews.length} reviews (showing first 5):\n`);
    
    for (const review of reviews) {
      console.log(`Review #${review.id}:`);
      console.log(`  Text: ${review.reviewText?.substring(0, 80)}...`);
      console.log(`  Cleaned: ${review.cleanedText?.substring(0, 80)}...`);
      console.log(`  Sentiment: ${review.sentiment || 'NOT SET'}`);
      console.log(`  Rating: ${review.rating}`);
      console.log(`  Topic: ${review.topic?.topicName || 'No topic'}`);
      if (review.topic?.keywords) {
        console.log(`  Keywords: ${review.topic.keywords.slice(0, 5).join(', ')}`);
      }
      console.log('');
    }

    // 3. Check sentiment distribution
    console.log('\n😊 Step 3: Sentiment Distribution');
    const sentimentCounts = await prisma.review.groupBy({
      by: ['sentiment'],
      where: { 
        scrapingJobId: latestJob.id,
        sentiment: { not: null }
      },
      _count: true
    });

    if (sentimentCounts.length > 0) {
      console.log('Sentiment breakdown:');
      sentimentCounts.forEach(item => {
        console.log(`  ${item.sentiment}: ${item._count} reviews`);
      });
    } else {
      console.log('⚠️  No sentiment data found - NLP might not have processed yet');
    }

    // 4. Check topics
    console.log('\n🏷️  Step 4: Topics Created');
    const topics = await prisma.topic.findMany({
      take: 10,
      orderBy: { id: 'asc' }
    });

    if (topics.length > 0) {
      console.log(`Found ${topics.length} topics:\n`);
      topics.forEach(topic => {
        console.log(`Topic #${topic.id}: ${topic.topicName}`);
        console.log(`  Keywords: ${topic.keywords.slice(0, 5).join(', ')}`);
      });
    } else {
      console.log('⚠️  No topics found - NLP might not have processed yet');
    }

    // 5. Check embeddings
    console.log('\n🔢 Step 5: Embeddings');
    const reviewEmbeddingCount = await prisma.reviewEmbedding.count({
      where: {
        review: {
          scrapingJobId: latestJob.id
        }
      }
    });
    console.log(`Review embeddings: ${reviewEmbeddingCount}`);

    // Check if DestinationEmbedding model exists
    let destEmbedding = null;
    try {
      if (prisma.destinationEmbedding) {
        destEmbedding = await prisma.destinationEmbedding.findUnique({
          where: { destinationId: latestJob.destinationId }
        });
      }
    } catch (e) {
      // Model might not exist
    }
    console.log(`Destination embedding: ${destEmbedding ? '✅ EXISTS' : '❌ NOT FOUND'}`);

    // 6. Check destination analytics
    console.log('\n📈 Step 6: Destination Analytics');
    const destination = await prisma.destination.findUnique({
      where: { id: latestJob.destinationId },
      select: {
        name: true,
        positiveRatio: true,
        recommendationScore: true,
        userRating: true,
        userReviewCount: true
      }
    });

    console.log(`Destination: ${destination.name}`);
    console.log(`  Positive Ratio: ${destination.positiveRatio?.toFixed(4) || 'N/A'}`);
    console.log(`  Recommendation Score: ${destination.recommendationScore?.toFixed(4) || 'N/A'}`);
    console.log(`  User Rating: ${destination.userRating || 'N/A'}`);
    console.log(`  User Review Count: ${destination.userReviewCount || 0}`);

    // 7. Check sentiment trends
    console.log('\n📊 Step 7: Sentiment Trends');
    const trends = await prisma.sentimentTrend.findMany({
      where: { destinationId: latestJob.destinationId },
      orderBy: { date: 'desc' },
      take: 3
    });

    if (trends.length > 0) {
      console.log('Recent sentiment trends:');
      trends.forEach(trend => {
        console.log(`  ${trend.date.toLocaleDateString()}:`);
        console.log(`    Positive: ${trend.positiveCount}, Negative: ${trend.negativeCount}, Neutral: ${trend.neutralCount}`);
      });
    } else {
      console.log('⚠️  No sentiment trends found');
    }

    // 8. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY');
    console.log('='.repeat(60));
    
    const totalReviews = await prisma.review.count({
      where: { scrapingJobId: latestJob.id }
    });
    
    const reviewsWithSentiment = await prisma.review.count({
      where: { 
        scrapingJobId: latestJob.id,
        sentiment: { not: null }
      }
    });

    const reviewsWithTopic = await prisma.review.count({
      where: { 
        scrapingJobId: latestJob.id,
        topicId: { not: null }
      }
    });

    console.log(`Total Reviews: ${totalReviews}`);
    console.log(`Reviews with Sentiment: ${reviewsWithSentiment} (${((reviewsWithSentiment/totalReviews)*100).toFixed(1)}%)`);
    console.log(`Reviews with Topic: ${reviewsWithTopic} (${((reviewsWithTopic/totalReviews)*100).toFixed(1)}%)`);
    console.log(`Review Embeddings: ${reviewEmbeddingCount} (${((reviewEmbeddingCount/totalReviews)*100).toFixed(1)}%)`);
    console.log(`Destination Embedding: ${destEmbedding ? '✅' : '❌'}`);
    console.log(`Topics Created: ${topics.length}`);

    if (reviewsWithSentiment === totalReviews && reviewEmbeddingCount === totalReviews) {
      console.log('\n✅ NLP Processing COMPLETED Successfully!');
    } else if (reviewsWithSentiment === 0) {
      console.log('\n⚠️  NLP Processing NOT STARTED or FAILED');
      console.log('   Check NestJS server logs for errors');
    } else {
      console.log('\n⏳ NLP Processing IN PROGRESS...');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseResults();
