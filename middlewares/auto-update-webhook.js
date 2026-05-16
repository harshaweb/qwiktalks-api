/**
 * Auto Update Webhook Middleware
 * Automatically updates AiSensy webhook when user logs in or registers
 */

import aiSensyWebhookUpdater from '../services/aisensy-webhook-updater.service.js';

/**
 * Update webhook after user login
 */
export const updateWebhookAfterLogin = async (req, res, next) => {
  try {
    // Only update if enabled
    if (process.env.AUTO_UPDATE_WEBHOOK_ON_LOGIN !== 'true') {
      return next();
    }

    const user = req.user;
    
    if (user) {
      // Update webhook in background (don't wait)
      aiSensyWebhookUpdater.updateWebhookForUser(user)
        .then(result => {
          if (result.success) {
            console.log(`✅ Auto-updated webhook for user: ${user.email}`);
          }
        })
        .catch(error => {
          console.error(`❌ Failed to auto-update webhook for user: ${user.email}`, error.message);
        });
    }

    next();
  } catch (error) {
    // Don't block the request if webhook update fails
    console.error('Error in auto-update webhook middleware:', error);
    next();
  }
};

/**
 * Update webhook after user registration
 */
export const updateWebhookAfterRegistration = async (user) => {
  try {
    // Only update if enabled
    if (process.env.AUTO_UPDATE_WEBHOOK_ON_REGISTER !== 'true') {
      return;
    }

    // Update webhook in background
    aiSensyWebhookUpdater.updateWebhookForUser(user)
      .then(result => {
        if (result.success) {
          console.log(`✅ Auto-updated webhook for new user: ${user.email}`);
        }
      })
      .catch(error => {
        console.error(`❌ Failed to auto-update webhook for new user: ${user.email}`, error.message);
      });

  } catch (error) {
    console.error('Error in auto-update webhook after registration:', error);
  }
};

/**
 * Update webhook when AiSensy credentials are updated
 */
export const updateWebhookAfterCredentialsUpdate = async (user) => {
  try {
    console.log(`🔄 Updating webhook after credentials update for: ${user.email}`);
    
    const result = await aiSensyWebhookUpdater.updateWebhookForUser(user);
    
    if (result.success) {
      console.log(`✅ Webhook updated after credentials update: ${user.email}`);
    } else {
      console.error(`❌ Failed to update webhook after credentials update: ${user.email}`);
    }

    return result;

  } catch (error) {
    console.error('Error updating webhook after credentials update:', error);
    return { success: false, error: error.message };
  }
};
