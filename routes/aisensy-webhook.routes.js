/**
 * AiSensy Webhook Routes
 */

import express from 'express';
import {
  updateWebhooksForAllUsers,
  updateWebhooksForUsers,
  updateWebhookForCurrentUser,
  getWebhookStatus
} from '../controllers/aisensy-webhook.controller.js';

const router = express.Router();

// Admin routes - update webhooks for all users
router.post('/admin/update-all-webhooks', updateWebhooksForAllUsers);

// Admin routes - update webhooks for specific users
router.post('/admin/update-webhooks', updateWebhooksForUsers);

// User routes - update webhook for current user
router.post('/update-webhook', updateWebhookForCurrentUser);

// User routes - get webhook status
router.get('/webhook-status', getWebhookStatus);

export default router;
