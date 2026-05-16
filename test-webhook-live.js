/**
 * Test Live Webhook
 * Tests the deployed webhook at api.qwiktalks.com
 */

import axios from 'axios';

const WEBHOOK_URL = 'https://api.qwiktalks.com/webhook/whatsapp';

// Sample webhook payload
const sampleMessage = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "2407280353089470",
      changes: [
        {
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "916393489446",
              phone_number_id: "1038713089333219"
            },
            contacts: [
              {
                profile: {
                  name: "Test User"
                },
                wa_id: "919219156040"
              }
            ],
            messages: [
              {
                from: "919219156040",
                id: "test_" + Date.now(),
                timestamp: Math.floor(Date.now() / 1000).toString(),
                text: {
                  body: "Test message from script"
                },
                type: "text"
              }
            ]
          },
          field: "messages"
        }
      ]
    }
  ]
};

async function testWebhook() {
  console.log('🧪 Testing Live Webhook...\n');
  console.log('Webhook URL:', WEBHOOK_URL);
  console.log('');

  try {
    // Test 1: Webhook verification
    console.log('📋 Test 1: Webhook Verification');
    const verifyUrl = `${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=qwiktalks_secure_webhook_token_2024&hub.challenge=test123`;
    
    try {
      const verifyResponse = await axios.get(verifyUrl);
      console.log('✅ Verification successful');
      console.log('   Response:', verifyResponse.data);
    } catch (verifyError) {
      console.log('❌ Verification failed');
      console.log('   Error:', verifyError.response?.data || verifyError.message);
    }
    console.log('');

    // Test 2: Send test message
    console.log('📋 Test 2: Send Test Message');
    try {
      const messageResponse = await axios.post(WEBHOOK_URL, sampleMessage, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Message sent successfully');
      console.log('   Status:', messageResponse.status);
      console.log('   Response:', messageResponse.data);
    } catch (messageError) {
      console.log('❌ Message send failed');
      console.log('   Status:', messageError.response?.status);
      console.log('   Error:', messageError.response?.data || messageError.message);
    }
    console.log('');

    console.log('🎉 Test completed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Check your server logs for webhook processing');
    console.log('2. Check MongoDB for the test message');
    console.log('3. Check your UI for the new message');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWebhook();
