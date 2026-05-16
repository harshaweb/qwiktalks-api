/**
 * CLI Script to Update AiSensy Webhooks
 * Usage: node scripts/update-aisensy-webhooks.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import aiSensyWebhookUpdater from '../services/aisensy-webhook-updater.service.js';

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log('🚀 AiSensy Webhook Updater');
    console.log('==========================\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get command line arguments
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'all') {
      // Update all users
      console.log('🔄 Updating webhooks for ALL users...\n');
      const results = await aiSensyWebhookUpdater.updateWebhooksForAllUsers();
      
      console.log('\n📊 Results:');
      console.log('===========');
      console.log(`Total users: ${results.total}`);
      console.log(`✅ Success: ${results.success}`);
      console.log(`❌ Failed: ${results.failed}`);
      console.log(`⏭️  Skipped: ${results.skipped}`);
      
      if (results.failed > 0) {
        console.log('\n❌ Failed users:');
        results.details
          .filter(d => !d.success && d.error !== 'No AiSensy token found')
          .forEach(d => {
            console.log(`   - ${d.email}: ${d.error}`);
          });
      }

    } else if (command === 'user' && args[1]) {
      // Update specific user by ID
      const userId = args[1];
      console.log(`🔄 Updating webhook for user: ${userId}...\n`);
      
      const results = await aiSensyWebhookUpdater.updateWebhooksForUsers([userId]);
      
      console.log('\n📊 Result:');
      console.log('==========');
      if (results.success > 0) {
        console.log('✅ Webhook updated successfully');
      } else {
        console.log('❌ Failed to update webhook');
        console.log(`   Error: ${results.details[0]?.error}`);
      }

    } else {
      // Show usage
      console.log('Usage:');
      console.log('  node scripts/update-aisensy-webhooks.js all          # Update all users');
      console.log('  node scripts/update-aisensy-webhooks.js user <id>    # Update specific user');
      console.log('');
      console.log('Examples:');
      console.log('  node scripts/update-aisensy-webhooks.js all');
      console.log('  node scripts/update-aisensy-webhooks.js user 507f1f77bcf86cd799439011');
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
