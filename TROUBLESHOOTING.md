# 🔧 Webhook Troubleshooting Guide

## Issue: Messages Not Appearing in UI

You can see old messages but new messages from WhatsApp are not showing up in the UI.

## 🔍 Step-by-Step Debugging

### Step 1: Check Meta Webhook Status

1. Go to: https://developers.facebook.com/
2. Select your app → **WhatsApp** → **Configuration**
3. Scroll to **Webhook** section
4. Check:
   - ✅ Status should be "Active" or "Connected"
   - ✅ Callback URL: `https://api.qwiktalks.com/webhook/whatsapp`
   - ✅ Verify Token: `qwiktalks_secure_webhook_token_2024`
   - ✅ Subscribed fields: `messages` ✓

5. Click **"Manage"** or **"View Recent Deliveries"**
   - Check if webhooks are being sent
   - Look for any failed deliveries
   - Check error messages if any

### Step 2: Check Server Logs

SSH into your server and check logs:

```bash
# Check if webhook is being called
tail -f /path/to/your/logs

# Or if using PM2
pm2 logs wapi-api

# Look for these messages:
# "WhatsApp webhook called"
# "Processing status update for message..."
```

**What to look for:**
- ✅ "WhatsApp webhook called" - Webhook is receiving data
- ❌ No logs - Webhook is not being called (Meta issue)
- ❌ Error logs - There's a processing error

### Step 3: Test Webhook Manually

Run the test script:

```bash
cd /Users/harshaweb/Documents/projects/vishal-dalve/new-wapi/wapi-api
node test-webhook-live.js
```

This will:
1. Test webhook verification
2. Send a test message
3. Show you the response

### Step 4: Check Database

Check if messages are being stored:

```javascript
// Connect to MongoDB
mongo wapi

// Check recent messages
db.messages.find({
  direction: "inbound"
}).sort({created_at: -1}).limit(5)

// Check if your test message is there
db.messages.find({
  sender_number: "919219156040"
}).sort({created_at: -1}).limit(1)
```

### Step 5: Check Socket.IO Connection

The UI updates via Socket.IO. Check if Socket.IO is working:

1. Open browser console (F12)
2. Look for Socket.IO connection logs
3. Check for errors

## 🐛 Common Issues & Solutions

### Issue 1: Webhook Not Verified in Meta

**Symptoms:**
- Meta shows "Not Connected" or "Failed"
- No webhooks being sent

**Solution:**
```bash
# 1. Check if server is running
curl https://api.qwiktalks.com/

# 2. Test webhook verification
curl "https://api.qwiktalks.com/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=qwiktalks_secure_webhook_token_2024&hub.challenge=test123"

# Should return: test123
```

If this fails:
- Check if server is running
- Check if WHATSAPP_VERIFY_TOKEN in .env matches
- Check server logs for errors

### Issue 2: Webhook Receiving But Not Processing

**Symptoms:**
- Logs show "WhatsApp webhook called"
- But no messages in database

**Solution:**
Check for errors in webhook processing:

```bash
# Check full logs
pm2 logs wapi-api --lines 100

# Look for:
# - Database connection errors
# - WhatsApp phone number not found errors
# - Processing errors
```

Common causes:
- ❌ WhatsApp phone number not configured in database
- ❌ MongoDB connection issue
- ❌ Missing access token

### Issue 3: Messages in Database But Not in UI

**Symptoms:**
- Messages are in MongoDB
- But UI doesn't update

**Solution:**
This is a Socket.IO issue:

1. **Check Socket.IO server:**
```javascript
// In app.js, check if io is initialized
const io = app.get("io");
console.log("Socket.IO instance:", io);
```

2. **Check Socket.IO client:**
- Open browser console
- Look for Socket.IO connection
- Check for `whatsapp:message` events

3. **Check if io is passed to webhook handler:**
```javascript
// In app.js, line ~300
app.post("/webhook/whatsapp", (req, res) => {
  const io = app.get("io"); // ← Check this line
  // ...
  return handleIncomingMessageOriginal(req, res, io); // ← io should be passed
});
```

### Issue 4: Wrong Phone Number ID

**Symptoms:**
- Webhook receives messages
- Logs show "WhatsApp phone number not found"

**Solution:**
Check if phone_number_id matches:

```javascript
// Check in database
db.whatsappphonenumbers.find({
  phone_number_id: "1038713089333219"
})

// If not found, you need to add it
// Or check what phone_number_id is in your webhook payload
```

## 🔧 Quick Fixes

### Fix 1: Restart Server

```bash
pm2 restart wapi-api
# or
pm2 restart all
```

### Fix 2: Check Environment Variables

```bash
# Check if .env is loaded
pm2 env wapi-api | grep WHATSAPP_VERIFY_TOKEN

# Should show: qwiktalks_secure_webhook_token_2024
```

### Fix 3: Re-verify Webhook in Meta

1. Go to Meta for Developers
2. WhatsApp → Configuration → Webhook
3. Click "Edit"
4. Re-enter the same values
5. Click "Verify and Save"

### Fix 4: Check CORS

If webhook works but UI doesn't update:

```javascript
// Check ALLOWED_ORIGINS in .env includes your frontend URL
ALLOWED_ORIGINS=https://qwiktalks.com,https://admin.qwiktalks.com
```

## 📊 Diagnostic Checklist

Run through this checklist:

- [ ] Server is running (`curl https://api.qwiktalks.com/`)
- [ ] Webhook verification works (test with curl)
- [ ] Meta shows webhook as "Active"
- [ ] WHATSAPP_VERIFY_TOKEN in .env is correct
- [ ] Phone number is configured in database
- [ ] MongoDB is connected
- [ ] Socket.IO is initialized
- [ ] Frontend is connected to Socket.IO
- [ ] No errors in server logs
- [ ] No errors in browser console

## 🆘 Still Not Working?

### Get Detailed Logs

Add more logging to webhook handler:

```javascript
// In controllers/whatsapp-webhook.controller.js
export const handleIncomingMessage = async (req, res, io = null) => {
  console.log("=== WEBHOOK DEBUG START ===");
  console.log("Body:", JSON.stringify(req.body, null, 2));
  console.log("IO instance:", io ? "Present" : "Missing");
  
  // ... rest of code
  
  console.log("=== WEBHOOK DEBUG END ===");
};
```

### Check Meta Webhook Logs

1. Meta for Developers → Your App
2. WhatsApp → Configuration
3. Webhook → Manage
4. Click "View Recent Deliveries"
5. Check:
   - Are webhooks being sent?
   - What's the response code? (should be 200)
   - Any error messages?

### Test with Different Message Types

Try sending:
1. Simple text message
2. Image
3. Reply to a message

See which ones work and which don't.

## 📞 Contact Support

If still not working, provide:
1. Server logs (last 50 lines)
2. Meta webhook delivery logs
3. MongoDB query results
4. Browser console errors
5. Screenshot of Meta webhook configuration

---

## ✅ Expected Behavior

When everything works correctly:

1. **You send WhatsApp message** → 
2. **Meta sends webhook to your server** → 
3. **Server logs: "WhatsApp webhook called"** → 
4. **Message saved to MongoDB** → 
5. **Socket.IO emits 'whatsapp:message'** → 
6. **UI receives event and displays message** ✨

If any step fails, that's where the issue is!
