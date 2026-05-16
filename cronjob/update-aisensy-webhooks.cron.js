/**
 * Cron Job: Update AiSensy Webhooks
 * Automatically updates webhook URLs for all users
 */

import cron from 'node-cron';
import aiSensyWebhookUpdater from '../services/aisensy-webhook-updater.service.js';

/**
 * Schedule webhook updates
 * Runs daily at 2 AM
 */
export function scheduleWebhookUpdates() {
  // Run daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('🔄 [CRON] Starting scheduled webhook update...');
    
    try {
      const results = await aiSensyWebhookUpdater.updateWebhooksForAllUsers();
      
      console.log('✅ [CRON] Webhook update completed');
      console.log(`   Success: ${results.success}, Failed: ${results.failed}, Skipped: ${results.skipped}`);
      
    } catch (error) {
      console.error('❌ [CRON] Webhook update failed:', error.message);
    }
  });

  console.log('✅ Webhook update cron job scheduled (daily at 2 AM)');
}

/**
 * Update webhooks on server startup
 */
export async function updateWebhooksOnStartup() {
  // Only run if enabled in environment
  if (process.env.UPDATE_WEBHOOKS_ON_STARTUP === 'true') {
    console.log('🔄 Updating webhooks on startup...');
    
    try {
      const results = await aiSensyWebhookUpdater.updateWebhooksForAllUsers();
      console.log('✅ Startup webhook update completed');
      console.log(`   Success: ${results.success}, Failed: ${results.failed}, Skipped: ${results.skipped}`);
    } catch (error) {
      console.error('❌ Startup webhook update failed:', error.message);
    }
  }
}
