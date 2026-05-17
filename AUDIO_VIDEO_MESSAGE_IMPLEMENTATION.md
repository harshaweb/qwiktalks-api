# Audio & Video Message Implementation

## Overview
Implemented audio and video message support following the same pattern as text messages, using AiSensy Direct API.

## Implementation Details

### Files Created

1. **`/aisency-api/functions/message/send_audio_message.js`**
   - Sends audio messages via AiSensy Direct API
   - Accepts audio link URL
   - Returns message ID on success

2. **`/aisency-api/functions/message/send_video_message.js`**
   - Sends video messages via AiSensy Direct API
   - Accepts video link URL and optional caption
   - Returns message ID on success

### Files Updated

1. **`/aisency-api/routes/message/messages.js`**
   - Added audio message handling
   - Added video message handling
   - Updated supported types list

2. **`/wapi-api/services/whatsapp/providers/aisensy.provider.js`**
   - Added audio message payload construction
   - Added video message payload construction
   - Updated database save to include audio/video file URLs

## API Usage

### Send Audio Message

**Endpoint**: `POST /api/whatsapp/send`

**Request Body**:
```json
{
  "contact_no": "919876543210",
  "whatsapp_phone_number_id": "your_phone_number_id",
  "messageType": "audio",
  "mediaUrl": "https://example.com/audio.mp3"
}
```

**Or with file upload**:
```json
{
  "contact_no": "919876543210",
  "whatsapp_phone_number_id": "your_phone_number_id",
  "messageType": "audio"
}
```
With file attached as `file_url` in multipart/form-data

### Send Video Message

**Endpoint**: `POST /api/whatsapp/send`

**Request Body**:
```json
{
  "contact_no": "919876543210",
  "whatsapp_phone_number_id": "your_phone_number_id",
  "messageType": "video",
  "mediaUrl": "https://example.com/video.mp4",
  "messageText": "Optional caption"
}
```

**Or with file upload**:
```json
{
  "contact_no": "919876543210",
  "whatsapp_phone_number_id": "your_phone_number_id",
  "messageType": "video",
  "messageText": "Optional caption"
}
```
With file attached as `file_url` in multipart/form-data

## AiSensy API Format

### Audio Message Payload
```json
{
  "to": "917089379345",
  "type": "audio",
  "recipient_type": "individual",
  "user_id": "user_id_here",
  "audio": {
    "link": "https://example.com/audio.mp3"
  }
}
```

### Video Message Payload
```json
{
  "to": "917089379345",
  "type": "video",
  "recipient_type": "individual",
  "user_id": "user_id_here",
  "video": {
    "link": "https://example.com/video.mp4",
    "caption": "Optional caption"
  }
}
```

## Message Flow

1. **Frontend** → Sends request to `/api/whatsapp/send` with `messageType: "audio"` or `"video"`
2. **wapi-api Controller** → Validates and processes request
3. **Unified WhatsApp Service** → Routes to appropriate provider
4. **AiSensy Provider** → Constructs payload based on message type
5. **AiSensy Service** → Forwards to aisency-api
6. **aisency-api** → Calls appropriate function (`send_audio_message` or `send_video_message`)
7. **Token Manager** → Handles authentication and token refresh
8. **AiSensy Direct API** → Sends message via WhatsApp
9. **Database** → Saves message record with file URL
10. **Response** → Returns success with message details

## Supported Media Types

| Type | Extension | Caption Support | Notes |
|------|-----------|----------------|-------|
| Audio | .mp3, .ogg, .wav, .m4a | ❌ No | Audio files only |
| Video | .mp4, .mov, .avi | ✅ Yes | Video with optional caption |
| Image | .jpg, .png, .webp, .gif | ✅ Yes | Already implemented |
| Document | .pdf, .doc, .docx, etc. | ✅ Yes | Already implemented |

## Database Schema

Messages are saved with the following fields:

```javascript
{
  sender_number: String,        // Business phone number
  user_id: ObjectId,            // User ID
  recipient_number: String,     // Contact phone number
  contact_id: ObjectId,         // Contact ID
  content: String,              // Caption or "audio: media" / "video: media"
  message_type: String,         // "audio" or "video"
  file_url: String,             // URL of the audio/video file
  from_me: Boolean,             // true
  direction: String,            // "outbound"
  wa_message_id: String,        // WhatsApp message ID from AiSensy
  wa_timestamp: Date,           // Message timestamp
  metadata: Object,             // Full API response
  provider: String              // "aisensy"
}
```

## Error Handling

- ✅ Returns 200 OK if message sent successfully
- ✅ Logs database errors but doesn't fail the request
- ✅ Returns 500 only if AiSensy API call fails
- ✅ Validates required fields (audio/video link)
- ✅ Handles file uploads and URL-based media

## Testing

### Test Audio Message
```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "contact_no": "919876543210",
    "whatsapp_phone_number_id": "your_phone_number_id",
    "messageType": "audio",
    "mediaUrl": "https://aisensy-project-media-library-stg.s3.ap-south-1.amazonaws.com/AUDIO/6245d025fcb7966c46294618/565346_fileexampleMP3700KB.mp3"
  }'
```

### Test Video Message
```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "contact_no": "919876543210",
    "whatsapp_phone_number_id": "your_phone_number_id",
    "messageType": "video",
    "mediaUrl": "https://example.com/video.mp4",
    "messageText": "Check out this video!"
  }'
```

## Expected Response

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": "message_id_from_database",
    "sender_number": "919876543210",
    "recipient_number": "917089379345",
    "content": "audio: media",
    "message_type": "audio",
    "file_url": "https://example.com/audio.mp3",
    "wa_message_id": "wamid.xxx",
    "wa_timestamp": "2024-01-15T10:30:00.000Z",
    "from_me": true,
    "direction": "outbound",
    "provider": "aisensy"
  }
}
```

## Notes

- Audio messages do NOT support captions (WhatsApp limitation)
- Video messages support optional captions
- File size limits apply (check AiSensy documentation)
- Supported audio formats: MP3, OGG, WAV, M4A
- Supported video formats: MP4, MOV, AVI
- All messages go through AiSensy Direct API, NOT Meta API directly
- Token management is automatic with refresh on 401 errors
