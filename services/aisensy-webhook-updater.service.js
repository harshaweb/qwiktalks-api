/**
 * AiSensy Webhook Updater Service
 * Updates webhook URL for all AiSensy users
 */

import aisensyService from '../aisency/aisensy.service.js';
import db from '../models/index.js';

const AISENSY_WEBHOOK_URL = process.env.AISENSY_WEBHOOK_URL || 'https://api.qwiktalks.com/webhook/whatsapp';

class AiSensyWebhookUpdater {
  /**
   * Update webhook for a single user
   * @param {Object} user - User object with AiSensy credentials
   * @returns {Object} Result of the update
   */
  async updateWebhookForUser(user) {
    try {
      const userId = user._id || user.id;
      const userEmail = user.email;

      console.log(`[Webhook Updater] Updating webhook for user: ${userEmail} (${userId})`);

      // Use the aisensy service to update webhook
      const result = await aisensyService.updateWebhook(userId.toString(), AISENSY_WEBHOOK_URL);

      if (result.success) {
        console.log(`✅ Webhook updated for user: ${userEmail}`);
        return {
          success: true,
          user_id: userId,
          email: userEmail,
          webhook_url: AISENSY_WEBHOOK_URL,
          response: result.data
        };
      } else {
        console.error(`❌ Failed to update webhook for user: ${userEmail}`, result.error);
        return {
          success: false,
          user_id: userId,
          email: userEmail,
          error: result.error || result.message
        };
      }

    } catch (error) {
      console.error(`❌ Failed to update webhook for user: ${user.email}`, error.message);
      
      return {
        success: false,
        user_id: user._id,
        email: user.email,
        error: error.message
      };
    }
  }

  /**
   * Update webhooks for all users
   * @returns {Object} Summary of updates
   */
  async updateWebhooksForAllUsers() {
    try {
      console.log('🔄 Starting webhook update for all users...');
      
      const { User } = db;
      
      // Get all active users
      const users = await User.find({
        deleted_at: null,
        // Add any other filters (e.g., users with AiSensy enabled)
      });

      console.log(`📊 Found ${users.length} users to update`);

      const results = {
        total: users.length,
        success: 0,
        failed: 0,
        skipped: 0,
        details: []
      };

      // Update webhooks for each user
      for (const user of users) {
        const result = await this.updateWebhookForUser(user);
        results.details.push(result);

        if (result.success) {
          results.success++;
        } else if (result.error === 'No AiSensy token found') {
          results.skipped++;
        } else {
          results.failed++;
        }

        // Add delay to avoid rate limiting
        await this.delay(500);
      }

      console.log('✅ Webhook update completed');
      console.log(`   Success: ${results.success}`);
      console.log(`   Failed: ${results.failed}`);
      console.log(`   Skipped: ${results.skipped}`);

      return results;

    } catch (error) {
      console.error('Error updating webhooks for all users:', error);
      throw error;
    }
  }

  /**
   * Update webhook for specific users by IDs
   * @param {Array} userIds - Array of user IDs
   * @returns {Object} Summary of updates
   */
  async updateWebhooksForUsers(userIds) {
    try {
      console.log(`🔄 Starting webhook update for ${userIds.length} users...`);
      
      const { User } = db;
      
      const users = await User.find({
        _id: { $in: userIds },
        deleted_at: null
      });

      const results = {
        total: users.length,
        success: 0,
        failed: 0,
        skipped: 0,
        details: []
      };

      for (const user of users) {
        const result = await this.updateWebhookForUser(user);
        results.details.push(result);

        if (result.success) {
          results.success++;
        } else if (result.error === 'No AiSensy token found') {
          results.skipped++;
        } else {
          results.failed++;
        }

        await this.delay(500);
      }

      console.log('✅ Webhook update completed');
      console.log(`   Success: ${results.success}`);
      console.log(`   Failed: ${results.failed}`);
      console.log(`   Skipped: ${results.skipped}`);

      return results;

    } catch (error) {
      console.error('Error updating webhooks for users:', error);
      throw error;
    }
  }

  /**
   * Delay helper
   * @param {Number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new AiSensyWebhookUpdater();
