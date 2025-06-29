#!/bin/bash
set -e  # Exit on error

# Source configuration
source "$(dirname "$0")/config.env.project"

# Check if env file exists
ENV_FILE="$(dirname "$0")/env.production"
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Environment file not found at $ENV_FILE"
    echo "Please copy scripts/env.template to scripts/env.production and fill in your values"
    exit 1
fi

echo "🔄 Deploying $PROJECT_NAME to GetValerio Server on Digital Ocean..."

# Convert project name to lowercase for env file
PROJECT_NAME_LOWER=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]')

# Copy env file to server first with lowercase name
scp "$ENV_FILE" "root@$SERVER_IP:/root/.env.$PROJECT_NAME_LOWER"

# Create a heredoc with proper environment variables
ssh -t root@$SERVER_IP <<EOF
set -e  # Exit on error

echo "📦 Preparing deployment environment..."
cd /root

# Stop existing PM2 process if it exists
echo "🛑 Stopping existing PM2 process..."
pm2 delete "$DOMAIN" || true

# Remove existing directory (any case)
echo "🗑️  Cleaning up old files..."
rm -rf $PROJECT_NAME* [Ff]amous[Ii]nce*

# Clone fresh copy and rename to standard format (capital first letter)
echo "📥 Cloning repository..."
git clone $GITHUB_URL "${PROJECT_NAME}.com"
cd "${PROJECT_NAME}.com"

# Update .bashrc to load environment variables (using lowercase for env file)
echo "📝 Adding project to .bashrc set_env function..."
if ! grep -q "/root/${PROJECT_NAME}.com" ~/.bashrc; then
    # Find the last case entry and add our new one after it
    sed -i '/esac/i\        "\/root\/'"${PROJECT_NAME}.com"'")\n            source ~\/.env.'"$PROJECT_NAME_LOWER"'\n            ;;' ~/.bashrc
fi

# Source the environment file for the current session (lowercase)
echo "🔧 Loading environment variables..."
source "/root/.env.$PROJECT_NAME_LOWER"

# Install dependencies
echo "📚 Installing dependencies..."
npm install

# Build the application
echo "🏗️  Building the application..."
npm run build

# Start with PM2 (using original case for directory name)
echo "🚀 Starting application with PM2..."
PORT=$PORT pm2 start npm --name "$DOMAIN" -- start -- -p $PORT
pm2 save

echo "✅ Deployment completed successfully!"
echo "⚠️  Next steps:"
echo "1. Verify environment variables in /root/.env.$PROJECT_NAME_LOWER"
echo "2. Run ./scripts/3_setup-nginx.sh to configure Nginx"
echo "3. Run ./scripts/4_enable-ssl.sh to set up SSL"
EOF

echo "🎉 Project $PROJECT_NAME deployed to $DOMAIN on port $PORT" 