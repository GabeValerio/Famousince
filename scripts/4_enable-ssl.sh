#!/bin/bash
set -e  # Exit on error

source "$(dirname "$0")/config.env.project"

echo "🔐 Enabling SSL for $DOMAIN..."

ssh root@$SERVER_IP <<EOF
set -e  # Exit on error

echo "📜 Requesting SSL certificate..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m gabrieljosevalerio1@gmail.com

echo "✅ SSL certificate installed!"
echo "🔄 Testing Nginx configuration..."
nginx -t && systemctl reload nginx
EOF

echo "🎉 SSL enabled for $DOMAIN" 