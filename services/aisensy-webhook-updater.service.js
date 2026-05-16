/**
 * AiSensy Webhook Updater Service
 * Updates webhook URL for all AiSensy users
 */

import axios from 'axios';
import db from '../models/index.js';

const AISENSY_WEBHOOK_URL = process.env.AISENSY_WEBHOOK_URL || 'https://api.qwiktalks.com/webhook/whatsapp';
const AISENSY_API_BASE = process.env.AISENSY_DIRECT_BASE_URL || 'https://backend.aisensy.com';

class AiSensyWebhookUpdater {
  /**
   * Update webhook for a single user
   * @param {Object} user - User object with AiSensy credentials
   * @returns {Object} Result of the update
   */
  async updateWebhookForUser(user) {
    try {
      // Get user's AiSensy token
      const token = await this.getUserToken(user);
      
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
   * Get AiSensy token for a user
   * @param {Object} user - User object
   * @returns {String} AiSensy token
   */
  async getUserToken(user) {
    try {
      // Check if user has AiSensy configuration
      // This might be stored in different places depending on your schema
      
      // Option 1: Check user settings
      if (user.aisensy_token) {
        return user.aisensy_token;
      }

      // Option 2: Check user metadata
      if (user.metadata?.aisensy_token) {
        return user.metadata.aisensy_token;
      }

      // Option 3: Check AiSensy business model
      const { AiSensyBusiness } = db;
      if (AiSensyBusiness) {
        const business = await AiSensyBusiness.findOne({ 
          user_id: user._id,
          deleted_at: null 
        });
        
        if (business?.api_token) {
          return business.api_token;
        }
      }

      // Option 4: Generate token from credentials
      if (user.aisensy_assistant_id && user.aisensy_client_id) {
        return await this.generateToken(user);
      }

      return null;

    } catch (error) {
      console.error('Error getting user token:', error);
      return null;
    }
  }

  /**
   * Generate AiSensy token from credentials
   * @param {Object} user - User object
   * @returns {String} Generated token
   */
  async generateToken(user) {
    try {
      // If you have a token generation endpoint
      const response = await axios.post(
        `${AISENSY_API_BASE}/auth/generate-token`,
        {
          assistant_id: user.aisensy_assistant_id,
          client_id: user.aisensy_client_id
        }
      );

      return response.data.token;

    } catch (error) {
      console.error('Error generating token:', error);
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
