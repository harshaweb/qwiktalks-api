# Automatic Webhook Update Implementation

## Overview
Implemented automatic webhook update system that updates AiSensy webhook URL when users log in or authenticate. This ensures that all WhatsApp messages are routed to the correct webhook endpoint.

## Implementation Details

### Files Created

1. **`/aisency-api/functions/settings/update_webhook.js`**
   - Updates webhook URL via AiSensy Direct API
   - Uses token manager for automatic authentication
   - Endpoint: `PATCH /direct-apis/t1/settings/update-webhook`

2. **`/aisency-api/routes/settings.routes.js`**
   - Route handler for webhook update requests
   - Validates user_id and webhook_url
   - Endpoint: `PATCH /aisensy/settings/webhook`

3. **`/wapi-api/controllers/webhook-settings.controller.js`**
   - Controller for webhook management
   - Provides endpoints for status, update, and trigger
   - Admin endpoint for bulk updates

4. **`/wapi-api/routes/webhook-settings.routes.js`**
   - Routes for webhook settings management
   - All routes require authentication
   - Admin routes require admin role

### Files Updated

1. **`/aisency-api/index.js`**
   - Added settings routes
   - Endpoint: `/aisensy/settings/*`

2. **`/wapi-api/aisency/aisensy.service.js`**
   - Added `updateWebhook()` method
   - Forwards webhook update requests to aisency-api

3. **`/wapi-api/services/aisensy-webhook-updater.service.js`**
   - Updated to use new webhook update service
   - Removed direct API calls
   - Uses aisensyService for webhook updates

4. **`/wapi-api/controllers/auth.controller.js`**
   - Added automatic webhook update on login
   - Triggers in background (non-blocking)
   - Controlled by environment variable

5. **`/wapi-api/app.js`**
   - Added webhook settings routes
   - Endpoint: `/api/webhook-settings/*`

## Environment Variables

Add these to your `.env` file:

```env
# Webhook Configuration
AISENSY_WEBHOOK_URL=https://api.qwiktalks.com/webhook/whatsapp

# Auto-update settings
AUTO_UPDATE_WEBHOOK_ON_LOGIN=true
AUTO_UPDATE_WEBHOOK_ON_REGISTER=true
```

## API Endpoints

### 1. Get Webhook Status
**Endpoint**: `GET /api/webhook-settings/status`

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response**:
```json
{
  "success": true,
  "webhook_url": "https://api.qwiktalks.com/webhook/whatsapp",
  "auto_update_on_login": true,
  "auto_update_on_register": true
}
```

### 2. Update Webhook (Manual)
**Endpoint**: `POST /api/webhook-settings/update`

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body** (optional):
```json
{
  "webhook_url": "https://custom-webhook-url.com/webhook"
}
```
*If webhook_url is not provided, uses default from environment variable*

**Response**:
```json
{
  "success": true,
  "message": "Webhook updated successfully",
  "webhook_url": "https://api.qwiktalks.com/webhook/whatsapp",
  "data": {
    // AiSensy API response
  }
}
```

### 3. Trigger Webhook Update
**Endpoint**: `POST /api/webhook-settings/trigger`

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response**:
```json
{
  "success": true,
  "message": "Webhook updated successfully",
  "data": {
    "success": true,
    "user_id": "user_id_here",
    "email": "user@example.com",
    "webhook_url": "https://api.qwiktalks.com/webhook/whatsapp"
  }
}
```

### 4. Update All Webhooks (Admin Only)
**Endpoint**: `POST /api/webhook-settings/update-all`

**Headers**:
```
Authorization: Bearer ADMIN_JWT_TOKEN
```

**Response**:
```json
{
  "success": true,
  "message": "Webhook update completed",
  "results": {
    "total": 100,
    "success": 95,
    "failed": 3,
    "skipped": 2,
    "details": [
      {
        "success": true,
        "user_id": "user_id_1",
        "email": "user1@example.com",
        "webhook_url": "https://api.qwiktalks.com/webhook/whatsapp"
      },
      // ... more results
    ]
  }
}
```

## Automatic Webhook Update Flow

### On User Login

