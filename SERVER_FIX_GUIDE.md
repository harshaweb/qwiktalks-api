# 🔧 Server Fix Guide - Message Sending Issues

## 🐛 Current Issues

Based on the logs, there are 2 issues:

### Issue 1: aisency-api - Duplicate Declaration Error ❌
```
SyntaxError: Identifier 'sendMessageRoutes' has already been declared
```

### Issue 2: wapi-api - Using Wrong Provider ❌
```
Error: WhatsApp API error (400): (#10) You do not have the necessary permissions
at BusinessAPIProvider.sendWhatsAppAPIMessage
```

The system is using `BusinessAPIProvider` instead of `AisensyProvider`.

## ✅ Solution

### Step 1: Fix aisency-api (Duplicate Declaration)

SSH into your server and run:

```bash
cd /root/aisency/aisency-api

# Backup the file
cp index.js index.js.backup

# Open the file
nano index.js
```

**Find and remove these duplicate lines:**

Around **line 96**, remove:
```javascript
const sendMessageRoutes = require('./routes/message/send_message');
```

Around **line 143**, remove:
```javascript
app.use('/aisensy', sendMessageRoutes);
```

**Keep only the first declaration** (around line 64):
```javascript
const sendMessageRoutes = require('./routes/message/send_message');
```

**Keep only the first usage** (around line 113):
```javascript
app.use('/aisensy', sendMessageRoutes);
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

**Restart aisency-api:**
```bash
pm2 restart aisency-api
pm2 logs aisency-api --lines 20
```

You should see:
```
Server running on http://localhost:5001
MongoDB connected successfully
```

### Step 2: Fix wapi-api (Wrong Provider)

The issue is that the user's WhatsApp connection is set to use `business_api` provider instead of `aisensy`.

**Option A: Update User's Provider in Database**

```bash
# Connect to MongoDB
mongo wapi

# Find the user's WABA
db.whatsapp_wabas.find({ user_id: ObjectId("6a03008bf542cc0960006058") })

# Update to use aisensy provider
db.whatsapp_wabas.updateMany(
  { user_id: ObjectId("6a03008bf542cc0960006058") },
  { $set: { provider: "aisensy" } }
)

# Verify the change
db.whatsapp_wabas.find({ user_id: ObjectId("6a03008bf542cc0960006058") })
```

**Option B: Update aisensy.provider.js on Server**

Copy the updated provider file to the server:

```bash
# From your local machine
scp /Users/harshaweb/Documents/projects/vishal-dalve/new-wapi/wapi-api/services/whatsapp/providers/aisensy.provider.js root@YOUR_SERVER_IP:/root/wapi-new/qwiktalks-api/services/whatsapp/providers/

# Then on the server
pm2 restart qwiktalks-api
```

### Step 3: Verify the Fix

**Test 1: Check aisency-api is running**
```bash
curl http://localhost:5001/
```

Should return: `{"message":"Welcome to the API"}`

**Test 2: Check user's provider**
```bash
mongo wapi
db.whatsapp_wabas.findOne({ user_id: ObjectId("6a03008bf542cc0960006058") })
```

Should show: `provider: "aisensy"`

**Test 3: Send a test message from UI**

Check logs:
```bash
pm2 logs qwiktalks-api --lines 50 | grep -i aisensy
```

Should see:
```
[AiSensy Provider] Sending message with payload: {...}
[wapi-api Aisensy Service] Forwarding sendMessage: http://localhost:5001/aisensy/messages
```

## 🎯 Quick Fix Commands

Run these commands on your server:

```bash
# Fix aisency-api
cd /root/aisency/aisency-api
cp index.js index.js.backup

# Remove duplicate lines (adjust line numbers if needed)
sed -i '96d' index.js  # Remove duplicate const declaration
sed -i '142d' index.js  # Remove duplicate app.use

pm2 restart aisency-api

# Fix user's provider
mongo wapi --eval 'db.whatsapp_wabas.updateMany({ user_id: ObjectId("6a03008bf542cc0960006058") }, { $set: { provider: "aisensy" } })'

# Restart wapi-api
pm2 restart qwiktalks-api

