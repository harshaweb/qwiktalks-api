# 📤 Complete API Flow - Sending a Text Message

## 🎯 When You Click "Send" in Your UI

Here's the **exact** API flow when you send a simple text message like "Hello":

---

## 📊 Step-by-Step API Calls

### Step 1: Your UI Makes the Request

**API Call:**
```http
POST http://localhost:4000/api/unified-whatsapp/send-message
Content-Type: application/json
Authorization: Bearer <your_jwt_token>

{
  "contact_id": "6a123...",
  "whatsapp_phone_number_id": "6a456...",
  "messageText": "Hello",
  "messageType": "text",
  "provider": "aisensy"  // or this might be auto-detected
}
```

**File:** `wapi-api/routes/unified-whatsapp.routes.js`  
**Handler:** `wapi-api/controllers/unified-whatsapp.controller.js` → `sendMessage()`

---

### Step 2: Controller Processes the Request

**File:** `wapi-api/controllers/unified-whatsapp.controller.js`

**Function:** `sendMessage()` (line ~200)

**What it does:**
1. Validates the request (contact_id, whatsapp_phone_number_id, message)
2. Gets contact information from database
3. Gets WhatsApp phone number from database
4. Calls the unified WhatsApp service

**Code:**
```javascript
const result = await unifiedWhatsAppService.sendMessage(senderId, {
  contactId,
  whatsappPhoneNumberId,
  whatsappPhoneNumber,
  messageText,
  messageType,
  providerType: provider,
  connectionId,
  // ... other params
});
```

---

### Step 3: Unified WhatsApp Service

**File:** `wapi-api/services/whatsapp/unified-whatsapp.service.js`

**Function:** `sendMessage()` (line ~400)

**What it does:**
1. Gets the contact's phone number
2. Determines which provider to use (Business API, Baileys, or AiSensy)
3. Calls the appropriate provider

**Code:**
```javascript
// Get the provider based on user's configuration
const { provider, type, connection } = await this.getProvider(userId, connectionId);

// Call the provider's sendMessage method
const result = await provider.sendMessage(userId, {
  recipientNumber: contact.phone_number,
  messageType,
  messageText,
  whatsappPhoneNumber,
  // ... other params
}, connection);
```

---

### Step 4: Provider Selection (THE KEY STEP!)

**File:** `wapi-api/services/whatsapp/unified-whatsapp.service.js`

**Function:** `getProvider()` (line ~40)

**What it does:**
1. Queries the database for user's WhatsApp WABA connection
2. Reads the `provider` field from the database
3. Returns the corresponding provider

**Code:**
```javascript
async getProvider(userId, connectionId = null) {
  let waba = await WhatsappWaba.findOne({
    user_id: userId,
    is_active: true,
    deleted_at: null
  });

  if (waba) {
    const providerType = waba.provider || PROVIDER_TYPES.BUSINESS_API;
    //                   ^^^^^^^^^^^^^ THIS IS THE PROBLEM!
    //                   Currently returns "business_api"
    //                   Should return "aisensy"
    
    return {
      provider: this.providers[providerType],
      type: providerType,
      connection: waba
    };
  }
}
```

**Database Query:**
```javascript
db.whatsapp_wabas.findOne({ 
  user_id: ObjectId("6a03008bf542cc0960006058"),
  is_active: true 
})

// Currently returns:
{
  _id: ObjectId("..."),
  user_id: ObjectId("6a03008bf542cc0960006058"),
  provider: "business_api",  // ❌ THIS IS THE PROBLEM!
  // ...
}

// Should return:
{
  _id: ObjectId("..."),
  user_id: ObjectId("6a03008bf542cc0960006058"),
  provider: "aisensy",  // ✅ THIS IS WHAT WE NEED!
  // ...
}
```

---

### Step 5A: ❌ CURRENT FLOW (Wrong Provider)

**Provider:** `BusinessAPIProvider`  
**File:** `wapi-api/services/whatsapp/providers/business-api.provider.js`

**Function:** `sendMessage()` (line ~500)

**What it does:**
1. Tries to send via Meta's WhatsApp Business API
2. Uses Facebook access token
3. Requires Facebook Business Manager permissions

