# 🚨 FIX NOW - Message Sending Issues

## ⚡ Quick Fix (Copy & Paste)

SSH into your server and run these commands:

```bash
# Fix 1: Remove duplicate in aisency-api
cd /root/aisency/aisency-api
cp index.js index.js.backup
sed -i '96d' index.js
sed -i '142d' index.js
pm2 restart aisency-api

# Fix 2: Update provider to aisensy
mongo wapi --eval 'db.whatsapp_wabas.updateMany({ user_id: ObjectId("6a03008bf542cc0960006058") }, { $set: { provider: "aisensy" } })'

# Fix 3: Restart wapi-api
pm2 restart qwiktalks-api

# Check logs
pm2 logs --lines 30
```

## ✅ Verify It Worked

### 1. Check aisency-api started:
```bash
pm2 logs aisency-api --lines 10
```

Should see:
```
✅ Server running on http://localhost:5001
✅ MongoDB connected successfully
```

Should NOT see:
```
❌ SyntaxError: Identifier 'sendMessageRoutes' has already been declared
```

### 2. Check provider was updated:
```bash
mongo wapi --eval 'db.whatsapp_wabas.findOne({ user_id: ObjectId("6a03008bf542cc0960006058") }, { provider: 1 })'
```

Should see:
```javascript
{ "_id": ObjectId("..."), "provider": "aisensy" }  // ✅ Correct!
```

Should NOT see:
```javascript
{ "_id": ObjectId("..."), "provider": "business_api" }  // ❌ Wrong!
```

### 3. Send a test message from your UI

Check logs:
```bash
pm2 logs qwiktalks-api --lines 50 | grep -i aisensy
```

Should see:
```
✅ [AiSensy Provider] Sending message with payload: {...}
✅ [wapi-api Aisensy Service] Forwarding sendMessage
✅ [wapi-api Aisensy Service] sendMessage response: 200
```

Should NOT see:
```
❌ at BusinessAPIProvider.sendWhatsAppAPIMessage
❌ WhatsApp API error (400): (#10) You do not have the necessary permissions
```

## 🔧 Manual Fix (If sed Doesn't Work)

### Fix aisency-api manually:

```bash
cd /root/aisency/aisency-api
nano index.js
```

**Find and DELETE these TWO lines:**

1. Around line 96:
```javascript
const sendMessageRoutes = require('./routes/message/send_message');  // ❌ DELETE THIS
```

2. Around line 143:
```javascript
app.use('/aisensy', sendMessageRoutes);  // ❌ DELETE THIS
```

**Keep the FIRST occurrence of each** (around lines 64 and 113).

Save: `Ctrl+X`, then `Y`, then `Enter`

```bash
pm2 restart aisency-api
```

## 📊 What Each Fix Does

### Fix 1: Remove Duplicate Declaration
- **Problem:** aisency-api crashes on startup
- **Cause:** `sendMessageRoutes` declared twice
- **Solution:** Remove duplicate lines
- **Result:** aisency-api starts successfully

### Fix 2: Update Provider
- **Problem:** System uses wrong provider (BusinessAPIProvider)
- **Cause:** Database has `provider: "business_api"`
- **Solution:** Change to `provider: "aisensy"`
- **Result:** System uses AisensyProvider

### Fix 3: Restart Services
- **Why:** Apply the changes
- **Result:** Both services running with correct configuration

## 🎯 Expected Behavior After Fix

### Before Fix:
```
UI → wapi-api → BusinessAPIProvider → Meta API → ❌ Permission Error
```

### After Fix:
```
UI → wapi-api → AisensyProvider → aisency-api → AiSensy API → ✅ Message Sent!
```

## 🆘 Still Not Working?

### Check 1: Is aisency-api running?
```bash
curl http://localhost:5001/
```

Expected: `{"message":"Welcome to the API"}`

### Check 2: Does user have AiSensy token?
```bash
curl "http://localhost:5001/aisensy/get-token?user_id=6a03008bf542cc0960006058"
```

Expected: `{"success":true,"token":"eyJhbGci..."}`

### Check 3: Test direct API call
```bash
curl -X POST http://localhost:5001/aisensy/messages \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "6a03008bf542cc0960006058",
    "to": "917089379345",
    "type": "text",
    "text": {"body": "Test"}
  }'
```

Expected: `{"success":true,"data":{...},"message_id":"wamid..."}`

## 📝 Summary

**Issue 1:** Duplicate declaration → **Fix:** Remove lines 96 & 143  
**Issue 2:** Wrong provider → **Fix:** Update to "aisensy"  
**Result:** Messages send successfully! 🚀

## 🎉 Success Indicators

After the fix, you should see:

1. ✅ aisency-api starts without errors
2. ✅ Logs show "AiSensy Provider" (not "BusinessAPIProvider")
3. ✅ Messages send successfully
4. ✅ No permission errors
5. ✅ Messages appear in WhatsApp

---

**Need more help?** Check these files:
- `SERVER_FIX_GUIDE.md` - Detailed step-by-step guide
- `ISSUE_EXPLANATION.md` - Understanding the problem
- `AISENSY_MESSAGE_SENDING.md` - How the system works

