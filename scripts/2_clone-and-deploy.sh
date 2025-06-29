#!/bin/bash
set -e  # Exit on error

# Source configuration
source "$(dirname "$0")/config.env.project"

echo "🔄 Deploying $PROJECT_NAME to server..."

# Create a heredoc with proper environment variables
ssh root@$SERVER_IP <<EOF
set -e  # Exit on error

echo "📦 Preparing deployment environment..."
cd /root

# Stop existing PM2 process if it exists
echo "🛑 Stopping existing PM2 process..."
pm2 delete "$DOMAIN" || true

# Remove existing directory (any case)
echo "🗑️  Cleaning up old files..."
rm -rf $PROJECT_NAME* [Ff]amous[Ii]nce*

# Clone fresh copy
echo "📥 Cloning repository..."
git clone $GITHUB_URL
REPO_DIR=\$(ls -d */ | grep -i "\$PROJECT_NAME" | head -n 1)

if [ -z "\$REPO_DIR" ]; then
    echo "❌ Failed to find repository directory after clone"
    exit 1
fi

echo "📂 Entering directory \$REPO_DIR"
cd "\$REPO_DIR"

# Create server environment file if it doesn't exist
if [ ! -f "/root/.env.$PROJECT_NAME" ]; then
    echo "📝 Creating environment file..."
    cat > "/root/.env.$PROJECT_NAME" << 'ENVEOF'
export PORT=$PORT
export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
export NEXTAUTH_SECRET=your_secret_key
export NEXT_PUBLIC_BASE_URL=https://$DOMAIN
export NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=cloud_name
export CLOUDINARY_API_KEY=your_cloudinary_key
export CLOUDINARY_API_SECRET=your_cloudinary_secret
ENVEOF
    echo "⚠️  Please update environment variables in /root/.env.$PROJECT_NAME"
fi

# Update .bashrc to load environment variables
echo "📝 Adding project to .bashrc set_env function..."
if ! grep -q "/root/\$REPO_DIR" ~/.bashrc; then
    # Find the last case entry and add our new one after it
    sed -i '/esac/i\        "\/root\/'"$REPO_DIR"'")\n            source ~\/.env.'"$PROJECT_NAME"'\n            ;;' ~/.bashrc
fi

# Source the environment file for the current session
echo "🔧 Loading environment variables..."
source "/root/.env.$PROJECT_NAME"

# Install dependencies
echo "📚 Installing dependencies..."
npm install

# Build the application
echo "🏗️  Building the application..."
npm run build

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 start npm --name "$DOMAIN" -- start -- -p \$PORT
pm2 save

echo "✅ Deployment completed successfully!"
echo "⚠️  Next steps:"
echo "1. Update environment variables in /root/.env.$PROJECT_NAME"
echo "2. Run ./scripts/setup-nginx.sh to configure Nginx"
echo "3. Run ./scripts/enable-ssl.sh to set up SSL"
EOF

echo "🎉 Project $PROJECT_NAME deployed to $DOMAIN on port $PORT" 