**API Call:**
```http
POST https://graph.facebook.com/v17.0/{phone_number_id}/messages
Authorization: Bearer <facebook_access_token>

{
  "messaging_product": "whatsapp",
  "to": "917089379345",
  "type": "text",
  "text": {
    "body": "Hello"
  }
}
```

**Result:** ❌ Error: Permission Denied

---

### Step 5B: ✅ CORRECT FLOW (After Fix)

**Provider:** `AisensyProvider`  
**File:** `wapi-api/services/whatsapp/providers/aisensy.provider.js`

**Function:** `sendMessage()` (line ~10)

**What it does:**
1. Formats the message for AiSensy
2. Calls the aisensy.service to forward the request

**Code:**
```javascript
async sendMessage(userId, params, connection = null) {
  const { recipientNumber, messageType, messageText } = params;
  
  // Format payload for AiSensy
  let payload = {
    to: recipientNumber,
    type: 'text',
    user_id: userId,
    recipient_type: 'individual',
    text: { body: messageText }
  };
  
  // Call aisensy service
  const result = await aisensyService.sendMessage(payload);
  
  return result;
}
```

---

### Step 6: AiSensy Forwarding Service

**File:** `wapi-api/aisency/aisensy.service.js`

**Function:** `sendMessage()` (line ~180)

**What it does:**
1. Forwards the request to aisency-api
2. Handles the response

**API Call:**
```http
POST http://localhost:5001/aisensy/messages
Content-Type: application/json

{
  "user_id": "6a03008bf542cc0960006058",
  "to": "917089379345",
  "type": "text",
  "text": {
    "body": "Hello"
  },
  "recipient_type": "individual"
}
```

**Code:**
```javascript
async sendMessage(payload) {
  const targetUrl = `${AISENCY_API_BASE_URL}/aisensy/messages`;
  console.log('[wapi-api Aisensy Service] Forwarding sendMessage:', targetUrl);

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  return data;
}
```

---

### Step 7: aisency-api Receives Request

**File:** `aisency-api/routes/message/messages.js`

**Route:** `POST /aisensy/messages`

**What it does:**
1. Validates the request
2. Extracts user_id, to, type, text
3. Calls the appropriate message function

**Code:**
```javascript
router.post('/messages', async (req, res) => {
  const { user_id, to, type, text } = req.body;
  
  if (type === 'text') {
    const result = await sendTextMessage(
      user_id,
      to,
      text.body,
      'individual'
    );
    return res.status(200).json(result);
  }
});
```

---

### Step 8: Send Text Message Function

**File:** `aisency-api/functions/message/send_text_message.js`

**Function:** `sendTextMessage()`

**What it does:**
1. Gets user's AiSensy token from token-manager
2. Formats the request for AiSensy Direct API
3. Makes the API call to AiSensy

**Code:**
```javascript
async function sendTextMessage(user_id, to, text, recipient_type = 'individual') {
  // Get user's AiSensy token
  const token = await tokenManager.getToken(user_id);
  
  if (!token) {
    throw new Error('No AiSensy token found for user');
  }
  
  // Format payload for AiSensy Direct API
  const payload = {
    to: to,
    type: 'text',
    recipient_type: recipient_type,
    text: {
      body: text
    }
  };
  
  // Call AiSensy Direct API
  const response = await axios.post(
    'https://backend.aisensy.com/direct-apis/t1/messages',
    payload,
    {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return {
    success: true,
    data: response.data,
    message_id: response.data.messages?.[0]?.id
  };
}
```

---

### Step 9: AiSensy Direct API

**API Call:**
```http
POST https://backend.aisensy.com/direct-apis/t1/messages
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "to": "917089379345",
  "type": "text",
  "recipient_type": "individual",
  "text": {
    "body": "Hello"
  }
}
```

**Response:**
```json
{
  "messages": [
    {
      "id": "wamid.HBgLOTE3MDg5Mzc5MzQ1FQIAERgSQzBGRjY5QzQyRjI3NzQxRjhBMzI0QzI5RjE5OEJDNUEA"
    }
  ],
  "contacts": [
    {
      "input": "917089379345",
      "wa_id": "917089379345"
    }
  ],
  "messaging_product": "whatsapp"
}
```

---

### Step 10: WhatsApp Delivers Message

