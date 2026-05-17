# 🚀 Automatic Webhook Update System

## ✅ What's Configured

Your system now **automatically updates** AiSensy webhooks for all users!

### Webhook URL
```
https://api.qwiktalks.com/webhook/whatsapp
```

## 🎯 How It Works

### 1. **On User Login** ✅ ENABLED
When a user logs in, their AiSensy webhook is automatically updated in the background.

### 2. **On User Registration** ✅ ENABLED  
When a new user registers, their AiSensy webhook is automatically set.

### 3. **Daily Cron Job** ✅ ENABLED
Every day at 2 AM, all users' webhooks are updated automatically.

## 🔧 Configuration

In `/root/wapi-new/qwiktalks-api/.env`:

```env
AISENSY_WEBHOOK_URL=https://api.qwiktalks.com/webhook/whatsapp
AUTO_UPDATE_WEBHOOK_ON_LOGIN=true
AUTO_UPDATE_WEBHOOK_ON_REGISTER=true
UPDATE_WEBHOOKS_ON_STARTUP=false
```

## 📋 What Happens

### When User Logs In:

1. User enters credentials
2. Login successful
3. **Background process starts** (doesn't block login)
4. System calls `aisency-api` to get user's AiSensy token
5. System calls AiSensy API to update webhook
6. Webhook updated to: `https://api.qwiktalks.com/webhook/whatsapp`
7. User continues using the app (no interruption)

### API Flow:

```
User Login
    ↓
wapi-api (auth.controller.js)
    ↓
aisensy-webhook-updater.service.js
    ↓
GET http://localhost:5001/aisensy/get-token?user_id=XXX
    ↓
aisency-api returns JWT token
    ↓
PATCH https://backend.aisensy.com/direct-apis/t1/settings/update-webhook
Authorization: Bearer <token>
Body: { "webhooks": { "url": "https://api.qwiktalks.com/webhook/whatsapp" } }
    ↓
✅ Webhook Updated!
```

## 🧪 Testing

### Test Manual Update

```bash
# On your server
cd /root/wapi-new/qwiktalks-api
node scripts/update-aisensy-webhooks.js all
```

### Test Single User

```bash
node scripts/update-aisensy-webhooks.js user <user_id>
```

### Test Via API

```bash
curl -X POST https://api.qwiktalks.com/api/aisensy-webhook/admin/update-all-webhooks \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Check Logs

```bash
# Check if webhook updates are happening
pm2 logs qwiktalks-api | grep "Webhook updated"

# Should see:
# ✅ Webhook updated for user: user@example.com
```

## 📊 Monitoring

### Check Auto-Update on Login

1. Log in to your app
2. Check server logs:
   ```bash
   pm2 logs qwiktalks-api --lines 50 | grep "Auto-updated webhook"
   ```
3. Should see:
   ```
   ✅ Auto-updated webhook for user: user@example.com
   ```

### Check Cron Job

```bash
pm2 logs qwiktalks-api | grep "CRON"

# Should see:
# ✅ Webhook update cron job scheduled (daily at 2 AM)
# 🔄 [CRON] Starting scheduled webhook update...
# ✅ [CRON] Webhook update completed
```

## 🔍 Troubleshooting

### Issue: Webhooks Not Updating on Login

**Check 1: Is it enabled?**
```bash
grep AUTO_UPDATE_WEBHOOK_ON_LOGIN /root/wapi-new/qwiktalks-api/.env
# Should show: AUTO_UPDATE_WEBHOOK_ON_LOGIN=true
```

**Check 2: Check logs**
```bash
pm2 logs qwiktalks-api --lines 100 | grep -i webhook
```

**Check 3: Is aisency-api running?**
```bash
# Check if aisency-api is accessible
curl http://localhost:5001/
```

### Issue: Token Not Found

This means the user doesn't have AiSensy credentials configured.

**Solution:** User needs to connect their AiSensy account first.

### Issue: 401 Unauthorized

The AiSensy token is invalid or expired.

**Solution:** User needs to re-authenticate with AiSensy.

## 🎯 Manual Update Commands

### Update All Users

```bash
cd /root/wapi-new/qwiktalks-api
node scripts/update-aisensy-webhooks.js all
```

Output:
```
🚀 AiSensy Webhook Updater
==========================

📡 Connecting to MongoDB...
✅ Connected to MongoDB

🔄 Updating webhooks for ALL users...

✅ Webhook updated for user: user1@example.com
✅ Webhook updated for user: user2@example.com
⏭️  Skipped user: user3@example.com (No AiSensy token found)

📊 Results:
===========
Total users: 100
✅ Success: 85
❌ Failed: 5
⏭️  Skipped: 10

✅ Done!
```

### Update Specific User

```bash
node scripts/update-aisensy-webhooks.js user 507f1f77bcf86cd799439011
```

## 📈 Performance

- **Login Impact**: None (runs in background)
- **Processing Time**: ~500ms per user
- **Rate Limiting**: 500ms delay between requests
- **Cron Job**: Runs daily at 2 AM (low traffic time)

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Users can log in normally (no delays)
2. ✅ Logs show "Auto-updated webhook for user: ..."
3. ✅ Cron job runs daily
4. ✅ Messages appear in UI after sending to WhatsApp
5. ✅ No "webhook not configured" errors

## 🔐 Security

- ✅ Tokens are fetched securely from aisency-api
- ✅ Updates run in background (non-blocking)
- ✅ Failed updates don't affect user experience
- ✅ Errors are logged but not exposed to users

## 📚 Related Files

### wapi-api:
- `services/aisensy-webhook-updater.service.js` - Main logic
- `controllers/aisensy-webhook.controller.js` - API handlers
- `routes/aisensy-webhook.routes.js` - API routes
- `cronjob/update-aisensy-webhooks.cron.js` - Cron job
- `middlewares/auto-update-webhook.js` - Auto-update middleware
- `scripts/update-aisensy-webhooks.js` - CLI script

### aisency-api:
- `controllers/aisensy-token.controller.js` - Token provider
- `routes/aisensy-token.routes.js` - Token route
- `services/token-manager.js` - Token management

## 🎉 Summary

✅ **Automatic Updates**: On login, registration, and daily cron  
✅ **Non-Blocking**: Runs in background  
✅ **Reliable**: Error handling and logging  
✅ **Scalable**: Handles multiple users  
✅ **Monitored**: Full logging and status tracking  

**Your webhook system is fully automated!** 🚀

Users just need to log in, and their webhooks will be updated automatically. No manual intervention needed!

---

## 🆘 Need Help?

Check logs:
```bash
pm2 logs qwiktalks-api --lines 100
```

Test manually:
```bash
node scripts/update-aisensy-webhooks.js all
```

Verify webhook:
```bash
curl "https://api.qwiktalks.com/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=qwiktalks_secure_webhook_token_2024&hub.challenge=test123"
```

Should return: `test123` ✅
