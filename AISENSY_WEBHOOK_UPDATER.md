# AiSensy Webhook Auto-Updater

## 🎯 Overview

This system automatically updates the webhook URL for all users' AiSensy accounts to point to your server.

**Webhook URL:** `https://api.qwiktalks.com/webhook/whatsapp`

## ✨ Features

### 1. **Automatic Updates**
- ✅ Daily cron job (runs at 2 AM)
- ✅ On server startup (optional)
- ✅ On user login (optional)
- ✅ On user registration (optional)
- ✅ When AiSensy credentials are updated

### 2. **Manual Updates**
- ✅ Update all users via API
- ✅ Update specific users via API
- ✅ Update via CLI script
- ✅ Update current user via API

### 3. **Smart Features**
- ✅ Skips users without AiSensy tokens
- ✅ Rate limiting (500ms delay between requests)
- ✅ Detailed logging
- ✅ Error handling
- ✅ Background processing (non-blocking)

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```env
# AiSensy Webhook Configuration
AISENSY_WEBHOOK_URL=https://api.qwiktalks.com/webhook/whatsapp
UPDATE_WEBHOOKS_ON_STARTUP=false
AUTO_UPDATE_WEBHOOK_ON_LOGIN=false
AUTO_UPDATE_WEBHOOK_ON_REGISTER=true
```

**Options:**
- `AISENSY_WEBHOOK_URL` - Your webhook URL (required)
- `UPDATE_WEBHOOKS_ON_STARTUP` - Update all webhooks when server starts (true/false)
- `AUTO_UPDATE_WEBHOOK_ON_LOGIN` - Update webhook when user logs in (true/false)
- `AUTO_UPDATE_WEBHOOK_ON_REGISTER` - Update webhook when user registers (true/false)

## 🚀 Usage

### Method 1: Automatic (Cron Job)

The system automatically updates webhooks **daily at 2 AM**.

No action needed! Just make sure the server is running.

### Method 2: Manual via CLI

Update all users:
```bash
node scripts/update-aisensy-webhooks.js all
```

Update specific user:
```bash
node scripts/update-aisensy-webhooks.js user <user_id>
```

Example:
```bash
node scripts/update-aisensy-webhooks.js user 507f1f77bcf86cd799439011
```

### Method 3: Manual via API

#### Update All Users (Admin)
```bash
POST /api/aisensy-webhook/admin/update-all-webhooks
```

Example:
```bash
curl -X POST https://api.qwiktalks.com/api/aisensy-webhook/admin/update-all-webhooks \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Response:
```json
{
  "success": true,
  "message": "Webhook update completed",
  "results": {
    "total": 100,
    "success": 85,
    "failed": 5,
    "skipped": 10,
    "details": [...]
  }
}
```

#### Update Specific Users (Admin)
```bash
POST /api/aisensy-webhook/admin/update-webhooks
Content-Type: application/json

{
  "user_ids": ["user_id_1", "user_id_2"]
}
```

Example:
```bash
curl -X POST https://api.qwiktalks.com/api/aisensy-webhook/admin/update-webhooks \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_ids": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]}'
```

#### Update Current User
```bash
POST /api/aisensy-webhook/update-webhook
```

Example:
```bash
curl -X POST https://api.qwiktalks.com/api/aisensy-webhook/update-webhook \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

#### Get Webhook Status
```bash
GET /api/aisensy-webhook/webhook-status
```

Example:
```bash
curl https://api.qwiktalks.com/api/aisensy-webhook/webhook-status \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

Response:
```json
{
  "success": true,
  "has_token": true,
  "webhook_url": "https://api.qwiktalks.com/webhook/whatsapp"
}
```

### Method 4: On Server Startup

Enable in `.env`:
```env
UPDATE_WEBHOOKS_ON_STARTUP=true
```

Then restart server:
```bash
pm2 restart wapi-api
```

All webhooks will be updated when the server starts.

### Method 5: On User Login

Enable in `.env`:
```env
AUTO_UPDATE_WEBHOOK_ON_LOGIN=true
```

Webhook will be updated automatically when user logs in.

### Method 6: On User Registration

Enable in `.env`:
```env
AUTO_UPDATE_WEBHOOK_ON_REGISTER=true
```

Webhook will be updated automatically when new user registers.

## 📊 How It Works

### 1. Token Retrieval

The system looks for AiSensy tokens in this order:

1. `user.aisensy_token`
2. `user.metadata.aisensy_token`
3. `AiSensyBusiness` model (if exists)
4. Generate from credentials (if available)

### 2. Webhook Update

For each user with a valid token:

```javascript
PATCH https://backend.aisensy.com/direct-apis/t1/settings/update-webhook
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "webhooks": {
    "url": "https://api.qwiktalks.com/webhook/whatsapp"
  }
}
```

### 3. Rate Limiting

500ms delay between each request to avoid rate limiting.

### 4. Error Handling

- Skips users without tokens
- Logs all errors
- Continues processing even if some fail
- Returns detailed results

## 📋 Results Format

```json
{
  "total": 100,
  "success": 85,
  "failed": 5,
  "skipped": 10,
  "details": [
    {
      "success": true,
      "user_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "response": {...}
    },
    {
      "success": false,
      "user_id": "507f1f77bcf86cd799439012",
      "email": "user2@example.com",
      "error": "No AiSensy token found"
    }
  ]
}
```

## 🔍 Monitoring

### Check Cron Job Status

```bash
# Check server logs
pm2 logs wapi-api | grep "CRON"