AiSensy's backend sends the message to WhatsApp's servers, and the message is delivered to the recipient's phone.

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Your UI                                                      │
│    POST /api/unified-whatsapp/send-message                      │
│    { messageText: "Hello", messageType: "text", ... }           │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. wapi-api/controllers/unified-whatsapp.controller.js          │
│    sendMessage() - Validates request                            │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. wapi-api/services/whatsapp/unified-whatsapp.service.js       │
│    sendMessage() - Routes to provider                           │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. getProvider() - Queries database                             │
│    db.whatsapp_wabas.findOne({ user_id, is_active: true })     │
│    Returns: { provider: "business_api" } ❌ WRONG!              │
│    Should return: { provider: "aisensy" } ✅ CORRECT!           │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
         ┌───────────────┴───────────────┐
         ↓                               ↓
┌──────────────────────┐    ┌──────────────────────────────────┐
│ ❌ CURRENT PATH      │    │ ✅ CORRECT PATH (After Fix)      │
│ BusinessAPIProvider  │    │ AisensyProvider                  │
└──────┬───────────────┘    └──────┬───────────────────────────┘
       ↓                            ↓
┌──────────────────────┐    ┌──────────────────────────────────┐
│ Meta WhatsApp API    │    │ 5. aisensy.service.js            │
│ graph.facebook.com   │    │    Forwards to aisency-api       │
└──────┬───────────────┘    └──────┬───────────────────────────┘
       ↓                            ↓
┌──────────────────────┐    ┌──────────────────────────────────┐
│ ❌ Permission Error  │    │ 6. aisency-api                   │
│ 400: (#10) No perms  │    │    POST /aisensy/messages        │
└──────────────────────┘    └──────┬───────────────────────────┘
                                   ↓
                            ┌──────────────────────────────────┐
                            │ 7. send_text_message.js          │
                            │    Gets token, formats payload   │
                            └──────┬───────────────────────────┘
                                   ↓
                            ┌──────────────────────────────────┐
                            │ 8. AiSensy Direct API            │
                            │    backend.aisensy.com           │
                            │    Authorization: Bearer <token> │
                            └──────┬───────────────────────────┘
                                   ↓
                            ┌──────────────────────────────────┐
                            │ 9. WhatsApp                      │
                            │    ✅ Message Delivered!         │
                            └──────────────────────────────────┘
```

---

## 🔍 The Key Database Query

**This is the query that determines which provider is used:**

```javascript
// File: wapi-api/services/whatsapp/unified-whatsapp.service.js
// Function: getProvider()

const waba = await WhatsappWaba.findOne({
  user_id: userId,
  is_active: true,
  deleted_at: null
});

const providerType = waba.provider || PROVIDER_TYPES.BUSINESS_API;
//                   ^^^^^^^^^^^^^ THIS VALUE DETERMINES EVERYTHING!
```

**Current database value:**
```javascript
{
  _id: ObjectId("..."),
  user_id: ObjectId("6a03008bf542cc0960006058"),
  provider: "business_api",  // ❌ This causes BusinessAPIProvider to be used
  is_active: true
}
```

**After fix:**
```javascript
{
  _id: ObjectId("..."),
  user_id: ObjectId("6a03008bf542cc0960006058"),
  provider: "aisensy",  // ✅ This will cause AisensyProvider to be used
  is_active: true
}
```

---

## 🚀 The Fix Command

```bash
mongo wapi --eval 'db.whatsapp_wabas.updateMany({ user_id: ObjectId("6a03008bf542cc0960006058") }, { $set: { provider: "aisensy" } })'
```

This single command changes the `provider` field from `"business_api"` to `"aisensy"`, which makes the system use the correct provider!

---

## 📝 Summary

**Current Flow:**
```
UI → Controller → Service → getProvider() → Database: "business_api" 
→ BusinessAPIProvider → Meta API → ❌ Permission Error
```

**After Fix:**
```
UI → Controller → Service → getProvider() → Database: "aisensy"
→ AisensyProvider → aisensy.service → aisency-api → AiSensy Direct API 
→ WhatsApp → ✅ Message Delivered!
```

**The entire problem is one database field:** `provider: "business_api"` vs `provider: "aisensy"`