# Check logs
pm2 logs --lines 50
```

## 🔍 Detailed Fix for index.js

If you prefer to manually edit, here's what the file should look like:

**Around line 64-96 (BEFORE FIX):**
```javascript
const sendMessageRoutes = require('./routes/message/send_message');  // Line 64 ✅ KEEP
const sendMarketingMessageRoutes = require('./routes/message/send_marketing_message');
// ... other routes ...
const tokenRoutes = require('./routes/aisensy-token.routes');
const sendMessageRoutes = require('./routes/message/send_message');  // Line 96 ❌ REMOVE THIS
const messagesRoutes = require('./routes/message/messages');
```

**Around line 64-96 (AFTER FIX):**
```javascript
const sendMessageRoutes = require('./routes/message/send_message');  // Line 64 ✅ KEEP
const sendMarketingMessageRoutes = require('./routes/message/send_marketing_message');
// ... other routes ...
const tokenRoutes = require('./routes/aisensy-token.routes');
const messagesRoutes = require('./routes/message/messages');  // ✅ No duplicate
```

**Around line 113-143 (BEFORE FIX):**
```javascript
app.use('/aisensy', sendMessageRoutes);  // Line 113 ✅ KEEP
app.use('/aisensy', sendMarketingMessageRoutes);
// ... other middleware ...
app.use('/aisensy', tokenRoutes);
app.use('/aisensy', sendMessageRoutes);  // Line 143 ❌ REMOVE THIS
app.use('/aisensy', messagesRoutes);
```

**Around line 113-143 (AFTER FIX):**
```javascript
app.use('/aisensy', sendMessageRoutes);  // Line 113 ✅ KEEP
app.use('/aisensy', sendMarketingMessageRoutes);
// ... other middleware ...
app.use('/aisensy', tokenRoutes);
app.use('/aisensy', messagesRoutes);  // ✅ No duplicate
```

## 📊 Expected Logs After Fix

### aisency-api logs:
```
Server running on http://localhost:5001
MongoDB connected successfully
[2026-05-17T12:15:00.000Z] POST /aisensy/messages | IP: ::ffff:127.0.0.1
[AiSensy Messages] Received request: {"user_id":"...","to":"917089379345","type":"text",...}
[AiSensy] Sending text message to 917089379345 for user 6a03008bf542cc0960006058
[AiSensy] Message sent successfully
```

### wapi-api logs:
```
[AiSensy Provider] Sending message with payload: {...}
[wapi-api Aisensy Service] Forwarding sendMessage: http://localhost:5001/aisensy/messages
[wapi-api Aisensy Service] sendMessage response: 200 {"success":true,...}
```

## ❌ What NOT to See

You should NOT see:
```
❌ SyntaxError: Identifier 'sendMessageRoutes' has already been declared
❌ at BusinessAPIProvider.sendWhatsAppAPIMessage
❌ WhatsApp API error (400): (#10) You do not have the necessary permissions
```

## ✅ Success Indicators

1. ✅ aisency-api starts without errors
2. ✅ No "duplicate declaration" error
3. ✅ Logs show "AiSensy Provider" (not "BusinessAPIProvider")
4. ✅ Messages send successfully
5. ✅ No permission errors

## 🆘 Still Having Issues?

### Check Provider Configuration

```bash
# Check which provider the user is using
mongo wapi
db.whatsapp_wabas.find({ user_id: ObjectId("6a03008bf542cc0960006058") }).pretty()
```

Should show:
```javascript
{
  "_id": ObjectId("..."),
  "user_id": ObjectId("6a03008bf542cc0960006058"),
  "provider": "aisensy",  // ✅ Should be "aisensy"
  "is_active": true,
  // ...
}
```

If it shows `"provider": "business_api"`, update it:
```bash
db.whatsapp_wabas.updateMany(
  { user_id: ObjectId("6a03008bf542cc0960006058") },
  { $set: { provider: "aisensy" } }
)
```

### Check AiSensy Token

```bash
curl "http://localhost:5001/aisensy/get-token?user_id=6a03008bf542cc0960006058"
```

Should return:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Manual Test

```bash
# Test sending a message directly to aisency-api
curl -X POST http://localhost:5001/aisensy/messages \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "6a03008bf542cc0960006058",
    "to": "917089379345",
    "type": "text",
    "text": {
      "body": "Test message from server"
    }
  }'
```

Should return:
```json
{
  "success": true,
  "data": {...},
  "message_id": "wamid.HBg..."
}
```

## 📝 Summary

**Fix 1:** Remove duplicate `sendMessageRoutes` declaration in aisency-api/index.js  
**Fix 2:** Update user's provider to "aisensy" in database  
**Fix 3:** Restart both services  

After these fixes, messages should send successfully via AiSensy! 🚀

