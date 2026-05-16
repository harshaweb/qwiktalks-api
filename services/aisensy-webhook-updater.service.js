/**
 * AiSensy Webhook Updater Service
 * Updates webhook URL for all AiSensy users
 */

import axios from 'axios';
import db from '../models/index.js';

const AISENSY_WEBHOOK_URL = process.env.AISENSY_WEBHOOK_URL || 'https://api.qwiktalks.com/webhook/whatsapp';
const AISENSY_API_BASE = process.env.AISENSY_DIRECT_BASE_URL || 'https://backend.aisensy.com';
const AISENCY_API_BASE_URL = process.env.AISENCY_API_URL || 'http://localhost:5001';

class AiSensyWebhookUpdater {
  /**
   * Update webhook for a single user
   * @param {Object} user - User object with AiSensy credentials
   * @returns {Object} Result of the update
   */
  async updateWebhookForUser(user) {
    try {
      // Get user's AiSensy token via aisency-api
      const token = await this.getUserTokenViaAisencyAPI(user._id || user.id);
      
      if (!token) {
        return {
          success: false,
          user_id: user._id,
          email: user.email,
          error: 'No AiSensy token found'
        };
      }

      // Update webhook
      const response = await axios.patch(
        `${AISENSY_API_BASE}/direct-apis/t1/settings/update-webhook`,
        {
          webhooks: {
            url: AISENSY_WEBHOOK_URL
          }
        },
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Webhook updated for user: ${user.email}`);
      
      return {
        success: true,
        user_id: user._id,
        email: user.email,
        response: response.data
      };

    } catch (error) {
      console.error(`❌ Failed to update webhook for user: ${user.email}`, error.message);
      
      return {
        success: false,
        user_id: user._id,
        email: user.email,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Get AiSensy token via aisency-api service
   * @param {String} userId - User ID
   * @returns {String} AiSensy token
   */
  async getUserTokenViaAisencyAPI(userId) {
    try {
      // Call aisency-api to get the token
      const response = await axios.get(
        `${AISENCY_API_BASE_URL}/aisensy/get-token?user_id=${userId}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (response.data && response.data.token) {
        return response.data.token;
      }

      return null;

    } catch (error) {
      console.error(`Error getting token via aisency-api for user ${userId}:`, error.message);
      return null;
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
