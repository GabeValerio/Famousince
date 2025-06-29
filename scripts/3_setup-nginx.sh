#!/bin/bash
set -e  # Exit on error

source "$(dirname "$0")/config.env.project"

echo "🌐 Setting up Nginx for $DOMAIN..."

ssh root@$SERVER_IP <<EOF
set -e  # Exit on error

# Create Nginx configuration
echo "📝 Creating Nginx configuration..."
cat > "/etc/nginx/sites-available/$DOMAIN" << 'NGINXEOF'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF

# Enable the site
echo "🔗 Creating symbolic link..."
if [ ! -L "/etc/nginx/sites-enabled/$DOMAIN" ]; then
    ln -s "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/"
fi

# Test and reload Nginx
echo "🔄 Testing and reloading Nginx..."
nginx -t && systemctl reload nginx

echo "✅ Nginx configuration completed!"
echo "⚠️  Next step: Run ./scripts/enable-ssl.sh to set up SSL"
EOF

echo "🎉 Nginx configured for $DOMAIN" 