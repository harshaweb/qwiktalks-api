import aisensyService from '../aisency/aisensy.service.js';
import aiSensyWebhookUpdater from '../services/aisensy-webhook-updater.service.js';

/**
 * Update webhook URL for current user
 */
export const updateWebhook = async (req, res) => {
  try {
    const userId = req.user.owner_id;
    const { webhook_url } = req.body;

    // Use default webhook URL if not provided
    const webhookUrl = webhook_url || process.env.AISENSY_WEBHOOK_URL || 'https://api.qwiktalks.com/webhook/whatsapp';

    console.log(`[Webhook Settings] Updating webhook for user ${userId} to: ${webhookUrl}`);

    const result = await aisensyService.updateWebhook(userId.toString(), webhookUrl);

    if (result.success) {
      return res.json({
        success: true,
        message: 'Webhook updated successfully',
        webhook_url: webhookUrl,
        data: result.data
      });
    } else {
      return res.status(500).json({
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
 * Get current webhook status
 */
export const getWebhookStatus = async (req, res) => {
  try {
    const webhookUrl = process.env.AISENSY_WEBHOOK_URL || 'https://api.qwiktalks.com/webhook/whatsapp';

    return res.json({
      success: true,
      webhook_url: webhookUrl,
      auto_update_on_login: process.env.AUTO_UPDATE_WEBHOOK_ON_LOGIN === 'true',
      auto_update_on_register: process.env.AUTO_UPDATE_WEBHOOK_ON_REGISTER === 'true'
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

/**
 * Trigger webhook update for current user (manual trigger)
 */
export const triggerWebhookUpdate = async (req, res) => {
  try {
    const user = req.user;

    console.log(`[Webhook Settings] Manual webhook update triggered for user: ${user.email}`);

    const result = await aiSensyWebhookUpdater.updateWebhookForUser(user);

    if (result.success) {
      return res.json({
        success: true,
        message: 'Webhook updated successfully',
        data: result
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to update webhook',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error triggering webhook update:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to trigger webhook update',
      error: error.message
    });
  }
};

/**
 * Update webhooks for all users (admin only)
 */
export const updateAllWebhooks = async (req, res) => {
  try {
    console.log('[Webhook Settings] Updating webhooks for all users...');

    const results = await aiSensyWebhookUpdater.updateWebhooksForAllUsers();

    return res.json({
      success: true,
      message: 'Webhook update completed',
      results
    });

  } catch (error) {
    console.error('Error updating all webhooks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update webhooks for all users',
      error: error.message
    });
  }
};
