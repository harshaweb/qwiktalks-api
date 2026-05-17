import express from 'express';
import * as webhookSettingsController from '../controllers/webhook-settings.controller.js';
import { authenticate, authorizeAdmin } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Get webhook status
 * GET /api/webhook-settings/status
 */
router.get('/status', webhookSettingsController.getWebhookStatus);

/**
 * Update webhook for current user
 * POST /api/webhook-settings/update
 */
router.post('/update', webhookSettingsController.updateWebhook);

/**
 * Trigger webhook update for current user (manual)
 * POST /api/webhook-settings/trigger
 */
router.post('/trigger', webhookSettingsController.triggerWebhookUpdate);

/**
 * Update webhooks for all users (admin only)
 * POST /api/webhook-settings/update-all
 */
router.post('/update-all', authorizeAdmin, webhookSettingsController.updateAllWebhooks);

export default router;
