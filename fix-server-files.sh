#!/bin/bash

echo "🔧 Server Fix Instructions"
echo "=========================="
echo ""
echo "Run these commands on your server to fix the issues:"
echo ""

cat << 'COMMANDS'
# 1. Fix aisency-api duplicate declaration
cd /root/aisency/aisency-api

# Backup first
cp index.js index.js.backup.$(date +%s)

# Edit the file to remove duplicate
nano index.js

# Find and remove these duplicate lines (around line 96):
# const sendMessageRoutes = require('./routes/message/send_message');

# And remove this duplicate line (around line 143):
# app.use('/aisensy', sendMessageRoutes);

# Save and exit (Ctrl+X, Y, Enter)

# 2. Restart aisency-api
pm2 restart aisency-api

# 3. Check if it's running
pm2 logs aisency-api --lines 20

COMMANDS

echo ""
echo "After fixing, the server should start without errors."
