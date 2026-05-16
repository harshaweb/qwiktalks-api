# 🚨 Quick Fix: Messages Not Showing in UI

## 🎯 Most Common Issue: Phone Number Not Configured

The most common reason messages don't appear is that the **phone_number_id** from WhatsApp doesn't match what's in your database.

## ✅ Quick Fix Steps

### Step 1: Find Your Phone Number ID

Send a test message to your WhatsApp Business number, then check your server logs:

```bash
pm2 logs wapi-api --lines 50
```

Look for a line like:
```
WhatsApp phone number not found for phone_number_id: 1038713089333219
```

Copy that phone_number_id.

### Step 2: Check Database

```javascript
// Connect to MongoDB
mongo wapi

// Check if phone number exists
db.whatsappphonenumbers.find({
  phone_number_id: "1038713089333219"  // Use the ID from logs
})
```

**If it returns nothing**, that's your problem!

### Step 3: Add Phone Number to Database

You need to configure the WhatsApp phone number in your system:

1. **Via UI (Recommended):**
   - Log into your admin panel
   - Go to WhatsApp Connections
   - Add/Configure your WhatsApp Business number
   - Make sure the phone_number_id matches

2. **Via Database (Quick Fix):**
   ```javascript
   // Find your user ID first
   db.users.findOne({ email: "hello@vishaldalve.com" })
   // Copy the _id
   
   // Check if WABA exists
   db.whatsappwabas.findOne()
   // Copy the _id
   
   // Add phone number
   db.whatsappphonenumbers.insertOne({
     phone_number_id: "1038713089333219",  // From webhook logs
     display_phone_number: "916393489446",  // Your WhatsApp number
     user_id: ObjectId("YOUR_USER_ID"),     // From above
     waba_id: ObjectId("YOUR_WABA_ID"),     // From above
     verified_name: "Your Business Name",
     quality_rating: "GREEN",
     created_at: new Date(),
     updated_at: new Date()
   })
   ```

### Step 4: Test Again

Send another WhatsApp message. It should now appear in your UI!

---

## 🔍 Other Quick Checks

### Check 1: Is Webhook Verified in Meta?

```bash
curl "https://api.qwiktalks.com/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=qwiktalks_secure_webhook_token_2024&hub.challenge=test123"
```

Should return: `test123`

If not, webhook is not configured correctly.

### Check 2: Is Server Running?

```bash
curl https://api.qwiktalks.com/
```

Should return: `{"message":"App is running successfully"}`

### Check 3: Are Webhooks Being Sent?

1. Go to: https://developers.facebook.com/
2. Your App → WhatsApp → Configuration
3. Webhook → Manage → View Recent Deliveries
4. Check if webhooks are being sent and what the response is

---

## 🎯 Run Diagnostic

Run this command to check everything:

```bash
cd /Users/harshaweb/Documents/projects/vishal-dalve/new-wapi/wapi-api
./diagnose-webhook.sh
```

This will test:
- ✅ Server health
- ✅ Webhook verification
- ✅ Endpoint accessibility
- ✅ SSL certificate

---

## 📞 Still Not Working?

### Get the Exact Error

Add this to your `.env` file temporarily:

```env
DEBUG=*
NODE_ENV=development
```

Restart server:
```bash
pm2 restart wapi-api
```

Send a test message and check logs:
```bash
pm2 logs wapi-api --lines 100
```

Look for the exact error message and share it.

---

## ✅ Expected Flow

When working correctly:

1. **Send WhatsApp message** ✉️
2. **Meta sends webhook** → `https://api.qwiktalks.com/webhook/whatsapp`
3. **Server logs:** `"WhatsApp webhook called"`
4. **Finds phone number in database** ✅
5. **Creates/updates contact** 👤
6. **Saves message to MongoDB** 💾
7. **Emits Socket.IO event** 📡
8. **UI updates** ✨

If step 4 fails (phone number not found), nothing else happens!

---

## 🆘 Need Help?

Share these details:

1. **Server logs** (last 50 lines):
   ```bash
   pm2 logs wapi-api --lines 50
   ```

2. **Phone number check**:
   ```javascript
   db.whatsappphonenumbers.find()
   ```

3. **Meta webhook status**: Screenshot from Meta for Developers

4. **Diagnostic results**:
   ```bash
   ./diagnose-webhook.sh
   ```
