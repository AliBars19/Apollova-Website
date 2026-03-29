#!/bin/bash
set -e

APP_DIR="/root/Apollova-Website/Apollova"
PM2_NAME="apollova"

echo "=== Apollova Deploy ==="

cd "$APP_DIR/.."
git fetch origin main
git reset --hard origin/main

cd "$APP_DIR"
npm install --production=false
npm run build

pm2 restart "$PM2_NAME"
echo "=== Deploy complete ==="
