#!/bin/bash

echo "🔍 WhatsApp Webhook Diagnostic Tool"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

WEBHOOK_URL="https://api.qwiktalks.com/webhook/whatsapp"
VERIFY_TOKEN="qwiktalks_secure_webhook_token_2024"

echo "📋 Test 1: Server Health Check"
echo "------------------------------"
response=$(curl -s -o /dev/null -w "%{http_code}" https://api.qwiktalks.com/)
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✅ Server is running (HTTP $response)${NC}"
else
    echo -e "${RED}❌ Server issue (HTTP $response)${NC}"
fi
echo ""

echo "📋 Test 2: Webhook Verification"
echo "------------------------------"
verify_url="${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test123"
verify_response=$(curl -s "$verify_url")
if [ "$verify_response" = "test123" ]; then
    echo -e "${GREEN}✅ Webhook verification successful${NC}"
    echo "   Response: $verify_response"
else
    echo -e "${RED}❌ Webhook verification failed${NC}"
    echo "   Response: $verify_response"
    echo "   Expected: test123"
fi
echo ""

echo "📋 Test 3: Webhook Endpoint Accessibility"
echo "----------------------------------------"
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WEBHOOK_URL" -H "Content-Type: application/json" -d '{}')
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✅ Webhook endpoint is accessible (HTTP $response)${NC}"
else
    echo -e "${RED}❌ Webhook endpoint issue (HTTP $response)${NC}"
fi
echo ""

echo "📋 Test 4: SSL Certificate"
echo "-------------------------"
ssl_check=$(curl -s -o /dev/null -w "%{ssl_verify_result}" https://api.qwiktalks.com/)
if [ "$ssl_check" = "0" ]; then
    echo -e "${GREEN}✅ SSL certificate is valid${NC}"
else
    echo -e "${RED}❌ SSL certificate issue (code: $ssl_check)${NC}"
fi
echo ""

echo "📋 Summary"
echo "----------"
echo "Webhook URL: $WEBHOOK_URL"
echo "Verify Token: $VERIFY_TOKEN"
echo ""
echo "Next steps:"
echo "1. If all tests pass, check Meta webhook configuration"
echo "2. Check server logs: pm2 logs wapi-api"
echo "3. Check MongoDB for messages"
echo "4. Check browser console for Socket.IO connection"
echo ""
echo "For detailed troubleshooting, see: TROUBLESHOOTING.md"
