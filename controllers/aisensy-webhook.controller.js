/**
 * AiSensy Webhook Controller
 * Handles webhook update requests
 */

import aiSensyWebhookUpdater from '../services/aisensy-webhook-updater.service.js';

/**
 * Update webhook for all users
 */
export const updateWebhooksForAllUsers = async (req, res) => {
  try {
    const results = await aiSensyWebhookUpdater.updateWebhooksForAllUsers();

    return res.status(200).json({
      success: true,
      message: 'Webhook update completed',
      results
    });

  } catch (error) {
    console.error('Error updating webhooks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update webhooks',
      error: error.message
    });
  }
};

/**
 * Update webhook for specific users
 */
export const updateWebhooksForUsers = async (req, res) => {
  try {
    const { user_ids } = req.body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'user_ids array is required'
      });
    }

    const results = await aiSensyWebhookUpdater.updateWebhooksForUsers(user_ids);

    return res.status(200).json({
      success: true,
      message: 'Webhook update completed',
      results
    });

  } catch (error) {
    console.error('Error updating webhooks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update webhooks',
      error: error.message
    });
  }
};

/**
 * Update webhook for current user
 */
export const updateWebhookForCurrentUser = async (req, res) => {
  try {
    const user = req.user; // Assuming auth middleware sets req.user

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await aiSensyWebhookUpdater.updateWebhookForUser(user);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Webhook updated successfully',
        result
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Failed to update webhook',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error updating webhook:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update webhook',
      error: error.message
    });
  }
};

/**
 * Get webhook status for current user
 */
export const getWebhookStatus = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const token = await aiSensyWebhookUpdater.getUserToken(user);

    return res.status(200).json({
      success: true,
      has_token: !!token,
      webhook_url: process.env.AISENSY_WEBHOOK_URL || 'https://api.qwiktalks.com/webhook/whatsapp'
    });

  } catch (error) {
    console.error('Error getting webhook status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get webhook status',
      error: error.message
    });
  }
};
