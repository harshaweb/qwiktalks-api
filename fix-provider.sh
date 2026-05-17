#!/bin/bash

echo "🔍 Checking and Fixing Provider Configuration"
echo "=============================================="
echo ""

# Check current provider
echo "1. Checking current provider..."
mongo wapi --quiet --eval 'db.whatsapp_wabas.find({ user_id: ObjectId("6a03008bf542cc0960006058") }, { provider: 1, is_active: 1, display_phone_number: 1 }).forEach(printjson)'

echo ""
echo "2. Updating provider to 'aisensy'..."
mongo wapi --quiet --eval 'db.whatsapp_wabas.updateMany({ user_id: ObjectId("6a03008bf542cc0960006058") }, { $set: { provider: "aisensy" } })'

echo ""
echo "3. Verifying the change..."
mongo wapi --quiet --eval 'db.whatsapp_wabas.find({ user_id: ObjectId("6a03008bf542cc0960006058") }, { provider: 1, is_active: 1, display_phone_number: 1 }).forEach(printjson)'

echo ""
echo "4. Restarting qwiktalks-api..."
pm2 restart qwiktalks-api

echo ""
echo "✅ Done! Now try sending a message from your UI."
echo ""
echo "Check logs with: pm2 logs qwiktalks-api --lines 50 | grep -i aisensy"
