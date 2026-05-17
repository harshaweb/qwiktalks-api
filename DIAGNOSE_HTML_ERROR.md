# 🔍 Diagnosing HTML Error from aisency-api

## ✅ Good News!

The provider fix worked! The system is now using **AisensyProvider** correctly:

```
✅ [UnifiedService] Calling provider sendMessage with: { providerType: 'aisensy' }
✅ [AiSensy Provider] Sending message with payload: {...}
✅ [wapi-api Aisensy Service] Forwarding sendMessage: http://localhost:5001/aisensy/messages
```

## ❌ New Issue

aisency-api is returning HTML instead of JSON:

```
Error: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

This means aisency-api is returning an HTML error page (like a 404 or 500 error page) instead of JSON.

---

## 🔍 Diagnostic Steps

Run these commands on your server to diagnose:

### Step 1: Check if aisency-api is running

```bash
pm2 list | grep aisency-api
```

**Expected:** Status should be "online"

### Step 2: Check aisency-api logs

```bash
pm2 logs aisency-api --lines 50
```

Look for:
- ❌ Errors or crashes
- ❌ Route not found errors
- ❌ Missing dependencies

### Step 3: Test aisency-api directly

```bash
curl http://localhost:5001/
```

**Expected:** `{"message":"Welcome to the API"}`

**If you get HTML:** aisency-api is not running or crashed

### Step 4: Test the messages endpoint

```bash
curl -X POST http://localhost:5001/aisensy/messages \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "6a03008bf542cc0960006058",
    "to": "919219156040",
    "type": "text",
    "text": {"body": "Test"}
  }'
```

**Expected:** JSON response with success or error message

**If you get HTML:** The route is not registered or there's an error

---

## 🐛 Common Causes

### Cause 1: aisency-api crashed

**Check:**
```bash
pm2 logs aisency-api --lines 50 --err
```

**Look for:**
- Syntax errors
- Missing modules
- Database connection errors

**Fix:**
```bash
cd /root/aisency/aisency-api
pm2 restart aisency-api
pm2 logs aisency-api --lines 20
```

### Cause 2: Route not registered

The `/aisensy/messages` route might not be registered in index.js.

**Check:**
```bash
cd /root/aisency/aisency-api
grep -n "messagesRoutes" index.js
```

**Should see:**
```javascript
const messagesRoutes = require('./routes/message/messages');  // Line ~97
app.use('/aisensy', messagesRoutes);  // Line ~143
```

**If missing, add it:**
```bash
nano index.js
```

Add after the other routes:
```javascript
const messagesRoutes = require('./routes/message/messages');
```

And in the middleware section:
```javascript
app.use('/aisensy', messagesRoutes);
```

### Cause 3: File doesn't exist

**Check if the route file exists:**
```bash
ls -la /root/aisency/aisency-api/routes/message/messages.js
```

**If missing:** The file needs to be created on the server.

### Cause 4: Port conflict

**Check if something else is using port 5001:**
```bash
lsof -i :5001
```

**If another process is using it:**
```bash
# Kill the other process or change aisency-api port
```

---

## 🚀 Quick Fix

Try restarting aisency-api:

```bash
pm2 restart aisency-api
pm2 logs aisency-api --lines 30
```

Then test again:

```bash
curl -X POST http://localhost:5001/aisensy/messages \
  -H "Content-Type: application/json" \
  -d '{"user_id":"6a03008bf542cc0960006058","to":"919219156040","type":"text","text":{"body":"Test"}}'
```

---

## 🔍 Check Route Registration

Run this to see all registered routes:

```bash
cd /root/aisency/aisency-api
grep -A 2 "app.use" index.js | grep -E "(const|app.use)"
```

**Should include:**
```javascript
const messagesRoutes = require('./routes/message/messages');
app.use('/aisensy', messagesRoutes);
```

---

## 📝 Verify File Structure

Check if all required files exist:

```bash
cd /root/aisency/aisency-api

# Check route file
ls -la routes/message/messages.js

# Check function files
ls -la functions/message/send_text_message.js
ls -la functions/message/send_image_message.js
ls -la functions/message/send_document_message.js

# Check token manager
ls -la services/token-manager.js
```

**If any are missing:** They need to be created on the server.

---

## 🎯 Most Likely Issue

Based on the error, the most likely issue is:

1. **aisency-api crashed** and needs to be restarted
2. **The route is not registered** in index.js
3. **The files don't exist** on the server (they're only on your local machine)

---

## 🔧 Solution

### Option 1: Restart and Check

```bash
pm2 restart aisency-api
pm2 logs aisency-api --lines 30
```

Look for startup errors.

### Option 2: Check if Files Exist

```bash
cd /root/aisency/aisency-api
ls -la routes/message/
```

**If `messages.js` doesn't exist:** The file needs to be uploaded to the server.

### Option 3: Check index.js

```bash
cd /root/aisency/aisency-api
grep "messagesRoutes" index.js
```

**If not found:** The route needs to be added to index.js.

---

## 📊 Expected vs Actual

### Expected Response (JSON):
```json
{
  "success": true,
  "data": {
    "messages": [{"id": "wamid.HBg..."}]
  },
  "message_id": "wamid.HBg..."
}
```

### Actual Response (HTML):
```html
<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body>
<h1>Cannot POST /aisensy/messages</h1>
</body>
</html>
```

This HTML response indicates the route doesn't exist or isn't registered.

---

## 🆘 Next Steps

1. **Check aisency-api logs:**
   ```bash
   pm2 logs aisency-api --lines 50
   ```

2. **Test the endpoint:**
   ```bash
   curl -X POST http://localhost:5001/aisensy/messages \
     -H "Content-Type: application/json" \
     -d '{"user_id":"6a03008bf542cc0960006058","to":"919219156040","type":"text","text":{"body":"Test"}}'
   ```

3. **Check if route file exists:**
   ```bash
   ls -la /root/aisency/aisency-api/routes/message/messages.js
   ```

4. **Check if route is registered:**
   ```bash
   grep "messagesRoutes" /root/aisency/aisency-api/index.js
   ```

---

## 📝 Summary

**Status:** Provider fix worked! ✅  
**New Issue:** aisency-api returning HTML instead of JSON ❌  
**Likely Cause:** Route not registered or files don't exist on server  
**Next Step:** Check aisency-api logs and verify files exist  