# You should see:
# ✅ Webhook update cron job scheduled (daily at 2 AM)
# 🔄 [CRON] Starting scheduled webhook update...
# ✅ [CRON] Webhook update completed
```

### Check Update Results

```bash
# View logs
pm2 logs wapi-api --lines 100

# Look for:
# ✅ Webhook updated for user: user@example.com
# ❌ Failed to update webhook for user: user@example.com
```

### Check Individual User

```bash
# Via API
curl https://api.qwiktalks.com/api/aisensy-webhook/webhook-status \
  -H "Authorization: Bearer USER_TOKEN"
```

## 🐛 Troubleshooting

### Issue: Webhooks Not Updating

**Check 1: Is cron job running?**
```bash
pm2 logs wapi-api | grep "Webhook update cron job scheduled"
```

**Check 2: Are users being processed?**
```bash
pm2 logs wapi-api | grep "Found.*users to update"
```

**Check 3: Do users have tokens?**
```bash
# Check database
mongo wapi
db.users.find({ aisensy_token: { $exists: true } }).count()
```

### Issue: All Users Skipped

This means no users have AiSensy tokens configured.

**Solution:** Users need to connect their AiSensy accounts first.

### Issue: Updates Failing

**Check error messages:**
```bash
pm2 logs wapi-api --err --lines 50
```

Common errors:
- `401 Unauthorized` - Invalid token
- `403 Forbidden` - Token expired
- `429 Too Many Requests` - Rate limited (increase delay)
- `500 Server Error` - AiSensy API issue

## 📅 Cron Schedule

Default: **Daily at 2 AM**

To change the schedule, edit `cronjob/update-aisensy-webhooks.cron.js`:

```javascript
// Current: Daily at 2 AM
cron.schedule('0 2 * * *', async () => { ... });

// Every 6 hours
cron.schedule('0 */6 * * *', async () => { ... });

// Every Monday at 3 AM
cron.schedule('0 3 * * 1', async () => { ... });

// Every hour
cron.schedule('0 * * * *', async () => { ... });
```

## 🔐 Security

### Admin Endpoints

The following endpoints should be protected with admin authentication:

- `POST /api/aisensy-webhook/admin/update-all-webhooks`
- `POST /api/aisensy-webhook/admin/update-webhooks`

Add authentication middleware in `routes/aisensy-webhook.routes.js`:

```javascript
import { authenticateAdmin } from '../middlewares/auth.js';

router.post('/admin/update-all-webhooks', authenticateAdmin, updateWebhooksForAllUsers);
```

### User Endpoints

These endpoints use standard user authentication:

- `POST /api/aisensy-webhook/update-webhook`
- `GET /api/aisensy-webhook/webhook-status`

## 📈 Performance

### Batch Processing

- Processes users sequentially (not parallel)
- 500ms delay between requests
- Non-blocking (runs in background)

### Estimated Time

- 100 users = ~50 seconds
- 1000 users = ~8.3 minutes
- 10000 users = ~83 minutes

### Optimization

To process faster, reduce delay in `services/aisensy-webhook-updater.service.js`:

```javascript
// Current: 500ms
await this.delay(500);

// Faster: 200ms (but may hit rate limits)
await this.delay(200);
```

## ✅ Best Practices

1. **Enable on Registration**: Set `AUTO_UPDATE_WEBHOOK_ON_REGISTER=true`
2. **Keep Cron Job**: Let it run daily to catch any missed updates
3. **Monitor Logs**: Check for failed updates regularly
4. **Test First**: Test with a single user before updating all
5. **Backup Tokens**: Keep AiSensy tokens secure

## 🎯 Quick Start

1. **Add to .env:**
   ```env
   AISENSY_WEBHOOK_URL=https://api.qwiktalks.com/webhook/whatsapp
   AUTO_UPDATE_WEBHOOK_ON_REGISTER=true
   ```

2. **Restart server:**
   ```bash
   pm2 restart wapi-api
   ```

3. **Update existing users:**
   ```bash
   node scripts/update-aisensy-webhooks.js all
   ```

4. **Done!** ✅

New users will get webhooks updated automatically on registration, and the cron job will update all users daily.

## 📞 Support

For issues:
1. Check server logs: `pm2 logs wapi-api`
2. Check cron job: `pm2 logs wapi-api | grep CRON`
3. Test single user: `node scripts/update-aisensy-webhooks.js user <id>`
4. Check API response: `curl /api/aisensy-webhook/webhook-status`
