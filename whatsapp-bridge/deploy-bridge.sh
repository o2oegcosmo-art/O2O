#!/bin/bash
# O2OEG WhatsApp Bridge Deployment Script
# This script runs locally on the server for maximum stability

export PATH=$PATH:/usr/local/bin:/usr/bin:/bin

echo "🚀 Starting Bridge Update..."
cd "$(dirname "$0")"

# 1. Skip npm install to save RAM and prevent Signal 143
echo "⏭️ Skipping npm install (using existing node_modules)..."

# 2. Manage PM2 Process
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin
if command -v pm2 >/dev/null 2>&1; then
    echo "⚙️ Reloading PM2 process..."
    pm2 reload o2oeg-bridge || pm2 restart o2oeg-bridge || pm2 start index.js --name o2oeg-bridge
else
    echo "⚠️ PM2 not found, using pkill fallback..."
    pkill -f "node index.js" || true
    sleep 1
    nohup node index.js > bridge.log 2>&1 </dev/null &
fi

echo "✅ Bridge Update Finished."
