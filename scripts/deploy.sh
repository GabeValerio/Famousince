#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Load configuration
CONFIG_FILE="scripts/config.env.project"
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}[ERROR]${NC} Configuration file not found: $CONFIG_FILE"
    exit 1
fi

# Source the configuration file
source "$CONFIG_FILE"

# Convert PROJECT_NAME to lowercase for env file
PROJECT_NAME_LOWER=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]')

# Function to show step information
show_step() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

# Function to show success message
show_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to show error message and exit
show_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Function to check if last command was successful
check_status() {
    if [ $? -ne 0 ]; then
        show_error "$1"
    fi
}

# Get commit message
if [ -z "$1" ]; then
    read -p "Enter commit message: " commit_message
else
    commit_message="$1"
fi

# Check if we're in a git repository
if [ ! -d .git ]; then
    show_error "Not in a git repository. Please run this script from the root of your project."
fi

# Local Git Operations
show_step "Checking git status..."
git status
check_status "Failed to get git status"

# Only proceed with commit if there are changes
if [[ -n "$(git status --porcelain)" ]]; then
    show_step "Adding all changes..."
    git add .
    check_status "Failed to add files"

    show_step "Committing changes..."
    git commit -m "$commit_message"
    check_status "Failed to commit changes"

    show_step "Pushing to GitHub..."
    git push origin main
    check_status "Failed to push to GitHub"
else
    show_step "No changes to commit, proceeding with deployment..."
fi

# Remote Server Deployment
show_step "Deploying to production server..."

# Create the remote script with proper variable substitution
REMOTE_SCRIPT="
cd $DOMAIN || exit 1

echo 'Checking Git remote URL...'
current_url=\$(git remote get-url origin)
if [[ \$current_url == https* ]]; then
    echo 'Updating Git remote to use SSH...'
    ssh_url=\$(echo \$current_url | sed 's|https://github.com/|git@github.com:|')
    git remote set-url origin \$ssh_url
fi

echo 'Pulling latest changes...'
git pull origin main || exit 1

echo 'Loading environment variables...'
source /root/.env.$PROJECT_NAME_LOWER || exit 1

echo 'Installing dependencies...'
npm install || exit 1

echo 'Building application...'
npm run build || exit 1

echo 'Restarting PM2 process...'
pm2 delete $DOMAIN 2>/dev/null || true
pm2 start npm --name \"$DOMAIN\" -- start -- -p $PORT || exit 1
pm2 save || exit 1

echo 'Verifying application status...'
sleep 5
if ! curl -s -f http://localhost:$PORT > /dev/null; then
    echo 'Application failed to start properly'
    exit 1
fi
"

# Execute the remote script
ssh -A root@"${SERVER_IP}" "${REMOTE_SCRIPT}"

check_status "Failed to deploy to production server"

show_success "🚀 Deployment completed successfully!" 