1. User logs in via `/api/auth/login`
2. Authentication successful
3. If `AUTO_UPDATE_WEBHOOK_ON_LOGIN=true`:
   - Webhook updater service is called in background
   - User ID is passed to aisency-api
   - Token manager generates/retrieves JWT token
   - AiSensy Direct API is called to update webhook
   - Success/failure is logged (doesn't block login)

### On User Registration

1. User registers via `/api/auth/register`
2. Account created successfully
3. If `AUTO_UPDATE_WEBHOOK_ON_REGISTER=true`:
   - Webhook updater service is called in background
   - Similar flow as login

### Manual Trigger

1. User or admin calls `/api/webhook-settings/trigger`
2. Webhook updater service is called synchronously
3. Returns success/failure response

## AiSensy API Integration

### Webhook Update Request

**Endpoint**: `PATCH https://backend.aisensy.com/direct-apis/t1/settings/update-webhook`

**Headers**:
```
Accept: application/json
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

**Request Body**:
```json
{
  "webhooks": {
    "url": "https://api.qwiktalks.com/webhook/whatsapp"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Webhook updated successfully"
}
```

## Message Flow

### wapi-api → aisency-api → AiSensy

1. **wapi-api** receives webhook update request
2. **aisensyService** forwards to aisency-api
3. **aisency-api** receives request at `/aisensy/settings/webhook`
4. **update_webhook.js** function is called
5. **tokenManager** generates/retrieves JWT token
6. **AiSensy Direct API** is called with token
7. Response flows back through the chain

## Error Handling

- ✅ Non-blocking: Login/registration continues even if webhook update fails
- ✅ Logging: All webhook updates are logged with success/failure
- ✅ Token refresh: Automatic token refresh on 401 errors
- ✅ Validation: Webhook URL format is validated
- ✅ Graceful degradation: System works even if webhook update fails

## Testing

### Test Automatic Update on Login

1. Set `AUTO_UPDATE_WEBHOOK_ON_LOGIN=true` in `.env`
2. Login via `/api/auth/login`
3. Check logs for:
   ```
   [Webhook Updater] Updating webhook for user: user@example.com
   ✅ Auto-updated webhook for user: user@example.com
   ```

### Test Manual Update

```bash
curl -X POST http://localhost:3000/api/webhook-settings/trigger \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Custom Webhook URL

```bash
curl -X POST http://localhost:3000/api/webhook-settings/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_url": "https://custom-url.com/webhook"
  }'
```

### Test Admin Bulk Update

```bash
curl -X POST http://localhost:3000/api/webhook-settings/update-all \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## Monitoring

### Check Webhook Status

```bash
curl -X GET http://localhost:3000/api/webhook-settings/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Check Logs

Look for these log messages:

- `[Webhook Updater] Updating webhook for user: user@example.com`
- `✅ Auto-updated webhook for user: user@example.com`
- `❌ Failed to auto-update webhook for user: user@example.com`
- `[AiSensy] Updating webhook for user user_id to: webhook_url`
- `[AiSensy] Webhook updated successfully`

## Troubleshooting

### Webhook Not Updating

1. Check environment variables:
   ```bash
   echo $AUTO_UPDATE_WEBHOOK_ON_LOGIN
   echo $AISENSY_WEBHOOK_URL
   ```

2. Check AiSensy credentials in database:
   ```javascript
   db.aisensy_businesses.findOne({ user_id: "user_id" })
   ```

3. Check token generation:
   - Ensure username, password, and project_id are set
   - Check token expiry

4. Check logs for errors:
   - Token generation errors
   - API call errors
   - Network errors

### Manual Webhook Update

If automatic update fails, use manual trigger:

```bash
curl -X POST http://localhost:3000/api/webhook-settings/trigger \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Considerations

- ✅ All endpoints require authentication
- ✅ Admin endpoints require admin role
- ✅ Webhook URL is validated before update
- ✅ JWT tokens are used for AiSensy API calls
- ✅ Tokens are automatically refreshed
- ✅ Sensitive data is not logged

## Notes

- Webhook updates are non-blocking and run in background
- Failed webhook updates don't prevent login/registration
- Webhook URL can be customized per user if needed
- Admin can trigger bulk updates for all users
- System uses AiSensy Direct API, NOT Meta API directly
