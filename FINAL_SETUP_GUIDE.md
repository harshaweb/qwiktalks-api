# 🎯 Final Setup Guide - WhatsApp Webhook

## ✅ Current Status

Your server is **running successfully** at `https://api.qwiktalks.com`

## 🔧 What's Configured

1. ✅ **Webhook URL**: `https://api.qwiktalks.com/webhook/whatsapp`
2. ✅ **Verify Token**: `qwiktalks_secure_webhook_token_2024`
3. ✅ **Server**: Running (confirmed from logs)
4. ✅ **MongoDB**: Connected
5. ✅ **AiSensy Integration**: Active

## 📋 Final Steps

### Step 1: Configure WhatsApp Webhook in Meta

1. Go to: https://developers.facebook.com/
2. Select your app → **WhatsApp** → **Configuration**
3. In the **Webhook** section, enter:
   - **Callback URL**: `https://api.qwiktalks.com/webhook/whatsapp`
   - **Verify Token**: `qwiktalks_secure_webhook_token_2024`
4. Click **"Verify and Save"**
5. Subscribe to webhook fields:
   - ✅ `messages`
   - ✅ `message_status`

### Step 2: Update AiSensy Webhooks for All Users

Run this command on your server:

```bash
cd /root/wapi-new/qwiktalks-api
node scripts/update-aisensy-webhooks.js all
```

This will update the webhook URL for all your users' AiSensy accounts.

### Step 3: Test Incoming Messages

1. Send a test message to your WhatsApp Business number
2. Check if it appears in your UI
3. Check server logs:
   ```bash
   pm2 logs qwiktalks-api --lines 50 | grep "WhatsApp webhook"
   ```

## 🔍 Verification Checklist

Run these commands to verify everything:

### 1. Check Webhook Verification
```bash
curl "https://api.qwiktalks.com/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=qwiktalks_secure_webhook_token_2024&hub.challenge=test123"
```
**Expected**: `test123`

### 2. Check Server Health
```bash
curl https://api.qwiktalks.com/
```
**Expected**: `{"message":"App is running successfully"}`

### 3. Check Cron Job
```bash
pm2 logs qwiktalks-api | grep "Webhook update cron job"
```
**Expected**: `✅ Webhook update cron job scheduled (daily at 2 AM)`

### 4. Check AiSensy Integration
```bash
pm2 logs qwiktalks-api | grep "AiSensy"
```
**Expected**: Should see AiSensy API calls

## 🎯 What Happens Now

### Automatic Webhook Updates

Your system will automatically update webhooks:

1. **Daily at 2 AM** - Cron job updates all users
2. **On new user registration** - Webhook updated automatically
3. **Manual updates** - Via CLI or API when needed

### Message Flow

When someone sends a WhatsApp message:

1. **WhatsApp** → Sends to Meta
2. **Meta** → Sends webhook to `https://api.qwiktalks.com/webhook/whatsapp`
3. **Your Server** → Processes and stores message
4. **Socket.IO** → Updates UI in real-time
5. **UI** → Shows new message ✨

## 🐛 Current Issue: Permission Error

I see this error in your logs:
```
Error: (#10) You do not have the necessary permissions required to send messages
```

This is **NOT** related to webhooks. This is about **sending** messages (outbound), not receiving them.

### To Fix Sending Permission:

1. **Check WhatsApp Business Account permissions**
   - Go to Meta Business Manager
   - Check if your app has permission to send messages
   - Verify access token has correct permissions

2. **Check Access Token**
   - Make sure the access token is valid
   - Token needs `whatsapp_business_messaging` permission

3. **Check Phone Number Status**
   - Phone number must be verified
   - Must have message templates approved

**Note**: Receiving messages (webhooks) will work fine. This error only affects sending messages.

## 📊 Monitor Webhook Activity

### Check Recent Webhooks
```bash
pm2 logs qwiktalks-api --lines 100 | grep "webhook"
```

### Check Message Processing
```bash
pm2 logs qwiktalks-api --lines 100 | grep "WhatsApp webhook called"
```

### Check Database
```bash
mongo wapi
db.messages.find({direction: "inbound"}).sort({created_at: -1}).limit(5)
```

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Webhook verification returns `test123`
2. ✅ Meta shows webhook as "Active"
3. ✅ Server logs show "WhatsApp webhook called"
4. ✅ Messages appear in MongoDB
5. ✅ Messages appear in UI
6. ✅ Cron job is scheduled

## 🚀 Quick Commands

```bash
# Restart server
pm2 restart qwiktalks-api

# View logs
pm2 logs qwiktalks-api

# Update all webhooks
node scripts/update-aisensy-webhooks.js all

# Test webhook
curl "https://api.qwiktalks.com/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=qwiktalks_secure_webhook_token_2024&hub.challenge=test123"

# Check server status
pm2 status
```

## 📚 Documentation

- **Webhook Setup**: `WEBHOOK_SETUP.md`
- **AiSensy Updater**: `AISENSY_WEBHOOK_UPDATER.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`
- **Quick Fix**: `QUICK_FIX.md`

## 🎉 You're Almost Done!

Just complete these 2 steps:

1. **Configure webhook in Meta** (Step 1 above)
2. **Update AiSensy webhooks** (Step 2 above)

Then send a test message and watch it appear in your UI! 🚀

---

## 📞 Need Help?

If messages still don't appear after completing the steps:

1. Share the output of:
   ```bash
   pm2 logs qwiktalks-api --lines 50
   ```

2. Check Meta webhook delivery logs

3. Verify webhook is configured correctly in Meta

The webhook system is ready and working - just needs the final Meta configuration! ✨
